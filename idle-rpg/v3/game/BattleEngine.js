const enumHelper = require('../../utils/enumHelper');
const { errorLog } = require('../../utils/logger');
const { pvpLevelRestriction } = require('../../../settings');
const { randomBetween, capitalizeFirstLetter } = require('../utils/helpers');
const { setImportantMessage, randomCampEventMessage } = require('../utils/messageHelpers');
const { calculateItemRating } = require('../utils/battleHelpers');
const { generatePlayerName, generateGenderString } = require('../utils/formatters');
const BattleSimulator = require('./BattleSimulator');

class BattleEngine {

  constructor({ db, map, inventory, itemGen, player }) {
    this.db = db;
    this.map = map;
    this.inventory = inventory;
    this.itemGen = itemGen;
    this.player = player;
    this.simulator = new BattleSimulator();
  }

  async playerVsMob(playerObj, mobToBattle, multiplier) {
    let updatedPlayer = Object.assign({}, playerObj);
    const eventMsg = [];
    const eventLog = [];
    try {
      const simulatedBattle = await this.simulator.simulateBattle(updatedPlayer, mobToBattle);
      const battleResults = await this.playerVsMobResults(simulatedBattle, multiplier);
      eventMsg.push(...battleResults.msg);
      eventLog.push(...battleResults.pm);
      updatedPlayer = battleResults.updatedPlayer;
      switch (battleResults.result) {
        case enumHelper.battle.outcomes.win: {
          const dropItemResults = await this.dropItem(updatedPlayer, battleResults.updatedMob, eventMsg, eventLog);
          const checkedWinResults = await this.player.checkExperience(dropItemResults.updatedPlayer, eventMsg, eventLog);
          return { type: 'actions', updatedPlayer: checkedWinResults.updatedPlayer, msg: eventMsg, pm: eventLog };
        }
        case enumHelper.battle.outcomes.fled: {
          const checkedFledResults = await this.player.checkExperience(updatedPlayer, eventMsg, eventLog);
          return { type: 'actions', updatedPlayer: checkedFledResults.updatedPlayer, msg: eventMsg, pm: eventLog };
        }
        case enumHelper.battle.outcomes.lost: {
          const checkLostResults = this.player.checkHealth(updatedPlayer, battleResults.updatedMob, eventMsg, eventLog, []);
          return { type: 'actions', updatedPlayer: checkLostResults.updatedPlayer, msg: eventMsg, pm: eventLog };
        }
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async camp(updatedPlayer) {
    const eventMsg = [];
    const eventLog = [];
    try {
      updatedPlayer = this.player.passiveRegen(updatedPlayer, ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.end / 2), ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.int / 2));
      const generatedMessage = randomCampEventMessage(updatedPlayer);
      eventMsg.push(generatedMessage.eventMsg);
      eventLog.push(generatedMessage.eventLog);
      await this.player.logEvent(updatedPlayer, generatedMessage.eventLog, enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async playerVsMobResults(results, multiplier) {
    try {
      const playerMaxHealth = 100 + (results.attacker.level * 5);
      const formatResult = this._pveMessageFormat(results, results.attacker, playerMaxHealth, multiplier);
      const { updatedPlayer, expGain, goldGain, questExpGain, questGoldGain, eventMsg, eventLog, isQuestCompleted } = formatResult;

      if (updatedPlayer.health <= 0) {
        updatedPlayer.battles.lost++;
        await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
        return { result: enumHelper.battle.outcomes.lost, updatedPlayer, updatedMob: results.defender, msg: eventMsg, pm: eventLog };
      }

      if (results.defender.filter(mob => mob.health > 0).length > 0 && updatedPlayer.health > 0) {
        updatedPlayer.experience.current += expGain;
        updatedPlayer.experience.total += expGain;
        updatedPlayer.gold.current += goldGain + questGoldGain;
        updatedPlayer.gold.total += goldGain + questGoldGain;
        await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
        return { result: enumHelper.battle.outcomes.fled, updatedPlayer, updatedMob: results.defender, msg: eventMsg, pm: eventLog };
      }

      updatedPlayer.experience.current += expGain + questExpGain;
      updatedPlayer.experience.total += expGain + questExpGain;
      updatedPlayer.gold.current += goldGain + questGoldGain;
      updatedPlayer.gold.total += goldGain + questGoldGain;
      updatedPlayer.kills.mob++;
      updatedPlayer.battles.won++;
      await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
      if (isQuestCompleted) {
        eventMsg.push(`${generatePlayerName(updatedPlayer, true)} finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
        eventLog.push(`Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
      }
      return { result: enumHelper.battle.outcomes.win, updatedPlayer, updatedMob: results.defender, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  _pveMessageFormat(results, updatedPlayer, playerMaxHealth, multiplier) {
    const mobListResult = [];
    const mobListInfo = { mobs: [] };
    let isQuestCompleted = false;
    const eventMsg = [`[\`${results.attacker.map.name}\`] `];
    const eventLog = [];
    let mobCountString = '';
    let mobKillCountString = '';
    let mobFleeCountString = '';
    let expGain = 0;
    let goldGain = 0;
    let questExpGain = 0;
    let questGoldGain = 0;

    results.defender.forEach((mob) => {
      let infoList = mobListInfo.mobs.findIndex(arrayMob => arrayMob.mob === mob.name);
      if (infoList !== -1) {
        mobListInfo.mobs[infoList].totalCount++;
      } else {
        mobListInfo.mobs.push({ mob: mob.name, totalCount: 0, event: { killed: 0, fled: 0, survived: 0 } });
        infoList = mobListInfo.mobs.length - 1;
      }
      expGain += Math.ceil(((mob.experience) + (mob.dmgDealt / 4)) / 6) * multiplier;

      if (mob.health <= 0) {
        goldGain += Math.floor(mob.gold * multiplier);
        mobListInfo.mobs[infoList].event.killed++;
      } else if (mob.health > 0 && updatedPlayer.health > 0) {
        mobListInfo.mobs[infoList].event.fled++;
        mob.health > updatedPlayer.health ? updatedPlayer.fled.you++ : updatedPlayer.fled.mob++;
      } else if (mob.health > 0 && updatedPlayer.health <= 0) {
        mobListInfo.mobs[infoList].event.survived++;
      }

      if (!updatedPlayer.quest.questMob.name.includes('None') && mob.name.includes(updatedPlayer.quest.questMob.name) && mob.health <= 0) {
        updatedPlayer.quest.questMob.killCount++;
        if (updatedPlayer.quest.questMob.killCount >= updatedPlayer.quest.questMob.count) {
          isQuestCompleted = true;
          questExpGain = Math.ceil((expGain * updatedPlayer.quest.questMob.count) / 2);
          questGoldGain = Math.ceil((goldGain * updatedPlayer.quest.questMob.count) / 2);
          updatedPlayer.quest.questMob.name = 'None';
          updatedPlayer.quest.questMob.count = 0;
          updatedPlayer.quest.questMob.killCount = 0;
          updatedPlayer.quest.completed++;
        }
        updatedPlayer.quest.updated_at = new Date();
      }

      if (Math.floor(results.defenderDamage / results.defender.length) > 0) {
        mobListResult.push(`  ${mob.name}'s ${mob.equipment.weapon.name} did ${mob.dmgDealt} damage.`);
      }
      mobListResult.push(`  ${mob.health <= 0 ? `${mob.name} took ${mob.dmgReceived} dmg and died.` : `${mob.name} took ${mob.dmgReceived} dmg and has ${mob.health} / ${mob.maxHealth} HP left.`}`);
    });

    let battleResult = `\`\`\`Battle Results:\n  You have ${updatedPlayer.health} / ${playerMaxHealth} HP left.\n${mobListResult.join('\n')}\`\`\``;
    if (updatedPlayer.health <= 0) {
      battleResult = battleResult.replace(`  You have ${updatedPlayer.health} / ${playerMaxHealth} HP left.`, '');
      const killerMob = results.defender.reduce((list, mob) => (!mob.dmgDealt > 0 ? list : list.concat(mob.name)), []).join(', ');
      eventMsg.push(`| ${killerMob} just killed ${generatePlayerName(updatedPlayer, true)}!`);
      eventLog.push(`${killerMob} just killed you!`);
    }

    const eventMsgResults = `↳ ${capitalizeFirstLetter(generateGenderString(updatedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg and gained \`${expGain}\` exp${goldGain === 0 ? '' : ` and \`${goldGain}\` gold`}! [HP:${updatedPlayer.health}/${playerMaxHealth}]`;

    mobListInfo.mobs.forEach((mobInfo, i) => {
      const totalCount = mobInfo.event.killed + mobInfo.event.fled + mobInfo.event.survived;
      mobCountString = i > 0 ? mobCountString.concat(`, ${totalCount}x \`${mobInfo.mob}\``) : mobCountString.concat(`${totalCount}x \`${mobInfo.mob}\``);
      if (mobInfo.event.killed > 0) {
        mobKillCountString = mobKillCountString !== '' ? mobKillCountString.concat(`, ${mobInfo.event.killed}x \`${mobInfo.mob}\``) : mobKillCountString.concat(`${mobInfo.event.killed}x \`${mobInfo.mob}\``);
      }
      if (mobInfo.event.fled > 0 && mobInfo.event.killed === 0) {
        mobFleeCountString = mobKillCountString !== '' ? mobFleeCountString.concat(`, ${mobInfo.event.fled}x \`${mobInfo.mob}\``) : mobFleeCountString.concat(`${mobInfo.event.fled}x \`${mobInfo.mob}\``);
      } else if (mobInfo.event.fled > 0) {
        mobFleeCountString = mobFleeCountString.concat(`${mobInfo.event.fled}x \`${mobInfo.mob}\``);
      }
    });

    if (mobFleeCountString) {
      eventMsg.push(results.attackerDamage > results.defenderDamage
        ? `${mobFleeCountString} just fled from ${generatePlayerName(results.attacker, true)}!`.replace(/1x /g, '')
        : `${generatePlayerName(results.attacker, true)} just fled from ${mobFleeCountString}!`.replace(/1x /g, ''));
      eventLog.push(results.attackerDamage > results.defenderDamage
        ? `${mobFleeCountString} fled from you! [${expGain} exp]`.replace(/1x /g, '')
        : `You fled from ${mobFleeCountString}! [${expGain} exp]`.replace(/1x /g, ''));
    }
    if (mobKillCountString) {
      eventMsg.push(`${generatePlayerName(updatedPlayer, true)}'s \`${updatedPlayer.equipment.weapon.name}\` just killed ${mobKillCountString}`.replace(/1x /g, ''));
      eventLog.push(`You killed ${mobKillCountString}! [\`${expGain}\` exp${goldGain === 0 ? '' : ` / \`${goldGain}\` gold`}]`.replace(/1x /g, '').replace(/\n$/g, ''));
    }
    const attackedMsg = `Attacked ${mobCountString.replace(/`/g, '')} with \`${updatedPlayer.equipment.weapon.name}\` in \`${updatedPlayer.map.name}\` `.replace(/1x /g, '');
    eventMsg.push(eventMsgResults);
    eventLog.push(attackedMsg.replace(/1x /g, '').concat(battleResult));
    eventMsg.splice(0, 2, eventMsg[0] + eventMsg[1]);

    return { updatedPlayer, expGain, goldGain, questExpGain, questGoldGain, eventMsg, eventLog, isQuestCompleted };
  }

  async findPlayerToBattle(playerObj, onlinePlayers) {
    const updatedPlayer = Object.assign({}, playerObj);
    const mappedPlayers = await this.db.getSameMapPlayers(updatedPlayer.guildId, updatedPlayer.map.name);
    if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
      const onlineSet = new Set(onlinePlayers.map(p => p.discordId));
      const sameMapPlayers = mappedPlayers.filter(player => player.name !== updatedPlayer.name
        && onlineSet.has(player.discordId)
        && player.level <= updatedPlayer.level + pvpLevelRestriction && player.level >= updatedPlayer.level - pvpLevelRestriction);
      const playersWithBounty = sameMapPlayers.filter(player => player.currentBounty !== 0)
        .map(player => { player.chance = Math.floor((player.currentBounty * Math.log(1.2)) / 100); return player; });

      if (sameMapPlayers.length > 0 && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
        const randomPlayerIndex = randomBetween(0, sameMapPlayers.length - 1);
        let randomPlayer;
        if (playersWithBounty.length > 0 && randomBetween(0, 99) >= 50) {
          if (playersWithBounty.length > 1) {
            playersWithBounty.sort((p1, p2) => p2.chance - p1.chance);
          }
          const diceMax = playersWithBounty[0].chance;
          const randomDice = randomBetween(0, diceMax);
          const filteredBountyPlayers = playersWithBounty.filter(player => player.chance >= randomDice);
          if (filteredBountyPlayers.length > 0) {
            randomPlayer = filteredBountyPlayers[randomBetween(0, filteredBountyPlayers.length - 1)]._doc;
          } else {
            randomPlayer = sameMapPlayers[randomPlayerIndex]._doc;
          }
        } else {
          randomPlayer = sameMapPlayers[randomPlayerIndex]._doc;
        }
        if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name && randomPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
          return { randomPlayer };
        }
      }
    }
    return {};
  }

  async playerVsPlayer(playerObj, playerToBattle, multiplier) {
    const updatedPlayer = Object.assign({}, playerObj);
    let result;
    const eventMsg = [];
    const eventLog = [];
    const otherPlayerPmMsg = [];
    try {
      const { attacker, defender, attackerDamage, defenderDamage } = await this.simulator.simulateBattle(updatedPlayer, playerToBattle);
      const defenderMaxHealth = 100 + (defender.level * 5);
      const playerMaxHealth = 100 + (attacker.level * 5);

      let battleResultLog = `Battle Results:\n    ${attacker.name}'s ${attacker.equipment.weapon.name} did ${attackerDamage} damage.\n    ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.\n    ${defender.name}'s ${defender.equipment.weapon.name} did ${defenderDamage} damage.\n    ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`;

      if (attacker.health <= 0 && defender.health > 0) {
        battleResultLog = battleResultLog.replace(`  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.`, '');
        eventMsg.push(`[\`${attacker.map.name}\`] ${generatePlayerName(defender, true)} just killed ${generatePlayerName(attacker, true)} with ${generateGenderString(defender, 'his')} \`${defender.equipment.weapon.name}\`!\n↳ ${generatePlayerName(attacker, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);
        const expGain = Math.floor(attackerDamage / 8);
        eventLog.push(`Died to ${defender.name} in ${attacker.map.name}.`);
        const otherPlayerLog = `Killed ${attacker.name} in ${attacker.map.name}. [${expGain} exp]`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));
        attacker.battles.lost++;
        defender.battles.won++;
        defender.experience.current += expGain;
        defender.experience.total += expGain;
        await this.player.logEvent(attacker, eventLog[0] || '', enumHelper.logTypes.pvp);
        await this.player.logEvent(defender, otherPlayerLog, enumHelper.logTypes.pvp);
        result = enumHelper.battle.outcomes.lost;
      } else if (defender.health <= 0 && attacker.health > 0) {
        battleResultLog = battleResultLog.replace(`  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`, '');
        const expGain = Math.floor(defenderDamage / 8);
        eventMsg.push(`[\`${attacker.map.name}\`] ${generatePlayerName(attacker, true)} just killed \`${defender.name}\` with ${generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\`!\n↳ ${capitalizeFirstLetter(generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);
        eventLog.push(`Killed ${defender.name} in ${attacker.map.name}. [${expGain} exp]`);
        const otherPlayerLog = `Died to ${attacker.name} in ${attacker.map.name}.`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));
        attacker.battles.won++;
        defender.battles.lost++;
        attacker.experience.current += expGain;
        attacker.experience.total += expGain;
        await this.player.logEvent(attacker, eventLog[0] || '', enumHelper.logTypes.pvp);
        await this.player.logEvent(defender, otherPlayerLog, enumHelper.logTypes.pvp);
        result = enumHelper.battle.outcomes.win;
      } else if (defender.health > 0 && attacker.health > 0) {
        eventMsg.push(attackerDamage > defenderDamage
          ? `[\`${attacker.map.name}\`] ${generatePlayerName(attacker, true)} attacked ${generatePlayerName(defender, true)} with ${generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${generateGenderString(defender, 'he')} managed to get away!\n↳ ${capitalizeFirstLetter(generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`
          : `[\`${attacker.map.name}\`] ${generatePlayerName(attacker, true)} attacked ${generatePlayerName(defender, true)} with ${generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${generatePlayerName(defender, true)} was too strong!\n↳ ${capitalizeFirstLetter(generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);
        const expGainAttacker = Math.floor(defenderDamage / 8);
        const expGainDefender = Math.floor(attackerDamage / 8);
        eventLog.push(`Attacked ${defender.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`);
        const otherPlayerLog = `Attacked by ${attacker.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));
        attacker.experience.current += expGainAttacker;
        attacker.experience.total += expGainAttacker;
        defender.experience.current += expGainDefender;
        defender.experience.total += expGainDefender;
        defender.health > attacker.health ? (attacker.fled.you++ && defender.fled.player++) : (attacker.fled.player++ && defender.fled.you++);
        await this.player.logEvent(attacker, eventLog[0] || '', enumHelper.logTypes.pvp);
        await this.player.logEvent(defender, otherPlayerLog, enumHelper.logTypes.pvp);
        result = enumHelper.battle.outcomes.fled;
      }

      switch (result) {
        case enumHelper.battle.outcomes.win: {
          const winResults = await this.steal(attacker, defender);
          eventMsg.push(...winResults.msg);
          eventLog.push(...winResults.pm);
          otherPlayerPmMsg.push(...winResults.otherPlayerPmMsg);
          const victimCheckHealth = this.player.checkHealth(winResults.victimPlayer, winResults.stealingPlayer, eventMsg, otherPlayerPmMsg, eventLog);
          await this.db.savePlayer(victimCheckHealth.updatedPlayer);
          const winnerCheckExp = await this.player.checkExperience(victimCheckHealth.updatedAttacker || winResults.stealingPlayer, eventMsg, eventLog);
          return { type: 'actions', updatedPlayer: winnerCheckExp.updatedPlayer, msg: eventMsg, pm: eventLog, attackerObj: victimCheckHealth.updatedPlayer, otherPlayerPmMsg };
        }
        case enumHelper.battle.outcomes.fled: {
          const fledUpdatedDefender = await this.player.checkExperience(defender, eventMsg, otherPlayerPmMsg);
          await this.db.savePlayer(fledUpdatedDefender.updatedPlayer);
          const fledResult = await this.player.checkExperience(attacker, eventMsg, eventLog);
          return { type: 'actions', updatedPlayer: fledResult.updatedPlayer, msg: eventMsg, pm: eventLog, attackerObj: fledUpdatedDefender.updatedPlayer, otherPlayerPmMsg };
        }
        case enumHelper.battle.outcomes.lost: {
          const loseResults = await this.steal(defender, attacker);
          eventMsg.push(...loseResults.msg);
          eventLog.push(...loseResults.otherPlayerPmMsg);
          otherPlayerPmMsg.push(...loseResults.pm);
          const lostUpdatedDefender = await this.player.checkExperience(loseResults.stealingPlayer, eventMsg, otherPlayerPmMsg);
          await this.db.savePlayer(lostUpdatedDefender.updatedPlayer);
          const loserCheckHealth = this.player.checkHealth(loseResults.victimPlayer, lostUpdatedDefender.updatedPlayer, eventMsg, eventLog, otherPlayerPmMsg);
          return { type: 'actions', updatedPlayer: loserCheckHealth.updatedPlayer, msg: eventMsg, pm: eventLog, attackerObj: loserCheckHealth.updatedAttacker, otherPlayerPmMsg };
        }
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async steal(stealingPlayer, victimPlayer) {
    const eventMsg = [];
    const eventLog = [];
    const otherPlayerLog = [];
    try {
      const luckStealChance = randomBetween(0, 99);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      if (luckStealChance > (90 - canSteal)) {
        const luckItem = randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];
        if (![enumHelper.equipment.empty.armor.name, enumHelper.equipment.empty.weapon.name].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          let stolenEquip;
          if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
            const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
            const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = removePreviousOwnerName;
          } else {
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
          }
          eventMsg.push(setImportantMessage(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} just stole ${stolenEquip.name}!`));
          eventLog.push(`Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`);
          otherPlayerLog.push(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`);
          victimPlayer.stolen++;
          stealingPlayer.stole++;
          if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
            const oldItemRating = calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
            const newItemRating = calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
            if (oldItemRating < newItemRating) {
              stealingPlayer = this.player.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, stolenEquip);
              if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = victimPlayer.equipment[itemKeys[luckItem]].previousOwners;
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners.push(victimPlayer.name);
              } else {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = [`${victimPlayer.name}`];
              }
            } else {
              stealingPlayer = this.inventory.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
            }
            if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find(equip => equip.position === enumHelper.equipment.types[itemKeys[luckItem]].position) !== undefined) {
              const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKeys[luckItem]].position).sort((item1, item2) => item2.power - item1.power)[0];
              victimPlayer = this.player.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
            } else {
              victimPlayer = this.player.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
            }
          }
        }
        return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
      } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
        const goldStolen = Math.round(victimPlayer.gold.current / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold.current += goldStolen;
          stealingPlayer.gold.total += goldStolen;
          stealingPlayer.gold.stole += goldStolen;
          victimPlayer.gold.current -= goldStolen;
          victimPlayer.gold.stolen += goldStolen;
          eventMsg.push(setImportantMessage(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} just stole ${goldStolen} gold from ${victimPlayer.name}${victimPlayer.titles.current !== 'None' ? ` the ${victimPlayer.titles.current}` : ''}!`));
          eventLog.push(`Stole ${goldStolen} gold from ${victimPlayer.name}`);
          otherPlayerLog.push(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} stole ${goldStolen} gold from you`);
          return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
        }
      }
      return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async dropItem(playerObj, mob, eventMsg, eventLog) {
    let updatedPlayer = Object.assign({}, playerObj);
    try {
      const dropitemChance = randomBetween(0, 99);
      if (dropitemChance <= 15 + (updatedPlayer.stats.luk / 4)) {
        const deadMob = mob.find(obj => obj.health <= 0);
        const item = await this.itemGen.generateItem(updatedPlayer, deadMob);
        if (item.position !== enumHelper.inventory.position) {
          const oldItemRating = calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
          const newItemRating = calculateItemRating(updatedPlayer, item);
          if (oldItemRating > newItemRating) {
            updatedPlayer = this.inventory.addEquipmentIntoInventory(updatedPlayer, item);
          } else {
            updatedPlayer = this.player.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
          }
        } else {
          updatedPlayer = this.inventory.addItemIntoInventory(updatedPlayer, item);
        }
        if (!item.holiday) {
          eventMsg.push(`${generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${deadMob.name}!\``);
        } else {
          eventMsg.push(`**${generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${deadMob.name}!\`**`);
        }
        eventLog.push(`Received ${item.name} from ${mob[0].name}`);
        await this.player.logEvent(updatedPlayer, eventLog[eventLog.length - 1], enumHelper.logTypes.action);
        return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
      }
      return { updatedPlayer };
    } catch (err) {
      errorLog.error(err);
    }
  }

}

module.exports = BattleEngine;
