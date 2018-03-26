const Helper = require('../../utils/Helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Inventory = require('../utils/Inventory');
const Spell = require('../utils/Spell');
const Map = require('../utils/Map');
const Database = require('../../database/Database');
const events = require('../data/events');
const { errorLog, infoLog } = require('../../utils/logger');

class Event {

  constructor() {
    // Managers
    this.MonsterManager = new Monster();
    this.ItemManager = new Item();
    this.MapManager = new Map();
    this.SpellManager = new Spell();
    this.InventoryManager = new Inventory();

    // Events
    this.isBlizzardActive = false;
  }

  regenItem(selectedPlayer) {
    const regeneratedHelmet = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.helmet, 'helmet');
    selectedPlayer.equipment.helmet = regeneratedHelmet;

    const regeneratedArmor = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.armor, 'armor');
    selectedPlayer.equipment.armor = regeneratedArmor;

    const regeneratedWeapon = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.weapon, 'weapon');
    selectedPlayer.equipment.weapon = regeneratedWeapon;
    return selectedPlayer;
  }

  // Move Events
  moveEvent(selectedPlayer, discordHook) {
    const mapObj = this.MapManager.moveToRandomMap(selectedPlayer);
    return events.movement.movePlayer(discordHook, selectedPlayer, mapObj);
  }

  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers, multiplier) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then(mappedPlayers => events.battle.pvpPreperation(selectedPlayer, mappedPlayers, onlinePlayers))
      /**
       * If found an online randomplayer in current map
       * Returns {
       *  randomPlayer
       * }
       * Else
       * Returns an empty object
       */

      .then((prepResults) => {
        return prepResults.randomPlayer
          ? Battle.newSimulateBattle(selectedPlayer, prepResults.randomPlayer)
          : this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
            .catch(err => errorLog.error(err));
      })
      /**
       * If PvP battle was executed (Found an online randomplayer in current map)
       * Returns {
       *  attacker,
       *  defender,
       *  attackerDamage,
       *  defenderDamage
       * }
       * Else
       * Returns selectedPlayer from this.attackEventMob method
       */

      .then((battleResults) => {
        return battleResults.attacker
          ? events.battle.pvpResults(discordHook, battleResults)
          : battleResults;
      })
      /**
       * If PvP battle was executed (Found an online randomplayer in current map)
       * Returns {
       *  result,
       *  updatedAttacker,
       *  updatedDefender
       * }
       * Else
       * Returns selectedPlayer from this.attackEventMob method
       */

      .then((battleResults) => {
        if (battleResults.result) {
          switch (battleResults.result) {
            case enumHelper.battle.outcomes.win:
              return this.stealPlayerItem(discordHook, twitchBot, battleResults.updatedAttacker, battleResults.updatedDefender)
                .then(stealResult => Helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook)
                  .then((updatedVictim) => {
                    Database.savePlayer(updatedVictim);
                    return Helper.checkExperience(stealResult.stealingPlayer, discordHook, twitchBot);
                  }));

            case enumHelper.battle.outcomes.fled:
              return Helper.checkExperience(battleResults.updatedDefender, discordHook, twitchBot)
                .then((updatedDefender) => {
                  Database.savePlayer(updatedDefender);
                  return Helper.checkExperience(battleResults.updatedAttacker, discordHook, twitchBot);
                });

            case enumHelper.battle.outcomes.lost:
              return this.stealPlayerItem(discordHook, twitchBot, battleResults.updatedDefender, battleResults.updatedAttacker)
                .then(stealResult => Helper.checkExperience(stealResult.stealingPlayer, discordHook, twitchBot)
                  .then((updatedDefender) => {
                    Database.savePlayer(updatedDefender);
                    return Helper.checkHealth(this.MapClass, stealResult.victimPlayer, updatedDefender, discordHook);
                  }));
          }
        }

        return battleResults;
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    selectedPlayer.map = this.MapClass.getMapByName(selectedPlayer.map.name);
    return this.MonsterManager.generateNewMonster(selectedPlayer)
      .then(mob => Battle.newSimulateBattle(selectedPlayer, mob))
      .then(results => events.battle.pveResults(discordHook, this.MapClass, results, multiplier))
      .then((battleResults) => {
        switch (battleResults.result) {
          case enumHelper.battle.outcomes.win:
            return this.generateDropItemEvent(discordHook, 'twitch', battleResults.updatedPlayer, battleResults.updatedMob)
              .then(updatedPlayer => Helper.checkExperience(updatedPlayer, discordHook, twitchBot));

          case enumHelper.battle.outcomes.fled:
            return Helper.checkExperience(battleResults.updatedPlayer, discordHook, twitchBot);

          case enumHelper.battle.outcomes.lost:
            return Helper.checkHealth(this.MapClass, battleResults.updatedPlayer, battleResults.updatedMob, discordHook);
        }
      });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = Helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 4)) {
        return this.ItemManager.generateItem(selectedPlayer, mob)
          .then((item) => {
            events.utils.dropItem(this.InventoryManager, selectedPlayer, item);

            let eventMsg;
            if (!item.isXmasEvent) {
              eventMsg = `${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\``;
            } else {
              eventMsg = `**${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob.name}`;

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

            return resolve(selectedPlayer);
          });
      }

      return resolve(selectedPlayer);
    });
  }

  // Item Events
  generateTownItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      return this.ItemManager.generateItem(selectedPlayer)
        .then((item) => {
          const itemCost = Math.round(item.gold);

          if (selectedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
            return resolve(selectedPlayer);
          }

          if (item.position !== enumHelper.inventory.position) {
            selectedPlayer.equipment[item.position].position = enumHelper.equipment.types[item.position].position;
            const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
            const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
            if (oldItemRating > newItemRating) {
              return resolve(selectedPlayer);
            }
          }

          events.utils.townItem(this.InventoryManager, discordHook, selectedPlayer, item, itemCost);

          return resolve(selectedPlayer);
        });
    });
  }

  sellInTown(discordHook, twitchBot, selectedPlayer) {
    if (selectedPlayer.inventory.equipment.length > 0) {
      let profit = 0;
      Helper.printEventDebug(selectedPlayer.inventory.equipment);
      selectedPlayer.inventory.equipment.forEach((equipment) => {
        Helper.printEventDebug(`Equipment selling: ${equipment.name}`);
        profit += Number(equipment.gold);
      });
      if (isNaN(profit)) {
        infoLog.info(selectedPlayer.inventory.equipment);
        profit = 100;
      }
      selectedPlayer.inventory.equipment.length = 0;
      profit = Math.floor(profit);
      selectedPlayer.gold.current += profit;
      selectedPlayer.gold.total += profit;

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just sold what they found adventuring for ${profit} gold!`;
      const eventLog = `Made ${profit} gold selling what you found adventuring`;

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
    }

    return selectedPlayer;
  }

  campEvent(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      selectedPlayer = Helper.passiveRegen(selectedPlayer, ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.end / 2), ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.int / 2));
      // TODO: Make more camp event messages to be selected randomly
      const { eventMsg, eventLog } = events.messages.randomCampEventMessage(selectedPlayer);
      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return resolve(selectedPlayer);
    });
  }

  stealPlayerItem(discordHook, twitchBot, stealingPlayer, victimPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      console.log(`>>>>>>>>>>>>>>>>>>>> CHANCE : ${chance} - LUCKSTEALCHANCE : ${luckStealChance} - BOUNTYLUCK : ${90 - canSteal}`);
      if (luckStealChance > (90 - canSteal)) {
        const luckItem = Helper.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (!['Nothing', 'Fist'].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          events.utils.stealEquip(this.InventoryManager, discordHook, stealingPlayer, victimPlayer, itemKeys[luckItem]);
        }
      } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
        const goldStolen = Math.round(victimPlayer.gold.current / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold.current += goldStolen;
          stealingPlayer.gold.total += goldStolen;
          stealingPlayer.gold.stole += goldStolen;

          victimPlayer.gold.current -= goldStolen;
          victimPlayer.gold.stolen += goldStolen;

          const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
          const eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;
          const otherPlayerLog = `${stealingPlayer.name} stole ${goldStolen} gold from you`;

          Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg)
            .then(() => Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true))
            .then(() => Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true));
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
        }
      }

      return resolve({ stealingPlayer, victimPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    const luckEvent = Helper.randomBetween(1, 6);
    switch (luckEvent) {
      case 1:
        return events.luck.gods.hades(discordHook, selectedPlayer);

      case 2:
        return events.luck.gods.zeus(discordHook, selectedPlayer)
          .then(updatedPlayer => Helper.checkHealth(this.MapClass, updatedPlayer, discordHook));

      case 3:
        return events.luck.gods.aseco(discordHook, selectedPlayer);

      case 4:
        return events.luck.gods.hermes(discordHook, selectedPlayer);

      case 5:
        return events.luck.gods.athena(discordHook, selectedPlayer);

      case 6:
        return this.SpellManager.generateSpell(selectedPlayer)
          .then(spell => events.gods.eris(discordHook, selectedPlayer, spell));
    }
  }

  generateGoldEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      const luckGoldChance = Helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = Helper.randomBetween(5, 100);
        const goldAmount = Math.round((luckGoldDice * selectedPlayer.stats.luk) / 2) * multiplier;
        selectedPlayer.gold.current += goldAmount;
        selectedPlayer.gold.total += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;

        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
          .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = Helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 4)) {
        return this.SpellManager.generateSpell(selectedPlayer)
          .then((spell) => {
            const { eventMsg, eventLog } = events.messages.randomItemEventMessage(selectedPlayer, spell);
            if (selectedPlayer.spells.length > 0) {
              let shouldAddToList = false;
              let tempArray;
              selectedPlayer.spells.forEach((ownedSpell, index) => {
                const spellName = ownedSpell.name.split(/ (.+)/)[1];
                if (spell.power > ownedSpell.power) {
                  if (spell.name.includes(spellName)) {
                    tempArray = selectedPlayer.spells.splice(index, 1);
                    shouldAddToList = true;
                  } else {
                    shouldAddToList = true;
                  }
                }
              });

              if (shouldAddToList) {
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                if (tempArray) {
                  selectedPlayer.spells = tempArray;
                }
                selectedPlayer.spells.push(spell);
              }
            } else {
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
              selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
              selectedPlayer.spells.push(spell);
            }

            return resolve(selectedPlayer);
          });
      } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 4)) {
        return this.ItemManager.generateItem(selectedPlayer)
          .then((item) => {
            if (item.position !== enumHelper.inventory.position) {
              const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
              const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
              if (oldItemRating > newItemRating) {
                selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
              } else {
                selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, item.position, item);
              }
            } else {
              selectedPlayer = this.InventoryManager.addItemIntoInventory(selectedPlayer, item);
            }

            const { eventMsg, eventLog } = events.messages.randomItemEventMessage(selectedPlayer, item);
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

            return resolve(selectedPlayer);
          });
      }
    });
  }

  generateGamblingEvent(discordHook, selectedPlayer) {
    return events.luck.gambling(discordHook, selectedPlayer);
  }

  /**
   * EVENT FUNCTIONS
   */
  blizzardSwitch(discordHook, blizzardSwitch) {
    switch (blizzardSwitch) {
      case 'on':
        if (this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = true;
        Helper.sendMessage(discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
        return this.isBlizzardActive;
      case 'off':
        if (!this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = false;
        Helper.sendMessage(discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'It seems that blizzard has ended, you can safely travel to other realms. Do not walk away from the road as evil creatures may wait for you in dark forests!\'\`\`\`');
        return this.isBlizzardActive;
    }
  }

  chanceToCatchSnowflake(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      const snowFlakeDice = Helper.randomBetween(0, 100);
      if (snowFlakeDice <= 15) {
        const snowFlake = this.ItemManager.generateSnowflake(selectedPlayer);
        if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.relic) < Helper.calculateItemRating(selectedPlayer, snowFlake)) {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';

          Helper.sendMessage(discordHook, 'twitch', false, eventMsgSnowflake)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogSnowflake, true))
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogSnowflake, 'pastEvents');
        }
      }

      return resolve(selectedPlayer);
    });
  }

  /**
   * GETTER SETTERS
   */
  get MonsterClass() {
    return this.MonsterManager;
  }

  get ItemClass() {
    return this.ItemManager;
  }

  get MapClass() {
    return this.MapManager;
  }

  get SpellClass() {
    return this.SpellManager;
  }

}
module.exports = new Event();