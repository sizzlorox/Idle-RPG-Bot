const enumHelper = require('../../utils/enumHelper');
const { pvpLevelRestriction, maximumTimer } = require('../../../settings');
const { errorLog } = require('../../utils/logger');

function pveMessageFormat(Helper, results, updatedPlayer, playerMaxHealth, multiplier) {
  const mobListResult = [];
  const mobListInfo = { mobs: [] };
  let isQuestCompleted = false;
  let eventMsg = `[\`${results.attacker.map.name}\`] `;
  let mobCountString = '';
  let mobKillCountString = '';
  let mobFleeCountString = '';
  let expGain = 0;
  let goldGain = 0;
  let questExpGain = 0;
  let questGoldGain = 0;
  let eventLog = '';

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
    const killerMob = results.defender.reduce((list, mob) => {
      if (!mob.dmgDealt > 0) {
        return list;
      }

      return list.concat(mob.name);
    }, []).join(', ');
    eventMsg = eventMsg.concat(`| ${killerMob} just killed ${Helper.generatePlayerName(updatedPlayer, true)}!\n`);
    eventLog = eventLog.concat(`${killerMob} just killed you!\n`);
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
    eventMsg = eventMsg.concat(results.attackerDamage > results.defenderDamage
      ? `| ${mobFleeCountString} just fled from ${Helper.generatePlayerName(results.attacker, true)}!\n`
      : `| ${Helper.generatePlayerName(results.attacker, true)} just fled from ${mobFleeCountString}!\n`);
    eventLog = eventLog.concat(results.attackerDamage > results.defenderDamage
      ? `${mobFleeCountString} fled from you! [${expGain} exp]\n`
      : `You fled from ${mobFleeCountString}! [${expGain} exp]\n`);
  }

  if (mobKillCountString) {
    eventMsg = eventMsg.concat(`${Helper.generatePlayerName(updatedPlayer, true)}'s \`${updatedPlayer.equipment.weapon.name}\` just killed ${mobKillCountString}\n`);
    eventLog = eventLog.concat(`You killed ${mobKillCountString}! [\`${expGain}\` exp${goldGain === 0 ? '' : ` / \`${goldGain}\` gold`}]\n`);
  }
  const attackedMsg = `Attacked ${mobCountString.replace(/`/g, '')} with \`${updatedPlayer.equipment.weapon.name}\` in \`${updatedPlayer.map.name}\`\n`;
  eventMsg = eventMsg.concat(eventMsgResults).replace(/1x /g, '').replace(/\n$/g, '');
  const pmMsg = attackedMsg.replace(/1x /g, '').concat('```').concat(battleResult).concat('```').concat(eventLog.replace(/1x /g, '').replace(/\n$/g, ''));

  return {
    updatedPlayer,
    expGain,
    goldGain,
    questExpGain,
    questGoldGain,
    eventMsg,
    eventLog,
    pmMsg,
    isQuestCompleted
  };
}

const events = {
  movement: {
    movePlayer: async (params, updatedPlayer, mapObj) => {
      const { db, helper } = params;
      try {
        updatedPlayer.previousMap = updatedPlayer.map.name;
        updatedPlayer.map = mapObj.map;
        updatedPlayer.travelled++;
        const eventMsg = `${helper.generatePlayerName(updatedPlayer)} decided to head \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\` and arrived in \`${mapObj.map.name}\`.`;
        const eventLog = `Travelled ${mapObj.direction} from ${updatedPlayer.previousMap} and arrived in ${mapObj.map.name}`;
        await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.move);

        return {
          type: 'movement',
          updatedPlayer,
          msg: eventMsg,
          pm: eventLog
        };
      } catch (err) {
        errorLog.error(err);
      }
    }
  },

  camp: async (params, updatedPlayer) => {
    const { hook, db, helper } = params;
    try {
      updatedPlayer = await helper.passiveRegen(updatedPlayer, ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.end / 2), ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.int / 2));
      // TODO: Make more camp event messages to be selected randomly
      const { eventMsg, eventLog } = await helper.randomCampEventMessage(updatedPlayer);
      await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
      await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
      await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

      return Promise.resolve(updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  },

  town: {
    sell: async (params, updatedPlayer) => {
      const { hook, db, helper } = params;
      try {
        if (updatedPlayer.inventory.equipment.length > 0) {
          let profit = 0;
          updatedPlayer.inventory.equipment.forEach((equipment) => {
            profit += Number(equipment.gold);
          });
          updatedPlayer.inventory.equipment.length = 0;
          profit = Math.floor(profit);
          updatedPlayer.gold.current += profit;
          updatedPlayer.gold.total += profit;

          const eventMsg = `[\`${updatedPlayer.map.name}\`] ${helper.generatePlayerName(updatedPlayer, true)} just sold what they found adventuring for ${profit} gold!`;
          const eventLog = `Made ${profit} gold selling what you found adventuring`;
          await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

          return updatedPlayer;
        }

        return updatedPlayer;
      } catch (err) {
        errorLog.error(err);
      }
    },

    quest: async (params, updatedPlayer, mob) => {
      const { hook, db, helper } = params;
      try {
        if (!updatedPlayer.quest.questMob.name.includes('None')) {
          return updatedPlayer;
        }

        updatedPlayer.quest.questMob.name = mob;
        updatedPlayer.quest.questMob.count = await helper.randomBetween(1, 15);
        updatedPlayer.quest.questMob.killCount = 0;
        updatedPlayer.quest.updated_at = new Date();
        const eventMsg = `[\`${updatedPlayer.map.name}\`] Quest Master has asked ${helper.generatePlayerName(updatedPlayer, true)} to kill ${updatedPlayer.quest.questMob.count === 1 ? 'a' : updatedPlayer.quest.questMob.count} ${mob}!`;
        const eventLog = `Quest Master in ${updatedPlayer.map.name} asked you to kill ${updatedPlayer.quest.questMob.count === 1 ? 'a' : updatedPlayer.quest.questMob.count} ${mob}.`;
        await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

        return {
          type: 'actions',
          updatedPlayer,
          msg: eventMsg,
          pmMsg: eventLog
        };
      } catch (err) {
        errorLog.error(err);
      }
    },

    item: async (params, updatedPlayer, item, InventoryManager) => {
      const { hook, db, helper } = params;
      try {
        const itemCost = Math.round(item.gold);

        if (updatedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
          return updatedPlayer;
        }

        if (item.position !== enumHelper.inventory.position) {
          // updatedPlayer.equipment[item.position].position = enumHelper.equipment.types[item.position].position;
          const oldItemRating = await helper.calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
          const newItemRating = await helper.calculateItemRating(updatedPlayer, item);
          if (oldItemRating > newItemRating) {
            return updatedPlayer;
          }

          updatedPlayer.gold.current -= itemCost;
          updatedPlayer = await helper.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
        } else if (updatedPlayer.inventory.items.length >= enumHelper.inventory.maxItemAmount) {
          return updatedPlayer;
        } else {
          updatedPlayer.gold.current -= itemCost;
          updatedPlayer = await InventoryManager.addItemIntoInventory(updatedPlayer, item);
        }

        const eventMsg = `[\`${updatedPlayer.map.name}\`] ${helper.generatePlayerName(updatedPlayer, true)} just purchased \`${item.name}\` for ${itemCost} gold!`;
        const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;
        await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
        await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
        await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

        return updatedPlayer;
      } catch (err) {
        errorLog.error(err);
      }
    }
  },

  battle: {
    pvpPreperation: async (params, updatedPlayer, mappedPlayers, onlinePlayers) => {
      const { helper } = params;
      try {
        if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
          const sameMapPlayers = mappedPlayers.filter(player => player.name !== updatedPlayer.name
            && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
            && player.level <= updatedPlayer.level + pvpLevelRestriction && player.level >= updatedPlayer.level - pvpLevelRestriction);
          const playersWithBounty = sameMapPlayers.filter(player => player.currentBounty !== 0)
            .map(player => player.chance = Math.floor((player.currentBounty * Math.log(1.2)) / 100));

          if (sameMapPlayers.length > 0 && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
            const randomPlayerIndex = await helper.randomBetween(0, sameMapPlayers.length - 1);
            let randomPlayer;
            if (playersWithBounty.length > 0 && await helper.randomBetween(0, 99) >= 50) {
              if (playersWithBounty.length > 1) {
                playersWithBounty.sort(player1, player2 => player2.chance - player1.chance);
              }

              const diceMax = playersWithBounty[0].chance;
              const randomDice = await helper.randomBetween(0, diceMax);
              const filteredBountyPlayers = playersWithBounty.filter(player => player.chance >= randomDice);
              if (filteredBountyPlayers.length > 0) {
                const filteredBountyPlayersIndex = await helper.randomBetween(0, filteredBountyPlayers.length - 1);
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
      } catch (err) {
        errorlog.error(err);
      }
    },

    pvpResults: async (params, { attacker, defender, attackerDamage, defenderDamage }) => {
      const { hook, db, helper } = params;
      try {
        const defenderMaxHealth = 100 + (defender.level * 5);
        const playerMaxHealth = 100 + (attacker.level * 5);

        let battleResult = `Battle Results:
    ${attacker.name}'s ${attacker.equipment.weapon.name} did ${attackerDamage} damage.
    ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.
    ${defender.name}'s ${defender.equipment.weapon.name} did ${defenderDamage} damage.
    ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`;

        if (attacker.health <= 0) {
          battleResult = battleResult.replace(`  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.`, '');
          const eventMsg = `[\`${attacker.map.name}\`] ${helper.generatePlayerName(defender, true)} just killed ${helper.generatePlayerName(attacker, true)} with ${helper.generateGenderString(defender, 'his')} \`${defender.equipment.weapon.name}\`!
↳ ${helper.generatePlayerName(attacker, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;

          const expGain = Math.floor(attackerDamage / 8);
          const eventLog = `Died to ${defender.name} in ${attacker.map.name}.`;
          const otherPlayerLog = `Killed ${attacker.name} in ${attacker.map.name}. [${expGain} exp]`;

          attacker.battles.lost++;
          defender.battles.won++;
          defender.experience.current += expGain;
          defender.experience.total += expGain;
          await helper.sendMessage(hook, attacker, false, eventMsg);
          await helper.sendPrivateMessage(hook, attacker, eventLog.concat('```').concat(battleResult).concat('```'), true);
          await helper.sendPrivateMessage(hook, defender, otherPlayerLog.concat('```').concat(battleResult).concat('```'), true);
          await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.action);
          await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.action);
          await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.pvp);
          await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.pvp);

          return {
            result: enumHelper.battle.outcomes.lost,
            updatedAttacker: attacker,
            updatedDefender: defender
          };
        }

        if (defender.health > 0 && attacker.health > 0) {
          const eventMsg = attackerDamage > defenderDamage
            ? `[\`${attacker.map.name}\`] ${helper.generatePlayerName(attacker, true)} attacked ${helper.generatePlayerName(defender, true)} with ${helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${helper.generateGenderString(defender, 'he')} managed to get away!
↳ ${helper.capitalizeFirstLetter(helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`
            : `[\`${attacker.map.name}\`] ${helper.generatePlayerName(attacker, true)} attacked ${helper.generatePlayerName(defender, true)} with ${helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${helper.generatePlayerName(defender, true)} was too strong!
↳ ${helper.capitalizeFirstLetter(helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;

          const expGainAttacker = Math.floor(defenderDamage / 8);
          const expGainDefender = Math.floor(attackerDamage / 8);
          const eventLog = `Attacked ${defender.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`;
          const otherPlayerLog = `Attacked by ${attacker.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;

          attacker.experience.current += expGainAttacker;
          attacker.experience.total += expGainAttacker;
          defender.experience.current += expGainDefender;
          defender.experience.total += expGainDefender;

          defender.health > attacker.health ? attacker.fled.you++ && defender.fled.player++ : attacker.fled.player++ && defender.fled.you++;
          await helper.sendMessage(hook, attacker, false, eventMsg);
          await helper.sendPrivateMessage(hook, attacker, eventLog.concat('```').concat(battleResult).concat('```'), true);
          await helper.sendPrivateMessage(hook, defender, otherPlayerLog.concat('```').concat(battleResult).concat('```'), true);
          await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.action);
          await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.action);
          await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.pvp);
          await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.pvp);

          return {
            result: enumHelper.battle.outcomes.fled,
            updatedAttacker: attacker,
            updatedDefender: defender
          };
        }

        battleResult = battleResult.replace(`  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`, '');
        const expGain = Math.floor(defenderDamage / 8);
        const eventMsg = `[\`${attacker.map.name}\`] ${helper.generatePlayerName(attacker, true)} just killed \`${defender.name}\` with ${helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\`!
↳ ${helper.capitalizeFirstLetter(helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;
        const eventLog = `Killed ${defender.name} in ${attacker.map.name}. [${expGain} exp]`;
        const otherPlayerLog = `Died to ${attacker.name} in ${attacker.map.name}.`;

        attacker.battles.won++;
        defender.battles.lost++;
        attacker.experience.current += expGain;
        attacker.experience.total += expGain;
        await helper.sendMessage(hook, attacker, false, eventMsg);
        await helper.sendPrivateMessage(hook, attacker, eventLog.concat('```').concat(battleResult).concat('```'), true);
        await helper.sendPrivateMessage(hook, defender, otherPlayerLog.concat('```').concat(battleResult).concat('```'), true);
        await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.action);
        await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.action);
        await helper.logEvent(attacker, db, eventLog, enumHelper.logTypes.pvp);
        await helper.logEvent(defender, db, otherPlayerLog, enumHelper.logTypes.pvp);

        return {
          result: enumHelper.battle.outcomes.win,
          updatedAttacker: attacker,
          updatedDefender: defender
        };
      } catch (err) {
        errorlog.error(err);
      }
    },

    pveResults: async (params, results, multiplier) => {
      const { hook, db, helper } = params;
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
          pmMsg,
          isQuestCompleted
        } = await pveMessageFormat(helper, results, results.attacker, playerMaxHealth, multiplier);

        if (updatedPlayer.health <= 0) {
          updatedPlayer.battles.lost++;
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

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
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

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
        await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);
        if (isQuestCompleted) {
          eventMsg = eventMsg.concat(`${helper.generatePlayerName(updatedPlayer, true)} finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
          pmMsg = pmMsg.concat(`Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
          await helper.logEvent(hook, db, `Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`, enumHelper.logTypes.action);
        }

        return {
          result: enumHelper.battle.outcomes.win,
          updatedPlayer,
          updatedMob: results.defender,
          msg: eventMsg,
          pmMsg
        };
      } catch (err) {
        errorLog.error(err);
      }
    },

    steal: async (params, stealingPlayer, victimPlayer, InventoryManager) => {
      const { hook, db, helper } = params;
      try {
        const luckStealChance = await helper.randomBetween(0, 99);
        const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
        const canSteal = !Number.isFinite(chance) ? 0 : chance;
        let eventMsg = '';
        let eventLog = '';
        let otherPlayerLog = '';

        if (luckStealChance > (90 - canSteal)) {
          const luckItem = await helper.randomBetween(0, 2);
          const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

          if (![enumHelper.equipment.empty.armor.name, enumHelper.equipment.empty.weapon.name].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
            let stolenEquip;
            if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
              const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
              const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
              stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
              stolenEquip.name = removePreviousOwnerName;

              eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
              eventLog = `Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
              otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
            } else {
              stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
              stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
              eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
              eventLog = `Stole ${stolenEquip.name}`;
              otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
            }
            victimPlayer.stolen++;
            stealingPlayer.stole++;
            if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
              const oldItemRating = await helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
              const newItemRating = await helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
              if (oldItemRating < newItemRating) {
                stealingPlayer = await helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, stolenEquip);
                if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
                  stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = victimPlayer.equipment[itemKeys[luckItem]].previousOwners;
                  stealingPlayer.equipment[itemKeys[luckItem]].previousOwners.push(victimPlayer.name);
                } else {
                  stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = [`${victimPlayer.name}`];
                }
              } else {
                stealingPlayer = await InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
              }
              if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find(equip => equip.position === enumHelper.equipment.types[itemKeys[luckItem]].position) !== undefined) {
                const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKeys[luckItem]].position)
                  .sort((item1, item2) => item2.power - item1.power)[0];
                victimPlayer = await helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
              } else {
                victimPlayer = await helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
              }
            }
          }
          await helper.sendMessage(hook, stealingPlayer, false, eventMsg);
          await helper.sendPrivateMessage(hook, stealingPlayer, eventLog, true);
          await helper.sendPrivateMessage(hook, victimPlayer, otherPlayerLog, true);
          await helper.logEvent(stealingPlayer, db, eventLog, enumHelper.logTypes.action);
          await helper.logEvent(victimPlayer, db, otherPlayerLog, enumHelper.logTypes.action);
          await helper.logEvent(stealingPlayer, db, eventLog, enumHelper.logTypes.pvp);
          await helper.logEvent(victimPlayer, db, otherPlayerLog, enumHelper.logTypes.pvp);

          return { stealingPlayer, victimPlayer };
        } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
          const goldStolen = Math.round(victimPlayer.gold.current / 6);
          if (goldStolen !== 0) {
            stealingPlayer.gold.current += goldStolen;
            stealingPlayer.gold.total += goldStolen;
            stealingPlayer.gold.stole += goldStolen;

            victimPlayer.gold.current -= goldStolen;
            victimPlayer.gold.stolen += goldStolen;

            eventMsg = await helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
            eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;
            otherPlayerLog = `${stealingPlayer.name} stole ${goldStolen} gold from you`;
            await helper.sendMessage(hook, stealingPlayer, false, eventMsg);
            await helper.sendPrivateMessage(hook, stealingPlayer, eventLog, true);
            await helper.sendPrivateMessage(hook, victimPlayer, otherPlayerLog, true);
            await helper.logEvent(stealingPlayer, db, eventLog, enumHelper.logTypes.action);
            await helper.logEvent(victimPlayer, db, otherPlayerLog, enumHelper.logTypes.action);
            await helper.logEvent(stealingPlayer, db, eventLog, enumHelper.logTypes.pvp);
            await helper.logEvent(victimPlayer, db, otherPlayerLog, enumHelper.logTypes.pvp);

            return { stealingPlayer, victimPlayer };
          }
        }

        return { stealingPlayer, victimPlayer };
      } catch (err) {
        errorLog.error(err);
      }
    },

    dropItem: async (params, updatedPlayer, mob, ItemManager, InventoryManager) => {
      const { db, helper } = params;
      try {
        const dropitemChance = await helper.randomBetween(0, 99);

        if (dropitemChance <= 15 + (updatedPlayer.stats.luk / 4)) {
          const item = await ItemManager.generateItem(updatedPlayer, mob.find(obj => obj.health <= 0));
          if (item.position !== enumHelper.inventory.position) {
            const oldItemRating = await helper.calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
            const newItemRating = await helper.calculateItemRating(updatedPlayer, item);
            if (oldItemRating > newItemRating) {
              updatedPlayer = await InventoryManager.addEquipmentIntoInventory(updatedPlayer, item);
            } else {
              updatedPlayer = await helper.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
            }
          } else {
            updatedPlayer = await InventoryManager.addItemIntoInventory(updatedPlayer, item);
          }

          let eventMsg;
          if (!item.holiday) {
            eventMsg = `${helper.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\``;
          } else {
            eventMsg = `**${helper.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\`**`;
          }
          const eventLog = `Received ${item.name} from ${mob[0].name}`;
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

          return {
            type: 'actions',
            updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };
        }

        return { updatedPlayer };
      } catch (err) {
        errorLog.error(err);
      }
    }
  },

  luck: {
    item: {
      spell: async (params, updatedPlayer, spell) => {
        const { hook, db, helper } = params;
        try {
          const { eventMsg, eventLog } = await helper.randomItemEventMessage(updatedPlayer, spell);
          if (updatedPlayer.spells.length > 0) {
            let shouldAddToList = false;
            updatedPlayer.spells.forEach((ownedSpell, index) => {
              const spellName = ownedSpell.name.split(/ (.+)/)[1];
              if (spell.power > ownedSpell.power) {
                if (spell.name.includes(spellName)) {
                  updatedPlayer.spells.splice(index, 1);
                }
                shouldAddToList = true;
              }
            });

            if (shouldAddToList) {
              updatedPlayer.spells.push(spell);
              await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
              await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
              await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

              return updatedPlayer;
            }
          } else {
            updatedPlayer.spells.push(spell);
            await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
            await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
            await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

            return updatedPlayer;
          }

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      item: async (params, updatedPlayer, item, InventoryManager) => {
        const { hook, db, helper } = params;
        try {
          const { eventMsg, eventLog } = await helper.randomItemEventMessage(updatedPlayer, item);
          if (item.position !== enumHelper.inventory.position) {
            const oldItemRating = await helper.calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
            const newItemRating = await helper.calculateItemRating(updatedPlayer, item);
            if (oldItemRating > newItemRating) {
              updatedPlayer = await InventoryManager.addEquipmentIntoInventory(updatedPlayer, item);
            } else {
              updatedPlayer = await helper.setPlayerEquipment(updatedPlayer, item.position, item);
            }
          } else {
            updatedPlayer = await InventoryManager.addItemIntoInventory(updatedPlayer, item);
          }

          await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      }
    },

    gold: async (params, updatedPlayer, multiplier) => {
      const { hook, db, helper } = params;
      try {
        const luckGoldChance = await helper.randomBetween(0, 99);
        if (luckGoldChance >= 75) {
          const luckGoldDice = await helper.randomBetween(5, 100);
          const goldAmount = await Math.round((luckGoldDice * updatedPlayer.stats.luk) / 2) * multiplier;
          updatedPlayer.gold.current += goldAmount;
          updatedPlayer.gold.total += goldAmount;

          const eventMsg = `[\`${updatedPlayer.map.name}\`] ${helper.generatePlayerName(updatedPlayer, true)} found ${goldAmount} gold!`;
          const eventLog = `Found ${goldAmount} gold in ${updatedPlayer.map.name}`;

          await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

          return updatedPlayer;
        }

        return updatedPlayer;
      } catch (err) {
        errorLog.error(err);
      }
    },

    gambling: async (params, updatedPlayer) => {
      const { hook, db, helper } = params;
      try {
        const luckGambleChance = await helper.randomBetween(0, 99);
        const luckGambleGold = Math.floor(2 * ((Math.log(updatedPlayer.gold.current) * updatedPlayer.gold.current) / 100));
        if (updatedPlayer.gold.current < luckGambleGold) {
          return updatedPlayer;
        }

        updatedPlayer.gambles++;
        if (luckGambleChance <= 50 - (updatedPlayer.stats.luk / 4)) {
          const { eventMsg, eventLog } = await helper.randomGambleEventMessage(updatedPlayer, luckGambleGold, false);
          updatedPlayer.gold.current -= luckGambleGold;
          updatedPlayer.gold.gambles.lost += luckGambleGold;
          if (updatedPlayer.gold.current <= 0) {
            updatedPlayer.gold.current = 0;
          }

          await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
          await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

          return updatedPlayer;
        }
        const { eventMsg, eventLog } = await helper.randomGambleEventMessage(updatedPlayer, luckGambleGold, true);
        updatedPlayer.gold.current += luckGambleGold;
        updatedPlayer.gold.total += luckGambleGold;
        updatedPlayer.gold.gambles.won += luckGambleGold;

        await helper.sendMessage(hook, updatedPlayer, false, eventMsg);
        await helper.sendPrivateMessage(hook, updatedPlayer, eventLog, true);
        await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

        return updatedPlayer;
      } catch (err) {
        errorLog.error(err);
      }
    },

    gods: {
      hades: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          const luckExpAmount = await helper.randomBetween(5, 15 + (updatedPlayer.level * 2));
          updatedPlayer.experience.current -= luckExpAmount;
          updatedPlayer.experience.lost += luckExpAmount;
          if (updatedPlayer.experience.current < 0) {
            updatedPlayer.experience.current = 0;
          }

          const eventMsgHades = `Hades unleashed his wrath upon ${helper.generatePlayerName(updatedPlayer, true)} making ${helper.generateGenderString(updatedPlayer, 'him')} lose ${luckExpAmount} experience!`;
          const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgHades);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogHades, true);
          await helper.logEvent(updatedPlayer, db, eventLogHades, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      zeus: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          const luckHealthAmount = await helper.randomBetween(5, 50 + (updatedPlayer.level * 2));
          updatedPlayer.health -= luckHealthAmount;

          const eventMsgZeus = `${helper.generatePlayerName(updatedPlayer, true)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
          const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgZeus);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogZeus, true);
          await helper.logEvent(updatedPlayer, db, eventLogZeus, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      aseco: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          const healthDeficit = (100 + (updatedPlayer.level * 5)) - updatedPlayer.health;
          let eventMsgAseco = '';
          let eventLogAseco = '';

          if (healthDeficit) {
            const healAmount = Math.round(healthDeficit / 3);
            eventMsgAseco = `Fortune smiles upon ${helper.generatePlayerName(updatedPlayer, true)} as Aseco cured ${helper.generateGenderString(updatedPlayer, 'his')} sickness and restored ${helper.generateGenderString(updatedPlayer, 'him')} ${healAmount} health!`;
            eventLogAseco = `Aseco healed you for ${healAmount}`;

            updatedPlayer.health += healAmount;
            await helper.sendMessage(hook, updatedPlayer, false, eventMsgAseco);
            await helper.sendPrivateMessage(hook, updatedPlayer, eventLogAseco, true);
            await helper.logEvent(updatedPlayer, db, eventLogAseco, enumHelper.logTypes.action);

            return updatedPlayer;
          }

          eventMsgAseco = `Aseco gave ${helper.generatePlayerName(updatedPlayer, true)} an elixir of life but it caused no effect on ${helper.generateGenderString(updatedPlayer, 'him')}. Actually it tasted like wine!`;
          eventLogAseco = 'Aseco wanted to heal you, but you had full health';
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgAseco);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogAseco, true);
          await helper.logEvent(updatedPlayer, db, eventLogAseco, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      hermes: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          let eventMsgHermes = '';
          let eventLogHermes = '';
          const goldTaken = Math.ceil(updatedPlayer.gold.current / 6);

          if (updatedPlayer.gold.current < goldTaken) {
            eventMsgHermes = `Hermes demanded some gold from ${helper.generatePlayerName(updatedPlayer, true)} but as ${helper.generateGenderString(updatedPlayer, 'he')} had no money, Hermes left him alone.`;
            eventLogHermes = 'Hermes demanded gold from you but you had nothing to give';
            await helper.sendMessage(hook, updatedPlayer, false, eventMsgHermes);
            await helper.sendPrivateMessage(hook, updatedPlayer, eventLogHermes, true);
            await helper.logEvent(updatedPlayer, db, eventLogHermes, enumHelper.logTypes.action);

            return updatedPlayer;
          }
          eventMsgHermes = `Hermes took ${goldTaken} gold from ${helper.generatePlayerName(updatedPlayer, true)} by force. Probably he is just out of humor.`;
          eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

          updatedPlayer.gold.current -= goldTaken;
          updatedPlayer.gold.lost += goldTaken;
          if (updatedPlayer.gold.current < 0) {
            updatedPlayer.gold.current = 0;
          }
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgHermes);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogHermes, true);
          await helper.logEvent(updatedPlayer, db, eventLogHermes, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      athena: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          const luckExpAthena = await helper.randomBetween(5, 15 + (updatedPlayer.level * 2));
          updatedPlayer.experience.current += luckExpAthena;
          updatedPlayer.experience.total += luckExpAthena;

          const eventMsgAthena = `Athena shared her wisdom with ${helper.generatePlayerName(updatedPlayer, true)} making ${helper.generateGenderString(updatedPlayer, 'him')} gain ${luckExpAthena} experience!`;
          const eventLogAthena = `Athena shared her wisdom with you making you gain ${luckExpAthena} experience`;
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgAthena);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogAthena, true);
          await helper.logEvent(updatedPlayer, db, eventLogAthena, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      eris: async (params, updatedPlayer, spell) => {
        const { hook, db, helper } = params;
        try {
          const eventMsgEris = `Eris has given ${helper.generatePlayerName(updatedPlayer, true)} a scroll containing \`${spell.name}\` to add to ${helper.generateGenderString(updatedPlayer, 'his')} spellbook!`;
          const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
          if (updatedPlayer.spells.length > 0) {
            let shouldAddToList = false;
            updatedPlayer.spells.forEach((ownedSpell, index) => {
              const spellName = ownedSpell.name.split(/ (.+)/)[1];
              if (spell.power > ownedSpell.power) {
                if (spell.name.includes(spellName)) {
                  updatedPlayer.spells.splice(index, 1);
                  shouldAddToList = true;
                } else {
                  shouldAddToList = true;
                }
              }
            });

            if (shouldAddToList) {
              updatedPlayer.spells.push(spell);
              await helper.sendMessage(hook, updatedPlayer, false, eventMsgEris);
              await helper.sendPrivateMessage(hook, updatedPlayer, eventLogEris, true);
              await helper.logEvent(updatedPlayer, db, eventLogEris, enumHelper.logTypes.action);

              return updatedPlayer;
            }
          } else {
            updatedPlayer.spells.push(spell);
            await helper.sendMessage(hook, updatedPlayer, false, eventMsgEris);
            await helper.sendPrivateMessage(hook, updatedPlayer, eventLogEris, true);
            await helper.logEvent(updatedPlayer, db, eventLogEris, enumHelper.logTypes.action);

            return updatedPlayer;
          }

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      },

      dionysus: async (params, updatedPlayer) => {
        const { hook, db, helper } = params;
        try {
          // Might overwrite his event if currently saving if he fired and event at the same time.
          const increaseMult = await helper.randomBetween(1, 3);
          const timeLimit = await helper.randomBetween(maximumTimer * 60000, (maximumTimer * 15) * 60000);

          const eventMsgDionysus = `Dionysus has partied with ${helper.generatePlayerName(updatedPlayer, true)} increasing ${helper.generateGenderString(updatedPlayer, 'his')} multiplier by ${increaseMult} for ${Math.floor(timeLimit / 60000)} minutes!`;
          const eventLogDionysus = `Dionysus partied with you increasing your multiplier by ${increaseMult} for ${Math.ceil(timeLimit / 60000)} minutes!`;
          updatedPlayer.personalMultiplier = increaseMult;
          setTimeout(() => {
            db.loadPlayer(updatedPlayer.discordId)
              .then((loadedPlayer) => {
                loadedPlayer.personalMultiplier = 0;
                return loadedPlayer;
              })
              .then(loadedPlayer => db.savePlayer(loadedPlayer));
          }, timeLimit);
          await helper.sendMessage(hook, updatedPlayer, false, eventMsgDionysus);
          await helper.sendPrivateMessage(hook, updatedPlayer, eventLogDionysus, true);
          await helper.logEvent(updatedPlayer, db, eventLogDionysus, enumHelper.logTypes.action);

          return updatedPlayer;
        } catch (err) {
          errorLog.error(err);
        }
      }
    }
  },

  special: {
    snowFlake: async (params, updatedPlayer, snowFlake) => {
      const { hook, db, helper } = params;
      try {
        const snowFlakeDice = await helper.randomBetween(0, 99);
        if (snowFlakeDice <= 5) {
          const oldItemRating = await helper.calculateItemRating(updatedPlayer, updatedPlayer.equipment.relic);
          const newItemRating = await helper.calculateItemRating(updatedPlayer, snowFlake);
          if (oldItemRating < newItemRating) {
            const eventMsgSnowflake = `<@!${updatedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
            const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';
            updatedPlayer = await helper.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
            await helper.sendMessage(hook, updatedPlayer, false, eventMsgSnowflake);
            await helper.sendPrivateMessage(hook, updatedPlayer, eventLogSnowflake, true);
            await helper.logEvent(updatedPlayer, db, eventLog, enumHelper.logTypes.action);

            return updatedPlayer;
          }
        }

        return updatedPlayer;
      } catch (err) {
        errorLog.error(err);
      }
    }
  }
};
module.exports = events;
