const { errorLog } = require('../../../../utils/logger');
const enumHelper = require('../../../../utils/enumHelper');
const BattleSimulator = require('../../../../game/utils/Battle');

function pveMessageFormat(Helper, results, updatedPlayer, playerMaxHealth, multiplier) {
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
      mobListInfo.mobs.push({
        mob: mob.name,
        totalCount: 0,
        event: {
          killed: 0,
          fled: 0,
          survived: 0
        }
      });
    }
    infoList = mobListInfo.mobs.findIndex(arrayMob => arrayMob.mob === mob.name);
    expGain += Math.ceil(((mob.experience) + (mob.dmgDealt / 4)) / 6) * multiplier;

    if (mob.health <= 0) {
      goldGain += Math.floor((mob.gold * multiplier));
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

    if (Math.floor(results.defenderDamage / (results.defender.length)) > 0) {
      mobListResult.push(`  ${mob.name}'s ${mob.equipment.weapon.name} did ${mob.dmgDealt} damage.`);
    }
    mobListResult.push(`  ${mob.health <= 0 ? `${mob.name} took ${mob.dmgReceived} dmg and died.` : `${mob.name} took ${mob.dmgReceived} dmg and has ${mob.health} / ${mob.maxHealth} HP left.`}`);
  });
  let battleResult = `Battle Results:
  You have ${updatedPlayer.health} / ${playerMaxHealth} HP left.
${mobListResult.join('\n')}`;

  if (updatedPlayer.health <= 0) {
    battleResult = battleResult.replace(`  You have ${updatedPlayer.health} / ${playerMaxHealth} HP left.`, '');
    const killerMob = results.defender.map((mob) => {
      if (mob.dmgDealt > 0) {
        return mob.name;
      }

      return '';
    }).join(', ').replace(/,$/g, '');
    eventMsg.push(`| ${killerMob} just killed ${Helper.generatePlayerName(updatedPlayer, true)}!`);
    eventLog.push(`${killerMob} just killed you!`);
  }
  const eventMsgResults = `↳ ${Helper.capitalizeFirstLetter(Helper.generateGenderString(updatedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg and gained \`${expGain}\` exp${goldGain === 0 ? '' : ` and \`${goldGain}\` gold`}! [HP:${updatedPlayer.health}/${playerMaxHealth}]`;

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
      ? `| ${mobFleeCountString} just fled from ${Helper.generatePlayerName(results.attacker, true)}!`
      : `| ${Helper.generatePlayerName(results.attacker, true)} just fled from ${mobFleeCountString}!`);
    eventLog.push(results.attackerDamage > results.defenderDamage
      ? `${mobFleeCountString} fled from you! [${expGain} exp]`
      : `You fled from ${mobFleeCountString}! [${expGain} exp]`);
  }

  if (mobKillCountString) {
    eventMsg.push(`${Helper.generatePlayerName(updatedPlayer, true)}'s \`${updatedPlayer.equipment.weapon.name}\` just killed ${mobKillCountString.replace(/1x /g, '')}`);
    eventLog.push(`You killed ${mobKillCountString}! [\`${expGain}\` exp${goldGain === 0 ? '' : ` / \`${goldGain}\` gold`}]`.replace(/1x /g, '').replace(/\n$/g, ''));
  }
  const attackedMsg = `Attacked ${mobCountString.replace(/`/g, '')} with \`${updatedPlayer.equipment.weapon.name}\` in \`${updatedPlayer.map.name}\` `;
  eventMsg.push(eventMsgResults);
  eventLog.push(attackedMsg.replace(/1x /g, '').concat('```').concat(battleResult).concat('```'));
  eventMsg.splice(0, 2, eventMsg[0] + eventMsg[1]);

  return {
    updatedPlayer,
    expGain,
    goldGain,
    questExpGain,
    questGoldGain,
    eventMsg,
    eventLog,
    isQuestCompleted
  };
}

class Battle {

  constructor(params) {
    const { Helper, Database, MapManager, InventoryManager, ItemManager } = params;
    this.Database = Database;
    this.Helper = Helper;
    this.MapManager = MapManager;
    this.InventoryManager = InventoryManager;
    this.ItemManager = ItemManager;
    this.BattleSimulator = new BattleSimulator(this.Helper);
  }

  async playerVsMob(playerObj, mobToBattle, multiplier) {
    let updatedPlayer = Object.assign({}, playerObj);
    const eventMsg = [];
    const eventLog = [];
    try {
      const simulatedBattle = await this.BattleSimulator.simulateBattle(updatedPlayer, mobToBattle);
      const battleResults = await this.playerVsMobResults(simulatedBattle, multiplier);
      eventMsg.push(battleResults.msg);
      eventLog.push(battleResults.eventLog);
      updatedPlayer = battleResults.updatedPlayer;
      switch (battleResults.result) {
        case enumHelper.battle.outcomes.win:
          const dropItemResults = await this.dropItem(updatedPlayer, battleResults.updatedMob, eventMsg, eventLog);
          const checkedWinResults = await this.Helper.checkExperience(this.Database, dropItemResults.updatedPlayer, eventMsg, eventLog);
          return {
            type: 'actions',
            updatedPlayer: checkedWinResults.updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };

        case enumHelper.battle.outcomes.fled:
          const checkedFledResults = await this.Helper.checkExperience(this.Database, updatedPlayer, eventMsg, eventLog);
          return {
            type: 'actions',
            updatedPlayer: checkedFledResults.updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };

        case enumHelper.battle.outcomes.lost:
          const checkLostResults = await this.Helper.checkHealth(this.Database, this.MapManager, updatedPlayer, battleResults.updatedMob, eventMsg, eventLog);
          return {
            type: 'actions',
            updatedPlayer: checkLostResults.updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async camp(updatedPlayer) {
    const eventMsg = [];
    const eventLog = [];
    try {
      updatedPlayer = await this.Helper.passiveRegen(updatedPlayer, ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.end / 2), ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.int / 2));
      // TODO: Make more camp event messages to be selected randomly
      const generatedMessage = await this.Helper.randomCampEventMessage(updatedPlayer);
      eventMsg.push(generatedMessage.eventMsg);
      eventLog.push(generatedMessage.eventLog)
      await this.Helper.logEvent(updatedPlayer, this.Database, generatedMessage.eventLog, enumHelper.logTypes.action);

      return {
        type: 'actions',
        updatedPlayer,
        msg: eventMsg,
        pm: eventLog
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async playerVsMobResults(results, multiplier) {
    try {
      const playerMaxHealth = 100 + (results.attacker.level * 5);
      let {
        updatedPlayer,
        expGain,
        goldGain,
        questExpGain,
        questGoldGain,
        eventMsg,
        eventLog,
        isQuestCompleted
      } = await pveMessageFormat(this.Helper, results, results.attacker, playerMaxHealth, multiplier);

      if (updatedPlayer.health <= 0) {
        updatedPlayer.battles.lost++;
        await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.action);

        return {
          result: enumHelper.battle.outcomes.lost,
          updatedPlayer,
          updatedMob: results.defender
        };
      }

      if (results.defender.filter(mob => mob.health > 0).length > 0 && updatedPlayer.health > 0) {
        updatedPlayer.experience.current += expGain;
        updatedPlayer.experience.total += expGain;
        updatedPlayer.gold.current += goldGain + questGoldGain;
        updatedPlayer.gold.total += goldGain + questGoldGain;
        await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.action);

        return {
          result: enumHelper.battle.outcomes.fled,
          updatedPlayer,
          updatedMob: results.defender
        };
      }

      updatedPlayer.experience.current += expGain + questExpGain;
      updatedPlayer.experience.total += expGain + questExpGain;
      updatedPlayer.gold.current += goldGain + questGoldGain;
      updatedPlayer.gold.total += goldGain + questGoldGain;
      updatedPlayer.kills.mob++;
      updatedPlayer.battles.won++;
      await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.action);
      if (isQuestCompleted) {
        eventMsg.push(`${this.Helper.generatePlayerName(updatedPlayer, true)} finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
        eventLog.push(`Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
        await this.Helper.logEvent(hook, this.Database, `Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`, enumHelper.logTypes.action);
      }

      return {
        result: enumHelper.battle.outcomes.win,
        updatedPlayer,
        updatedMob: results.defender,
        msg: eventMsg,
        eventLog
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async findPlayerToBattle(playerObj, onlinePlayers) {
    const updatedPlayer = Object.assign({}, playerObj);
    const mappedPlayers = await this.Database.getSameMapPlayers(updatedPlayer.map.name);
    if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
      const sameMapPlayers = mappedPlayers.filter(player => player.name !== updatedPlayer.name
        && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
        && player.level <= updatedPlayer.level + pvpLevelRestriction && player.level >= updatedPlayer.level - pvpLevelRestriction);
      const playersWithBounty = sameMapPlayers.filter(player => player.currentBounty !== 0)
        .map(player => player.chance = Math.floor((player.currentBounty * Math.log(1.2)) / 100));

      if (sameMapPlayers.length > 0 && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
        const randomPlayerIndex = await this.Helper.randomBetween(0, sameMapPlayers.length - 1);
        let randomPlayer;
        if (playersWithBounty.length > 0 && await this.Helper.randomBetween(0, 100) >= 50) {
          if (playersWithBounty.length > 1) {
            playersWithBounty.sort(player1, player2 => player2.chance - player1.chance);
          }

          const diceMax = playersWithBounty[0].chance;
          const randomDice = await this.Helper.randomBetween(0, diceMax);
          const filteredBountyPlayers = playersWithBounty.filter(player => player.chance >= randomDice);
          if (filteredBountyPlayers.length > 0) {
            const filteredBountyPlayersIndex = await this.Helper.randomBetween(0, filteredBountyPlayers.length - 1);
            randomPlayer = filteredBountyPlayers[filteredBountyPlayersIndex];
          } else {
            randomPlayer = sameMapPlayers[randomPlayerIndex];
          }
        } else {
          randomPlayer = sameMapPlayers[randomPlayerIndex];
        }

        if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name && randomPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
          return { randomPlayer };
        }
      }
    }

    return {};
  }

  async playerVsPlayer(playerObj, playerToBattle) {
    const updatedPlayer = Object.assign({}, playerObj);
    let result;
    const eventMsg = [];
    const eventLog = [];
    const otherPlayerPmMsg = [];
    try {
      const { attacker, defender, attackerDamage, defenderDamage } = await this.BattleSimulator.simulateBattle(updatedPlayer, playerToBattle);
      const defenderMaxHealth = 100 + (defender.level * 5);
      const playerMaxHealth = 100 + (attacker.level * 5);

      let battleResultLog = `Battle Results:
    ${attacker.name}'s ${attacker.equipment.weapon.name} did ${attackerDamage} damage.
    ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.
    ${defender.name}'s ${defender.equipment.weapon.name} did ${defenderDamage} damage.
    ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`;

      if (attacker.health <= 0) {
        battleResultLog = battleResultLog.replace(`  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.`, '');
        eventMsg.push(`[\`${attacker.map.name}\`] ${this.Helper.generatePlayerName(defender, true)} just killed ${this.Helper.generatePlayerName(attacker, true)} with ${this.Helper.generateGenderString(defender, 'his')} \`${defender.equipment.weapon.name}\`!
↳ ${this.Helper.generatePlayerName(attacker, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${this.Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);

        const expGain = Math.floor(attackerDamage / 8);
        const eventLog = `Died to ${defender.name} in ${attacker.map.name}.`;
        const otherPlayerLog = `Killed ${attacker.name} in ${attacker.map.name}. [${expGain} exp]`;
        eventLog.push(eventLog.concat('```').concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog.concat('```').concat(battleResultLog).concat('```'));

        attacker.battles.lost++;
        defender.battles.won++;
        defender.experience.current += expGain;
        defender.experience.total += expGain;
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.pvp);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

        result = enumHelper.battle.outcomes.lost;
      }

      if (defender.health > 0 && attacker.health > 0) {
        eventMsg.push(attackerDamage > defenderDamage
          ? `[\`${attacker.map.name}\`] ${this.Helper.generatePlayerName(attacker, true)} attacked ${this.Helper.generatePlayerName(defender, true)} with ${this.Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${this.Helper.generateGenderString(defender, 'he')} managed to get away!
↳ ${this.Helper.capitalizeFirstLetter(this.Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`
          : `[\`${attacker.map.name}\`] ${this.Helper.generatePlayerName(attacker, true)} attacked ${this.Helper.generatePlayerName(defender, true)} with ${this.Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${this.Helper.generatePlayerName(defender, true)} was too strong!
↳ ${this.Helper.capitalizeFirstLetter(this.Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);

        const expGainAttacker = Math.floor(defenderDamage / 8);
        const expGainDefender = Math.floor(attackerDamage / 8);
        const eventLog = `Attacked ${defender.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`;
        const otherPlayerLog = `Attacked by ${attacker.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;
        eventLog.push(eventLog.concat('```').concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog.concat('```').concat(battleResultLog).concat('```'));

        attacker.experience.current += expGainAttacker;
        attacker.experience.total += expGainAttacker;
        defender.experience.current += expGainDefender;
        defender.experience.total += expGainDefender;
        defender.health > attacker.health ? attacker.fled.you++ && defender.fled.player++ : attacker.fled.player++ && defender.fled.you++;

        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.pvp);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

        result = enumHelper.battle.outcomes.fled;
      }

      battleResultLog = battleResultLog.replace(`  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`, '');
      const expGain = Math.floor(defenderDamage / 8);
      eventMsg.push(`[\`${attacker.map.name}\`] ${this.Helper.generatePlayerName(attacker, true)} just killed \`${defender.name}\` with ${this.Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\`!
↳ ${this.Helper.capitalizeFirstLetter(this.Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);
      const eventLog = `Killed ${defender.name} in ${attacker.map.name}. [${expGain} exp]`;
      const otherPlayerLog = `Died to ${attacker.name} in ${attacker.map.name}.`;
      eventLog.push(eventLog.concat('```').concat(battleResultLog).concat('```'));
      otherPlayerPmMsg.push(otherPlayerLog.concat('```').concat(battleResultLog).concat('```'));

      attacker.battles.won++;
      defender.battles.lost++;
      attacker.experience.current += expGain;
      attacker.experience.total += expGain;
      await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.action);
      await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.action);
      await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.pvp);
      await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);
      result = enumHelper.battle.outcomes.win;

      switch (result) {
        case enumHelper.battle.outcomes.win:
          const winResults = await this.steal(attacker, defender);
          const updatedVictim = await this.Helper.checkHealth(this.params, this.MapManager, winResults.victimPlayer, winResults.stealingPlayer, eventMsg, pmgMsg, otherPlayerPmMsg);
          await this.Database.savePlayer(updatedVictim);
          return await this.Helper.checkExperience(winResults.stealingPlayer, eventMsg, eventLog);

        case enumHelper.battle.outcomes.fled:
          const fledUpdatedDefender = await this.Helper.checkExperience(defender, eventMsg, otherPlayerPmMsg);
          await this.Database.savePlayer(fledUpdatedDefender);
          return await this.Helper.checkExperience(attacker, eventMsg, eventLog);

        case enumHelper.battle.outcomes.lost:
          const loseResults = await this.steal(defender, attacker);
          const lostUpdatedDefender = await this.Helper.checkExperience(loseResults.stealingPlayer, eventMsg, otherPlayerPmMsg);
          await this.Database.savePlayer(lostUpdatedDefender);
          return await this.Helper.checkHealth(this.MapManager, loseResults.victimPlayer, loseResults.stealingPlayer, eventMsg, otherPlayerPmMsg, eventLog);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async steal(stealingPlayer, victimPlayer) {
    const eventMsg = '';
    const eventLog = '';
    const otherPlayerLog = '';
    try {
      const luckStealChance = await this.Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      if (luckStealChance > (90 - canSteal)) {
        const luckItem = await this.Helper.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (![enumHelper.equipment.empty.armor.name, enumHelper.equipment.empty.weapon.name].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          let stolenEquip;
          if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
            const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
            const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = removePreviousOwnerName;
            eventMsg.push(this.Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`));
            eventLog.push(`Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`);
            otherPlayerLog.push(`${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`);
          } else {
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            eventMsg.push(this.Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`));
            eventLog.push(`Stole ${stolenEquip.name}`);
            otherPlayerLog.push(`${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`);
          }
          victimPlayer.stolen++;
          stealingPlayer.stole++;
          if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
            const oldItemRating = await this.Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
            const newItemRating = await this.Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
            if (oldItemRating < newItemRating) {
              stealingPlayer = await this.Helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, stolenEquip);
              if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = victimPlayer.equipment[itemKeys[luckItem]].previousOwners;
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners.push(victimPlayer.name);
              } else {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = [`${victimPlayer.name}`];
              }
            } else {
              stealingPlayer = await this.InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
            }
            if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find(equip => equip.position === enumHelper.equipment.types[itemKeys[luckItem]].position) !== undefined) {
              const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKeys[luckItem]].position)
                .sort((item1, item2) => item2.power - item1.power)[0];
              victimPlayer = await this.Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
            } else {
              victimPlayer = await this.Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
            }
          }
        }
        await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.pvp);
        await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

        return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
      } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
        const goldStolen = Math.round(victimPlayer.gold.current / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold.current += goldStolen;
          stealingPlayer.gold.total += goldStolen;
          stealingPlayer.gold.stole += goldStolen;

          victimPlayer.gold.current -= goldStolen;
          victimPlayer.gold.stolen += goldStolen;

          eventMsg.push(this.Helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`));
          eventLog.push(`Stole ${goldStolen} gold from ${victimPlayer.name}`);
          otherPlayerLog.push(`${stealingPlayer.name} stole ${goldStolen} gold from you`);

          await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.action);
          await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.action);
          await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.pvp);
          await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

          return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
        }
      }

      return { stealingPlayer, victimPlayer };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async dropItem(playerObj, mob, eventMsg, eventLog) {
    let updatedPlayer = Object.assign({}, playerObj);
    try {
      const dropitemChance = await this.Helper.randomBetween(0, 100);
      if (dropitemChance <= 15 + (updatedPlayer.stats.luk / 4)) {
        const item = await this.ItemManager.generateItem(updatedPlayer, mob.find(obj => obj.health <= 0));
        if (item.position !== enumHelper.inventory.position) {
          const oldItemRating = await this.Helper.calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
          const newItemRating = await this.Helper.calculateItemRating(updatedPlayer, item);
          if (oldItemRating > newItemRating) {
            updatedPlayer = await this.InventoryManager.addEquipmentIntoInventory(updatedPlayer, item);
          } else {
            updatedPlayer = await this.Helper.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
          }
        } else {
          updatedPlayer = await this.InventoryManager.addItemIntoInventory(updatedPlayer, item);
        }

        if (!item.isXmasEvent) {
          eventMsg.push(`${this.Helper.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\``);
        } else {
          eventMsg.push(`**${this.Helper.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\`**`);
        }
        eventLog.push(`Received ${item.name} from ${mob[0].name}`);
        await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.action);

        return {
          type: 'actions',
          updatedPlayer,
          msg: eventMsg,
          pm: eventLog
        };
      }

      return {
        type: 'actions',
        updatedPlayer
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

}
module.exports = Battle;