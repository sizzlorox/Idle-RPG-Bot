const enumHelper = require('../../../utils/enumHelper');
const { errorLog } = require('../../../utils/logger');
const { maximumTimer } = require('../../../../settings');
const { randomBetween } = require('../../utils/helpers');
const { generatePlayerName, generateGenderString } = require('../../utils/formatters');
const { randomItemEventMessage, randomGambleEventMessage } = require('../../utils/messageHelpers');
const { calculateItemRating } = require('../../utils/battleHelpers');

class LuckEvent {

  constructor({ db, map, spellGen, itemGen, inventory, player }) {
    this.db = db;
    this.map = map;
    this.spellGen = spellGen;
    this.itemGen = itemGen;
    this.inventory = inventory;
    this.player = player;
  }

  async godsEvent(playerObj) {
    const updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const luckEvent = randomBetween(1, 10);
      switch (luckEvent) {
        case 1: {
          const luckExpAmount = randomBetween(5, 15 + (updatedPlayer.level * 2));
          updatedPlayer.experience.current -= luckExpAmount;
          updatedPlayer.experience.lost += luckExpAmount;
          if (updatedPlayer.experience.current < 0) updatedPlayer.experience.current = 0;
          eventMsg.push(`Hades unleashed his wrath upon ${generatePlayerName(updatedPlayer, true)} making ${generateGenderString(updatedPlayer, 'him')} lose ${luckExpAmount} experience!`);
          eventLog.push(`Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`);
          break;
        }
        case 2: {
          const luckHealthAmount = randomBetween(5, 50 + (updatedPlayer.level * 2));
          updatedPlayer.health -= luckHealthAmount;
          if (updatedPlayer.health < 1) updatedPlayer.health = 1;
          eventMsg.push(`${generatePlayerName(updatedPlayer, true)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health!`);
          eventLog.push(`Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`);
          break;
        }
        case 3: {
          const healthDeficit = (100 + (updatedPlayer.level * 5)) - updatedPlayer.health;
          if (healthDeficit) {
            const healAmount = Math.round(healthDeficit / 3);
            eventMsg.push(`Fortune smiles upon ${generatePlayerName(updatedPlayer, true)} as Aseco cured ${generateGenderString(updatedPlayer, 'his')} sickness and restored ${generateGenderString(updatedPlayer, 'him')} ${healAmount} health!`);
            eventLog.push(`Aseco healed you for ${healAmount}`);
            updatedPlayer.health += healAmount;
            break;
          }
          eventMsg.push(`Aseco gave ${generatePlayerName(updatedPlayer, true)} an elixir of life but it caused no effect on ${generateGenderString(updatedPlayer, 'him')}. Actually it tasted like wine!`);
          eventLog.push('Aseco wanted to heal you, but you had full health');
          break;
        }
        case 4: {
          const goldTaken = Math.ceil(updatedPlayer.gold.current / 6);
          if (updatedPlayer.gold.current < goldTaken || goldTaken === 0) {
            eventMsg.push(`Hermes demanded some gold from ${generatePlayerName(updatedPlayer, true)} but as ${generateGenderString(updatedPlayer, 'he')} had no money, Hermes left him alone.`);
            eventLog.push('Hermes demanded gold from you but you had nothing to give');
            break;
          }
          eventMsg.push(`Hermes took ${goldTaken} gold from ${generatePlayerName(updatedPlayer, true)} by force. Probably he is just out of humor.`);
          eventLog.push(`Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`);
          updatedPlayer.gold.current -= goldTaken;
          updatedPlayer.gold.lost += goldTaken;
          if (updatedPlayer.gold.current < 0) updatedPlayer.gold.current = 0;
          break;
        }
        case 5: {
          const luckExpAthena = randomBetween(5, 15 + (updatedPlayer.level * 2));
          updatedPlayer.experience.current += luckExpAthena;
          updatedPlayer.experience.total += luckExpAthena;
          eventMsg.push(`Athena shared her wisdom with ${generatePlayerName(updatedPlayer, true)} making ${generateGenderString(updatedPlayer, 'him')} gain ${luckExpAthena} experience!`);
          eventLog.push(`Athena shared her wisdom with you making you gain ${luckExpAthena} experience`);
          const checkedExp = await this.player.checkExperience(updatedPlayer, eventMsg, eventLog);
          return { type: 'actions', updatedPlayer: checkedExp.updatedPlayer, msg: checkedExp.msg, pm: checkedExp.pm };
        }
        case 6: {
          const spell = this.spellGen.generateSpell(updatedPlayer);
          let shouldAddToList = updatedPlayer.spells.length === 0;
          if (!shouldAddToList) {
            const dupIdx = updatedPlayer.spells.findIndex(ownedSpell => spell.name.includes(ownedSpell.name.split(/ (.+)/)[1]) && spell.power > ownedSpell.power);
            if (dupIdx !== -1) {
              updatedPlayer.spells.splice(dupIdx, 1);
              shouldAddToList = true;
            } else if (updatedPlayer.spells.some(ownedSpell => spell.power > ownedSpell.power)) {
              shouldAddToList = true;
            }
          }
          if (shouldAddToList) {
            updatedPlayer.spells.push(spell);
            eventMsg.push(`Eris has given ${generatePlayerName(updatedPlayer, true)} a scroll containing \`${spell.name}\` to add to ${generateGenderString(updatedPlayer, 'his')} spellbook!`);
            eventLog.push(`Eris gave you a scroll of ${spell.name}`);
            break;
          }
          return { updatedPlayer };
        }
        case 7: {
          const increaseMult = randomBetween(1, 3);
          const timeLimit = randomBetween(maximumTimer * 60000, (maximumTimer * 15) * 60000);
          eventMsg.push(`Dionysus has partied with ${generatePlayerName(updatedPlayer, true)} increasing ${generateGenderString(updatedPlayer, 'his')} multiplier by ${increaseMult} for ${Math.floor(timeLimit / 60000)} minutes!`);
          eventLog.push(`Dionysus partied with you increasing your multiplier by ${increaseMult} for ${Math.ceil(timeLimit / 60000)} minutes!`);
          updatedPlayer.personalMultiplier += increaseMult;
          setTimeout(() => {
            this.db.loadPlayer(updatedPlayer.discordId).then((loadedPlayer) => {
              loadedPlayer.personalMultiplier = Math.max(0, loadedPlayer.personalMultiplier - increaseMult);
              return loadedPlayer;
            }).then(loadedPlayer => this.db.savePlayer(loadedPlayer));
          }, timeLimit);
          break;
        }
        case 8: {
          const maxMana = enumHelper.maxMana(updatedPlayer.level);
          if (updatedPlayer.spells.length > 0 && updatedPlayer.mana < maxMana) {
            const manaRestored = maxMana - updatedPlayer.mana;
            updatedPlayer.mana = maxMana;
            eventMsg.push(`Apollo's light fills ${generatePlayerName(updatedPlayer, true)} with arcane energy, restoring ${manaRestored} mana!`);
            eventLog.push(`Apollo restored ${manaRestored} mana`);
          } else {
            const apolloExp = randomBetween(5, 10 + updatedPlayer.level);
            updatedPlayer.experience.current += apolloExp;
            updatedPlayer.experience.total += apolloExp;
            eventMsg.push(`Apollo whispered ancient knowledge to ${generatePlayerName(updatedPlayer, true)}, granting ${generateGenderString(updatedPlayer, 'him')} ${apolloExp} experience!`);
            eventLog.push(`Apollo granted you ${apolloExp} experience`);
            const checkedExp = await this.player.checkExperience(updatedPlayer, eventMsg, eventLog);
            return { type: 'actions', updatedPlayer: checkedExp.updatedPlayer, msg: checkedExp.msg, pm: checkedExp.pm };
          }
          break;
        }
        case 9: {
          const town = this.map.getRandomTown();
          const prevMap = updatedPlayer.map.name;
          updatedPlayer.map = town;
          eventMsg.push(`Poseidon's tides swept ${generatePlayerName(updatedPlayer, true)} away from \`${prevMap}\` to \`${town.name}\`!`);
          eventLog.push(`Poseidon swept you away to ${town.name}`);
          break;
        }
        case 10: {
          const item = await this.itemGen.generateItem(updatedPlayer, null);
          const generatedItemMsg = randomItemEventMessage(updatedPlayer, item);
          eventMsg.push(`Artemis rewarded ${generatePlayerName(updatedPlayer, true)} for ${generateGenderString(updatedPlayer, 'his')} bravery with a gift from the hunt!`);
          eventMsg.push(generatedItemMsg.eventMsg);
          eventLog.push(`Artemis gifted you: ${generatedItemMsg.eventLog}`);
          if (item.position !== enumHelper.inventory.position) {
            const oldItemRating = calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
            const newItemRating = calculateItemRating(updatedPlayer, item);
            if (oldItemRating > newItemRating) {
              this.inventory.addEquipmentIntoInventory(updatedPlayer, item);
            } else {
              this.player.setPlayerEquipment(updatedPlayer, item.position, item);
            }
          } else {
            this.inventory.addItemIntoInventory(updatedPlayer, item);
          }
          await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
          return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
        }
      }
      await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async itemEvent(playerObj) {
    let updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const item = await this.itemGen.generateItem(updatedPlayer);
      const generatedItemMsg = randomItemEventMessage(updatedPlayer, item);
      eventMsg.push(generatedItemMsg.eventMsg);
      eventLog.push(generatedItemMsg.eventLog);
      if (item.position !== enumHelper.inventory.position) {
        const oldItemRating = calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
        const newItemRating = calculateItemRating(updatedPlayer, item);
        if (oldItemRating > newItemRating) {
          updatedPlayer = this.inventory.addEquipmentIntoInventory(updatedPlayer, item);
        } else {
          updatedPlayer = this.player.setPlayerEquipment(updatedPlayer, item.position, item);
        }
      } else {
        updatedPlayer = this.inventory.addItemIntoInventory(updatedPlayer, item);
      }
      await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async gamblingEvent(playerObj) {
    const updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const luckGambleChance = randomBetween(0, 99);
      const luckGambleGold = Math.floor(2 * ((Math.log(updatedPlayer.gold.current) * updatedPlayer.gold.current) / 100));
      if (updatedPlayer.gold.current < luckGambleGold) return { updatedPlayer };
      updatedPlayer.gambles++;
      if (luckGambleChance <= 50 - (updatedPlayer.stats.luk / 4)) {
        const gambleMsg = randomGambleEventMessage(updatedPlayer, luckGambleGold, false);
        eventMsg.push(gambleMsg.eventMsg);
        eventLog.push(gambleMsg.eventLog);
        updatedPlayer.gold.current -= luckGambleGold;
        updatedPlayer.gold.gambles.lost += luckGambleGold;
        if (updatedPlayer.gold.current <= 0) updatedPlayer.gold.current = 0;
        await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
        return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
      }
      const gambleMsg = randomGambleEventMessage(updatedPlayer, luckGambleGold, true);
      eventMsg.push(gambleMsg.eventMsg);
      eventLog.push(gambleMsg.eventLog);
      updatedPlayer.gold.current += luckGambleGold;
      updatedPlayer.gold.total += luckGambleGold;
      updatedPlayer.gold.gambles.won += luckGambleGold;
      await this.player.logEvent(updatedPlayer, eventLog[0] || '', enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async questEvent(playerObj, mob, isCommand) {
    const updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    if (!updatedPlayer.quest.questMob.name.includes('None') && !isCommand) return { updatedPlayer };
    updatedPlayer.quest.questMob.name = mob;
    updatedPlayer.quest.questMob.count = randomBetween(1, 15);
    updatedPlayer.quest.questMob.killCount = 0;
    updatedPlayer.quest.updated_at = new Date();
    eventMsg.push(`[\`${updatedPlayer.map.name}\`] Quest Master has asked ${generatePlayerName(updatedPlayer, true)} to kill ${updatedPlayer.quest.questMob.count === 1 ? 'a' : updatedPlayer.quest.questMob.count} ${mob}!`);
    eventLog.push(`Quest Master in ${updatedPlayer.map.name} asked you to kill ${updatedPlayer.quest.questMob.count === 1 ? 'a' : updatedPlayer.quest.questMob.count} ${mob}.`);
    await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
    return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
  }

  async goldEvent(playerObj, multiplier) {
    const updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const luckGoldDice = randomBetween(5, 100);
      const goldAmount = Math.max(1, Math.round((luckGoldDice * updatedPlayer.stats.luk) / 2) * multiplier);
      updatedPlayer.gold.current += goldAmount;
      updatedPlayer.gold.total += goldAmount;
      eventMsg.push(`[\`${updatedPlayer.map.name}\`] ${generatePlayerName(updatedPlayer, true)} found ${goldAmount} gold!`);
      eventLog.push(`Found ${goldAmount} gold in ${updatedPlayer.map.name}`);
      await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async catchSnowFlake(playerObj, snowFlake) {
    let updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const snowFlakeDice = randomBetween(0, 99);
      if (snowFlakeDice <= 5) {
        const oldItemRating = calculateItemRating(updatedPlayer, updatedPlayer.equipment.relic);
        const newItemRating = calculateItemRating(updatedPlayer, snowFlake);
        if (oldItemRating < newItemRating) {
          eventMsg.push(`<@!${updatedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`);
          eventLog.push('You caught a strange looking snowflake while travelling inside the blizzard.');
          updatedPlayer = this.player.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
          return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
        }
      }
      return { updatedPlayer };
    } catch (err) {
      errorLog.error(err);
    }
  }

}

module.exports = LuckEvent;
