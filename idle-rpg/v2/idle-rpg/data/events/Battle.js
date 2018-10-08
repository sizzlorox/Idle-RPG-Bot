// BASE
const { aggregation } = require('../../../Base/Util');
const BaseGame = require('../../../Base/Game');
const BaseHelper = require('../../../Base/Helper');

// UTILS
const { errorLog } = require('../../../../utils/logger');

// DATA
const { pvpLevelRestriction } = require('../../../../../settings');
const enumHelper = require('../../../../utils/enumHelper');
const BattleSimulator = require('../../../../game/utils/Battle');

class Battle extends aggregation(BaseGame, BaseHelper) {

  constructor(params) {
    super();
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
      eventMsg.push(...battleResults.msg);
      eventLog.push(...battleResults.pm);
      updatedPlayer = battleResults.updatedPlayer;
      switch (battleResults.result) {
        case enumHelper.battle.outcomes.win:
          const dropItemResults = await this.dropItem(updatedPlayer, battleResults.updatedMob, eventMsg, eventLog);
          const checkedWinResults = await this.checkExperience(dropItemResults.updatedPlayer, eventMsg, eventLog);
          return {
            type: 'actions',
            updatedPlayer: checkedWinResults.updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };

        case enumHelper.battle.outcomes.fled:
          const checkedFledResults = await this.checkExperience(updatedPlayer, eventMsg, eventLog);
          return {
            type: 'actions',
            updatedPlayer: checkedFledResults.updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          };

        case enumHelper.battle.outcomes.lost:
          const checkLostResults = await this.checkHealth(this.Database, this.MapManager, updatedPlayer, battleResults.updatedMob, eventMsg, eventLog);
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
      updatedPlayer = await this.passiveRegen(updatedPlayer, ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.end / 2), ((5 * updatedPlayer.level) / 2) + (updatedPlayer.stats.int / 2));
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
      const {
        updatedPlayer,
        expGain,
        goldGain,
        questExpGain,
        questGoldGain,
        eventMsg,
        eventLog,
        isQuestCompleted
      } = await this.pveMessageFormat(results, results.attacker, playerMaxHealth, multiplier);

      if (updatedPlayer.health <= 0) {
        updatedPlayer.battles.lost++;
        await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.action);

        return {
          result: enumHelper.battle.outcomes.lost,
          updatedPlayer,
          updatedMob: results.defender,
          msg: eventMsg,
          pm: eventLog
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
          updatedMob: results.defender,
          msg: eventMsg,
          pm: eventLog
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
        eventMsg.push(`${this.generatePlayerName(updatedPlayer, true)} finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
        eventLog.push(`Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`);
        await this.Helper.logEvent(updatedPlayer, this.Database, `Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`, enumHelper.logTypes.action);
      }

      return {
        result: enumHelper.battle.outcomes.win,
        updatedPlayer,
        updatedMob: results.defender,
        msg: eventMsg,
        pm: eventLog
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async findPlayerToBattle(playerObj, onlinePlayers) {
    const updatedPlayer = Object.assign({}, playerObj);
    const mappedPlayers = await this.Database.getSameMapPlayers(updatedPlayer.guildId, updatedPlayer.map.name);
    if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
      const sameMapPlayers = mappedPlayers.filter(player => player.name !== updatedPlayer.name
        && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
        && player.level <= updatedPlayer.level + pvpLevelRestriction && player.level >= updatedPlayer.level - pvpLevelRestriction);
      const playersWithBounty = sameMapPlayers.filter(player => player.currentBounty !== 0)
        .map(player => player.chance = Math.floor((player.currentBounty * Math.log(1.2)) / 100));

      if (sameMapPlayers.length > 0 && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
        const randomPlayerIndex = await this.randomBetween(0, sameMapPlayers.length - 1);
        let randomPlayer;
        if (playersWithBounty.length > 0 && await this.randomBetween(0, 100) >= 50) {
          if (playersWithBounty.length > 1) {
            playersWithBounty.sort(player1, player2 => player2.chance - player1.chance);
          }

          const diceMax = playersWithBounty[0].chance;
          const randomDice = await this.Helper.randomBetween(0, diceMax);
          const filteredBountyPlayers = playersWithBounty.filter(player => player.chance >= randomDice);
          if (filteredBountyPlayers.length > 0) {
            const filteredBountyPlayersIndex = await this.randomBetween(0, filteredBountyPlayers.length - 1);
            randomPlayer = filteredBountyPlayers[filteredBountyPlayersIndex]._doc;
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

      const { attacker, defender, attackerDamage, defenderDamage } = await this.BattleSimulator.simulateBattle(updatedPlayer, playerToBattle);
      const defenderMaxHealth = 100 + (defender.level * 5);
      const playerMaxHealth = 100 + (attacker.level * 5);

      let battleResultLog = `Battle Results:
    ${attacker.name}'s ${attacker.equipment.weapon.name} did ${attackerDamage} damage.
    ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.
    ${defender.name}'s ${defender.equipment.weapon.name} did ${defenderDamage} damage.
    ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`;

      if (attacker.health <= 0 && defender.health > 0) {
        battleResultLog = battleResultLog.replace(`  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.`, '');
        eventMsg.push(`[\`${attacker.map.name}\`] ${this.generatePlayerName(defender, true)} just killed ${this.generatePlayerName(attacker, true)} with ${this.generateGenderString(defender, 'his')} \`${defender.equipment.weapon.name}\`!
↳ ${this.generatePlayerName(attacker, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${this.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);

        const expGain = Math.floor((attackerDamage / 8));
        eventLog.push(`Died to ${defender.name} in ${attacker.map.name}.`);
        const otherPlayerLog = `Killed ${attacker.name} in ${attacker.map.name}. [${expGain} exp]`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));

        attacker.battles.lost++;
        defender.battles.won++;
        defender.experience.current += expGain;
        defender.experience.total += expGain;
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.pvp);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

        result = enumHelper.battle.outcomes.lost;
      } else if (defender.health <= 0 && attacker.health > 0) {
        battleResultLog = battleResultLog.replace(`  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`, '');
        const expGain = Math.floor((defenderDamage / 8));
        eventMsg.push(`[\`${attacker.map.name}\`] ${this.generatePlayerName(attacker, true)} just killed \`${defender.name}\` with ${this.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\`!
↳ ${this.capitalizeFirstLetter(this.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);
        eventLog.push(`Killed ${defender.name} in ${attacker.map.name}. [${expGain} exp]`);
        const otherPlayerLog = `Died to ${attacker.name} in ${attacker.map.name}.`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));

        attacker.battles.won++;
        defender.battles.lost++;
        attacker.experience.current += expGain;
        attacker.experience.total += expGain;
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.action);
        await this.Helper.logEvent(attacker, this.Database, eventLog, enumHelper.logTypes.pvp);
        await this.Helper.logEvent(defender, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);
        result = enumHelper.battle.outcomes.win;
      } else if (defender.health > 0 && attacker.health > 0) {
        eventMsg.push(attackerDamage > defenderDamage
          ? `[\`${attacker.map.name}\`] ${this.generatePlayerName(attacker, true)} attacked ${this.generatePlayerName(defender, true)} with ${this.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${this.generateGenderString(defender, 'he')} managed to get away!
↳ ${this.capitalizeFirstLetter(this.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`
          : `[\`${attacker.map.name}\`] ${this.generatePlayerName(attacker, true)} attacked ${this.generatePlayerName(defender, true)} with ${this.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${this.generatePlayerName(defender, true)} was too strong!
↳ ${this.capitalizeFirstLetter(this.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${this.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`);

        const expGainAttacker = Math.floor((defenderDamage / 8));
        const expGainDefender = Math.floor((attackerDamage / 8));
        eventLog.push(`Attacked ${defender.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`);
        const otherPlayerLog = `Attacked by ${attacker.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;
        eventLog.push('```'.concat(battleResultLog).concat('```'));
        otherPlayerPmMsg.push(otherPlayerLog);
        otherPlayerPmMsg.push('```'.concat(battleResultLog).concat('```'));

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

      switch (result) {
        case enumHelper.battle.outcomes.win:
          const winResults = await this.steal(attacker, defender);
          eventMsg.push(...winResults.msg);
          eventLog.push(...winResults.pm);
          otherPlayerPmMsg.push(...winResults.otherPlayerPmMsg);
          const victimCheckHealth = await this.checkHealth(this.Database, this.MapManager, winResults.victimPlayer, winResults.stealingPlayer, eventMsg, otherPlayerPmMsg, eventLog);
          await this.Database.savePlayer(victimCheckHealth.updatedPlayer);
          const winnerCheckExp = await this.checkExperience(victimCheckHealth.updatedAttacker, eventMsg, eventLog);

          return {
            type: 'actions',
            updatedPlayer: winnerCheckExp.updatedPlayer,
            msg: eventMsg,
            pm: eventLog,
            attackerObj: victimCheckHealth.updatedPlayer,
            otherPlayerPmMsg
          };

        case enumHelper.battle.outcomes.fled:
          const fledUpdatedDefender = await this.checkExperience(defender, eventMsg, otherPlayerPmMsg);
          await this.Database.savePlayer(fledUpdatedDefender.updatedPlayer);
          const fledResult = await this.checkExperience(attacker, eventMsg, eventLog);

          return {
            type: 'actions',
            updatedPlayer: fledResult.updatedPlayer,
            msg: eventMsg,
            pm: eventLog,
            attackerObj: fledUpdatedDefender.updatedPlayer,
            otherPlayerPmMsg
          };

        case enumHelper.battle.outcomes.lost:
          const loseResults = await this.steal(defender, attacker);
          eventMsg.push(...loseResults.msg);
          eventLog.push(...loseResults.otherPlayerPmMsg);
          otherPlayerPmMsg.push(...loseResults.pm);
          const lostUpdatedDefender = await this.checkExperience(loseResults.stealingPlayer, eventMsg, otherPlayerPmMsg);
          await this.Database.savePlayer(lostUpdatedDefender.updatedPlayer);
          const loserCheckHealth = await this.checkHealth(this.Database, this.MapManager, loseResults.victimPlayer, lostUpdatedDefender.updatedPlayer, eventMsg, eventLog, otherPlayerPmMsg);

          return {
            type: 'actions',
            updatedPlayer: loserCheckHealth.updatedPlayer,
            msg: eventMsg,
            pm: eventLog,
            attackerObj: loserCheckHealth.updatedAttacker,
            otherPlayerPmMsg
          };
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
      const luckStealChance = await this.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      if (luckStealChance > (90 - canSteal)) {
        const luckItem = await this.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (![enumHelper.equipment.empty.armor.name, enumHelper.equipment.empty.weapon.name].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          let stolenEquip;
          if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
            const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
            const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = removePreviousOwnerName;
            eventMsg.push(this.setImportantMessage(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} just stole ${stolenEquip.name}!`));
            eventLog.push(`Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`);
            otherPlayerLog.push(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`);
          } else {
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            eventMsg.push(this.setImportantMessage(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} just stole ${stolenEquip.name}!`));
            eventLog.push(`Stole ${stolenEquip.name}`);
            otherPlayerLog.push(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`);
          }
          victimPlayer.stolen++;
          stealingPlayer.stole++;
          if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
            const oldItemRating = await this.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
            const newItemRating = await this.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
            if (oldItemRating < newItemRating) {
              stealingPlayer = await this.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, stolenEquip);
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
              victimPlayer = await this.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
            } else {
              victimPlayer = await this.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
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

          eventMsg.push(this.setImportantMessage(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} just stole ${goldStolen} gold from ${victimPlayer.name}${victimPlayer.titles.current !== 'None' ? ` the ${victimPlayer.titles.current}` : ''}!`));
          eventLog.push(`Stole ${goldStolen} gold from ${victimPlayer.name}`);
          otherPlayerLog.push(`${stealingPlayer.name}${stealingPlayer.titles.current !== 'None' ? ` the ${stealingPlayer.titles.current}` : ''} stole ${goldStolen} gold from you`);

          await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.action);
          await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.action);
          await this.Helper.logEvent(stealingPlayer, this.Database, eventLog, enumHelper.logTypes.pvp);
          await this.Helper.logEvent(victimPlayer, this.Database, otherPlayerLog, enumHelper.logTypes.pvp);

          return { stealingPlayer, victimPlayer, msg: eventMsg, pm: eventLog, otherPlayerPmMsg: otherPlayerLog };
        }
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async dropItem(playerObj, mob, eventMsg, eventLog) {
    let updatedPlayer = Object.assign({}, playerObj);
    try {
      const dropitemChance = await this.randomBetween(0, 100);
      if (dropitemChance <= 15 + (updatedPlayer.stats.luk / 4)) {
        const item = await this.ItemManager.generateItem(updatedPlayer, mob.find(obj => obj.health <= 0));
        if (item.position !== enumHelper.inventory.position) {
          const oldItemRating = await this.calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
          const newItemRating = await this.calculateItemRating(updatedPlayer, item);
          if (oldItemRating > newItemRating) {
            updatedPlayer = await this.InventoryManager.addEquipmentIntoInventory(updatedPlayer, item);
          } else {
            updatedPlayer = await this.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
          }
        } else {
          updatedPlayer = await this.InventoryManager.addItemIntoInventory(updatedPlayer, item);
        }

        if (!item.holiday) {
          eventMsg.push(`${this.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\``);
        } else {
          eventMsg.push(`**${this.generatePlayerName(updatedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\`**`);
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
        updatedPlayer
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

}
module.exports = Battle;