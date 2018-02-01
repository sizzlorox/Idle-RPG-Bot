const helper = require('../../utils/helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Inventory = require('../utils/Inventory');
const Spell = require('../utils/Spell');
const Map = require('../utils/Map');
const Database = require('../../database/Database');
const { pvpLevelRestriction } = require('../../../settings');

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
    return new Promise((resolve) => {
      selectedPlayer.map = this.MapManager.moveToRandomMap(selectedPlayer);
      const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just arrived in \`${selectedPlayer.map.name}\`.`;
      const eventLog = `Arrived in ${selectedPlayer.map.name}`;
      helper.sendMessage(discordHook, 'twitch', true, eventMsg);
      selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

      return resolve(selectedPlayer);
    });
  }

  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers, multiplier) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then((mappedPlayers) => {
        if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
          const sameMapPlayers = mappedPlayers.filter(player => player.name !== selectedPlayer.name
            && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
            && player.level <= selectedPlayer.level + pvpLevelRestriction && player.level >= selectedPlayer.level - pvpLevelRestriction);

          if (sameMapPlayers.length > 0) {
            const randomPlayerIndex = helper.randomBetween(0, sameMapPlayers.length - 1);
            let randomPlayer = sameMapPlayers[randomPlayerIndex];

            if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name && randomPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
              const randomPlayerMaxHealth = 100 + (selectedPlayer.level * 5);
              const playerMaxHealth = 100 + (selectedPlayer.level * 5);
              return Battle.newSimulateBattle(
                selectedPlayer,
                randomPlayer
              ).then(({
                attacker, defender, attackerDamage, defenderDamage
              }) => {
                selectedPlayer = attacker;
                randomPlayer = defender;
                const battleResult = `Battle Results:
                  ${helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                  ${helper.generatePlayerName(selectedPlayer)} has ${selectedPlayer.health} HP left.
                  ${helper.generatePlayerName(randomPlayer)} 's \`${randomPlayer.equipment.weapon.name}\` did ${defenderDamage} damage.
                  ${helper.generatePlayerName(randomPlayer)} has ${randomPlayer.health} HP left.`;

                helper.printEventDebug(battleResult);

                if (selectedPlayer.health <= 0) {
                  const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(randomPlayer)} just killed ${helper.generatePlayerName(selectedPlayer)} with ${helper.generateGenderString(randomPlayer, 'his')} \`${randomPlayer.equipment.weapon.name}\`!
    ${helper.generatePlayerName(selectedPlayer)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;

                  const eventLog = `Died to ${defender.name} in ${selectedPlayer.map.name}.`;
                  const otherPlayerLog = `Killed ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                  helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                  selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
                  randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

                  return this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer)
                    .then((stealResult) => {
                      helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                      return Database.savePlayer(stealResult.stealingPlayer)
                        .then(() => {
                          return stealResult.victimPlayer;
                        });
                    })
                    .catch(err => helper.printEventDebug(err));
                }

                if (defender.health > 0 && selectedPlayer.health > 0) {
                  const eventMsg = attackerDamage > defenderDamage
                    ? `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} attacked ${helper.generatePlayerName(randomPlayer)} with ${helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${helper.generateGenderString(randomPlayer, 'he')} managed to get away!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`
                    : `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} attacked ${helper.generatePlayerName(randomPlayer)} with ${helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${helper.generatePlayerName(randomPlayer)} was too strong!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                  // TODO: Find a way of making this visible some other method
                  // eventMsg = eventMsg.concat(battleResult);
                  const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and dealt ${attackerDamage} damage!`;
                  const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and received ${attackerDamage} damage!`;

                  helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                  selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
                  randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

                  return resolve(selectedPlayer);
                }

                const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} just killed \`${randomPlayer.name}\` with ${helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\`!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                const eventLog = `Killed ${randomPlayer.name} in ${selectedPlayer.map.name}.`;
                const otherPlayerLog = `Died to ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
                randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

                return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer)
                  .then((stealResult) => {
                    helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                    return Database.savePlayer(stealResult.victimPlayer)
                      .then(() => {
                        return stealResult.stealingPlayer;
                      });
                  })
                  .catch(err => helper.printEventDebug(err));
              });
            }
          }
        }

        return this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
          .catch(err => helper.printEventDebug(err));
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      selectedPlayer.map = this.MapClass.getMapByName(selectedPlayer.map.name);
      return this.MonsterManager.generateNewMonster(selectedPlayer)
        .then((mob) => {
          const mobMaxHealth = mob.health;
          const playerMaxHealth = 100 + (selectedPlayer.level * 5);
          return Battle.newSimulateBattle(selectedPlayer, mob)
            .then(({
              attacker, defender, attackerDamage, defenderDamage
            }) => {
              selectedPlayer = attacker;
              const battleResult = `Battle Results:
                ${helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                ${helper.generatePlayerName(selectedPlayer)} has ${selectedPlayer.health} / ${playerMaxHealth} HP left.
                ${defender.name}'s \`${defender.equipment.weapon.name}\` did ${defenderDamage} damage.
                ${defender.name} has ${defender.health} / ${mobMaxHealth} HP left.`;

              helper.printEventDebug(battleResult);

              if (selectedPlayer.health <= 0) {
                const eventMsg = `[\`${selectedPlayer.map.name}\`] \`${defender.name}\`'s \`${defender.equipment.weapon.name}\` just killed ${helper.generatePlayerName(selectedPlayer)}!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [\`${defender.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = `\`${defender.name}\`'s \`${defender.equipment.weapon.name}\` just killed you in \`${selectedPlayer.map.name}\`!`;
                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
                helper.checkHealth(this.MapClass, selectedPlayer, mob, discordHook);

                return resolve(selectedPlayer);
              }

              if (defender.health > 0 && selectedPlayer.health > 0) {
                const expGain = Math.floor((defender.experience * multiplier) / 2);
                const eventMsg = attackerDamage > defenderDamage
                  ? `[\`${selectedPlayer.map.name}\`] \`${defender.name}\` just fled from ${helper.generatePlayerName(selectedPlayer)}!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${defender.name}\` HP:${defender.health}/${mobMaxHealth}]`
                  : `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} just fled from \`${defender.name}\`!
    ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${defender.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = attackerDamage > defenderDamage
                  ? `\`${defender.name}\` fled from you in \`${selectedPlayer.map.name}\`!`
                  : `You fled from \`${defender.name}\` in \`${selectedPlayer.map.name}\`!`;

                selectedPlayer.experience += expGain;
                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
                helper.checkExperience(selectedPlayer, discordHook);

                return resolve(selectedPlayer);
              }

              const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` just killed \`${defender.name}\`!
      ${helper.capitalizeFirstLetter(helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained \`${defender.experience * multiplier}\` exp and \`${defender.gold * multiplier}\` gold! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${defender.name}\` HP:${defender.health}/${mobMaxHealth}]`;
              const eventLog = `Killed ${defender.name} with your ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map.name}.`;

              selectedPlayer.experience += defender.experience * multiplier;
              selectedPlayer.gold += defender.gold * multiplier;
              selectedPlayer.kills.mob++;
              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              helper.checkExperience(selectedPlayer, discordHook);

              return resolve(selectedPlayer);
            });
        });
    });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 2)) {
        return this.ItemManager.generateItem(selectedPlayer, mob)
          .then((item) => {
            switch (item.position) {
              case enumHelper.equipment.types.helmet.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.helmet) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
                }
                break;
              case enumHelper.equipment.types.armor.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.armor) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
                }
                break;
              case enumHelper.equipment.types.weapon.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.weapon) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
                }
                break;
              case enumHelper.equipment.types.relic.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.relic) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, item);
                }
                break;
            }

            let eventMsg;
            if (!item.isXmasEvent) {
              eventMsg = `${helper.generatePlayerName(selectedPlayer)} received \`${item.name}\` from \`${mob.name}!\``;
            } else {
              eventMsg = `**${helper.generatePlayerName(selectedPlayer)} received \`${item.name}\` from \`${mob.name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob.name}`;

            helper.sendMessage(discordHook, 'twitch', false, eventMsg);
            selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

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

          if (selectedPlayer.gold <= itemCost || item.name.startsWith('Cracked')) {
            return resolve(selectedPlayer);
          }

          switch (item.position) {
            case enumHelper.equipment.types.helmet.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.helmet) >= item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= itemCost;
              selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
              break;

            case enumHelper.equipment.types.armor.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.armor) >= item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= itemCost;
              selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
              break;

            case enumHelper.equipment.types.weapon.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.weapon) >= item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= itemCost;
              selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
              break;
          }

          const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} just purchased \`${item.name}\` for ${itemCost} gold!`;
          const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsg);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

          return resolve(selectedPlayer);
        });
    });
  }

  sellInTown(discordHook, twitchBot, selectedPlayer) {
    if (selectedPlayer.inventory.equipment.length > 0) {
      let profit = 0;
      helper.printEventDebug(selectedPlayer.inventory.equipment);
      selectedPlayer.inventory.equipment.forEach((equipment) => {
        helper.printEventDebug(`Equipment selling: ${equipment.name}`);
        selectedPlayer.gold += Number(equipment.gold);
        profit += Number(equipment.gold);
      });
      selectedPlayer.inventory.equipment.length = 0;

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} just sold what they found adventuring for ${profit} gold!`;
      const eventLog = `Made ${profit} gold selling what you found adventuring`;

      helper.sendMessage(discordHook, 'twitch', false, `**${eventMsg}**`);
      selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
    }

    return selectedPlayer;
  }

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventMessage = helper.randomBetween(0, 9);
    switch (randomEventMessage) {
      case 0:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} found a chest containing \`${item.name}\`!`,
          eventLog: `Found a chest containing ${item.name} in ${selectedPlayer.map.name}`
        };
      case 1:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} found \`${item.name}\` on the ground!`,
          eventLog: `Found ${item.name} on the ground in ${selectedPlayer.map.name}`
        };
      case 2:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} explored an abandoned hut which had \`${item.name}\` inside!`,
          eventLog: `Explored an abandoned hut in ${selectedPlayer.map.name} which had ${item.name} inside`
        };
      case 3:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} a bird just dropped \`${item.name}\` infront of ${helper.generateGenderString(selectedPlayer, 'him')}!`,
          eventLog: `A bird just dropped ${item.name} infront of you in ${selectedPlayer.map.name}`
        };
      case 4:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} stumbles upon a grizzly scene. One of the corpses has \`${item.name}\` next to it! Seems like it is in good enough condition to use.`,
          eventLog: `You found ${item.name} on a corpse in ${selectedPlayer.map.name}`
        };
      case 5:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} found an alter. \`${item.name}\` is sitting on the center, ready to be used!`,
          eventLog: `On an alter in ${selectedPlayer.map.name} you found ${item.name}`
        };
      case 6:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} catches a glint out of the corner of ${helper.generateGenderString(selectedPlayer, 'his')} eye. Brushing aside some leaves ${helper.generatePlayerName(selectedPlayer)} finds \`${item.name}\` left here by the last person to camp at this spot.`,
          eventLog: `Near your camp in ${selectedPlayer.map.name} there was ${item.name}`
        };
      case 7:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} notices something reflecting inside a nearby cave. Exploring it further ${helper.generateGenderString(selectedPlayer, 'he')} find \`${item.name}\` resting against a wall.`,
          eventLog: `While exploring a cave in ${selectedPlayer.map.name} you found ${item.name}`
        };
      case 8:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} finds a grave with \`${item.name}\` sitting on it. The dead do not need equipment so it's yours for the taking`,
          eventLog: `You stole ${item.name} from a grave in ${selectedPlayer.map.name}`
        };
      case 9:
        return {
          eventMsg: `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} looks around a derlict building and finds \`${item.name}\` in one of the corners.`,
          eventLog: `Found ${item.name} while looking around a derlict building in ${selectedPlayer.map.name}`
        };
    }
  }

  stealPlayerItem(discordHook, twitchBot, stealingPlayer, victimPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);

      if (luckStealChance > 90 - !Number.isFinite(chance) ? 0 : chance) {
        const luckItem = helper.randomBetween(0, 2);
        switch (luckItem) {
          case 0:
            let stolenHelmet;
            if (victimPlayer.equipment.helmet.previousOwners.length > 0) {
              const lastOwnerInList = victimPlayer.equipment.helmet.previousOwners[victimPlayer.equipment.helmet.previousOwners.length - 1];
              const removePreviousOwnerName = victimPlayer.equipment.helmet.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
              stolenHelmet = victimPlayer.equipment.helmet;
              stolenHelmet.name = removePreviousOwnerName;

              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.equipment.helmet.name}!`);
              const eventLog = `Stole ${victimPlayer.equipment.helmet.name}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.helmet.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            } else {
              stolenHelmet = victimPlayer.equipment.helmet;
              stolenHelmet.name = `${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}`;
              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}!`);
              const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.helmet.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            }
            stealingPlayer = helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types.helmet.position, stolenHelmet);

            if (!victimPlayer.equipment.helmet.previousOwners) {
              stealingPlayer.equipment.helmet.previousOwners = [`${victimPlayer.name}`];
            } else {
              stealingPlayer.equipment.helmet.previousOwners = victimPlayer.equipment.helmet.previousOwners;
              stealingPlayer.equipment.helmet.previousOwners.push(victimPlayer.name);
            }
            victimPlayer.stolen++;
            stealingPlayer.stole++;

            if (helper.calculateItemRating(stealingPlayer.equipment.helmet) < helper.calculateItemRating(victimPlayer.equipment.helmet)) {
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.helmet.position, enumHelper.equipment.empty.helmet);
            } else {
              stealingPlayer = this.InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenHelmet);
            }
            break;
          case 1:
            let stolenArmor;
            if (victimPlayer.equipment.armor.previousOwners.length > 0) {
              const lastOwnerInList = victimPlayer.equipment.armor.previousOwners[victimPlayer.equipment.armor.previousOwners.length - 1];
              const removePreviousOwnerName = victimPlayer.equipment.armor.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
              stolenArmor = victimPlayer.equipment.armor;
              stolenArmor.name = removePreviousOwnerName;

              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.equipment.armor.name}!`);
              const eventLog = `Stole ${victimPlayer.equipment.armor.name}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.armor.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            } else {
              stolenArmor = victimPlayer.equipment.armor;
              stolenArmor.name = `${victimPlayer.name}s ${victimPlayer.equipment.armor.name}`;
              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.armor.name}!`);
              const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.armor.name}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.armor.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            }
            stealingPlayer = helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types.armor.position, stolenArmor);

            if (!victimPlayer.equipment.armor.previousOwners) {
              stealingPlayer.equipment.armor.previousOwners = [`${victimPlayer.name}`];
            } else {
              stealingPlayer.equipment.armor.previousOwners = victimPlayer.equipment.armor.previousOwners;
              stealingPlayer.equipment.armor.previousOwners.push(victimPlayer.name);
            }
            victimPlayer.stolen++;
            stealingPlayer.stole++;

            if (helper.calculateItemRating(stealingPlayer.equipment.armor) < helper.calculateItemRating(victimPlayer.equipment.armor)) {
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.armor.position, enumHelper.equipment.empty.armor);
            } else {
              stealingPlayer = this.InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenArmor);
            }
            break;
          case 2:
            let stolenWeapon;
            if (victimPlayer.equipment.weapon.previousOwners.length > 0) {
              const lastOwnerInList = victimPlayer.equipment.weapon.previousOwners[victimPlayer.equipment.weapon.previousOwners.length - 1];
              const removePreviousOwnerName = victimPlayer.equipment.weapon.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
              stolenWeapon = victimPlayer.equipment.armor;
              stolenWeapon.name = removePreviousOwnerName;

              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenWeapon}!`);
              const eventLog = `Stole ${stolenWeapon}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.weapon.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            } else {
              stolenWeapon = victimPlayer.equipment.armor;
              stolenWeapon.name = `${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}`;
              const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}!`);
              const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}`;
              const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.weapon.name} from you`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
              victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
            }
            stealingPlayer = helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types.weapon.position, stolenWeapon);

            if (!victimPlayer.equipment.weapon.previousOwners) {
              stealingPlayer.equipment.weapon.previousOwners = [`${victimPlayer.name}`];
            } else {
              stealingPlayer.equipment.weapon.previousOwners = victimPlayer.equipment.weapon.previousOwners;
              stealingPlayer.equipment.weapon.previousOwners.push(victimPlayer.name);
            }
            victimPlayer.stolen++;
            stealingPlayer.stole++;

            if (helper.calculateItemRating(stealingPlayer.equipment.weapon) < helper.calculateItemRating(victimPlayer.equipment.weapon)) {
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.weapon.position, enumHelper.equipment.empty.weapon);
            } else {
              stealingPlayer = this.InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenWeapon);
            }
            break;
        }
      } else if (victimPlayer.gold > 0) {
        const goldStolen = Math.round(victimPlayer.gold / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold += goldStolen;
          victimPlayer.gold -= goldStolen;

          const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
          const eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsg);
          stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
        }
      }

      return resolve({ stealingPlayer, victimPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = helper.randomBetween(1, 6);
      switch (luckEvent) {
        case 1:
          const luckExpAmount = helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          const eventMsgHades = `Hades unleashed his wrath upon ${helper.generatePlayerName(selectedPlayer)} making ${helper.generateGenderString(selectedPlayer, 'him')} lose ${luckExpAmount} experience!`;
          const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgHades);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogHades);

          return resolve(selectedPlayer);

        case 2:
          const luckHealthAmount = helper.randomBetween(5, 50 + (selectedPlayer.level * 2));
          selectedPlayer.health -= luckHealthAmount;
          helper.checkHealth(this.MapClass, selectedPlayer, discordHook);

          const eventMsgZeus = `${helper.generatePlayerName(selectedPlayer)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
          const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgZeus);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogZeus);

          return resolve(selectedPlayer);

        case 3:
          const healthDeficit = (100 + (selectedPlayer.level * 5)) - selectedPlayer.health;

          if (healthDeficit) {
            const healAmount = Math.round(healthDeficit / 3);

            const eventMsgAseco = `Fortune smiles upon ${helper.generatePlayerName(selectedPlayer)} as Aseco cured his sickness and restored ${helper.generateGenderString(selectedPlayer, 'him')} ${healAmount} health!`;
            const eventLogAseco = `Aseco healed you for ${healAmount}`;

            selectedPlayer.health += healAmount;

            helper.sendMessage(discordHook, 'twitch', false, eventMsgAseco);
            selectedPlayer = helper.logEvent(selectedPlayer, eventLogAseco);

            return resolve(selectedPlayer);
          }

          const eventMsgAsecoFull = `Aseco gave ${helper.generatePlayerName(selectedPlayer)} an elixir of life but it caused no effect on ${helper.generateGenderString(selectedPlayer, 'him')}. Actually it tasted like wine!`;
          const eventLogAsecoFull = 'Aseco wanted to heal you, but you had full health';

          helper.sendMessage(discordHook, 'twitch', false, eventMsgAsecoFull);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogAsecoFull);

          return resolve(selectedPlayer);

        case 4:
          if (selectedPlayer.gold < 20) {
            const eventMsgHermesFail = `Hermes demanded some gold from ${helper.generatePlayerName(selectedPlayer)} but as ${helper.generateGenderString(selectedPlayer, 'he')} had no money, Hermes left him alone.`;
            const eventLogHermesFail = 'Hermes demanded gold from you but you had nothing to give';

            helper.sendMessage(discordHook, 'twitch', false, eventMsgHermesFail);
            selectedPlayer = helper.logEvent(selectedPlayer, eventLogHermesFail);

            return resolve(selectedPlayer);
          }

          const goldTaken = Math.round(selectedPlayer.gold / 20);

          const eventMsgHermes = `Hermes took ${goldTaken} gold from ${helper.generatePlayerName(selectedPlayer)} by force. Probably he is just out of humor.`
          const eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

          selectedPlayer.gold -= goldTaken;
          if (selectedPlayer.gold < 0) {
            selectedPlayer.gold = 0;
          }

          helper.sendMessage(discordHook, 'twitch', false, eventMsgHermes);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogHermes);

          return resolve(selectedPlayer);

        case 5:
          const luckExpAthena = helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
          selectedPlayer.experience += luckExpAthena;
          helper.checkExperience(selectedPlayer, discordHook)

          const eventMsgAthene = `Athene shared her wisdom with ${helper.generatePlayerName(selectedPlayer)} making ${helper.generateGenderString(selectedPlayer, 'him')} gain ${luckExpAthena} experience!`;
          const eventLogAthene = `Athene shared her wisdom with you making you gain ${luckExpAthena} experience`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgAthene);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogAthene);

          return resolve(selectedPlayer);

        case 6:
          return this.SpellManager.generateSpell(selectedPlayer)
            .then((spell) => {
              const eventMsgEris = `Eris has given ${helper.generatePlayerName(selectedPlayer)} a scroll containing \`${spell.name}\` to add to ${helper.generateGenderString(selectedPlayer, 'his')} spellbook!`;
              const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
              if (selectedPlayer.spells.length > 0) {
                let shouldAddToList = false;
                let tempArray;
                selectedPlayer.spells.forEach((ownedSpell, index) => {
                  const spellName = ownedSpell.name.split(/ (.+)/)[1];
                  if (spell.power > ownedSpell.power) {
                    if (spell.name.includes(spellName)) {
                      tempArray = selectedPlayer.spells.splice(index, 1, spell);
                      shouldAddToList = true;
                    } else {
                      shouldAddToList = true;
                    }
                  }
                });

                if (shouldAddToList) {
                  helper.sendMessage(discordHook, 'twitch', false, `${eventMsgEris}`);
                  selectedPlayer = helper.logEvent(selectedPlayer, eventLogEris);
                  if (tempArray) {
                    selectedPlayer.spells = tempArray;
                  }
                  selectedPlayer.spells.push(spell);
                }
              } else {
                helper.sendMessage(discordHook, 'twitch', false, `${eventMsgEris}`);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLogEris);
                selectedPlayer.spells.push(spell);
              }

              return resolve(selectedPlayer);
            });
      }
    });
  }

  generateGoldEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      const luckGoldChance = helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = helper.randomBetween(5, 100);
        const goldAmount = Math.round((luckGoldDice * selectedPlayer.stats.luk) / 2) * multiplier;
        selectedPlayer.gold += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;

        helper.sendMessage(discordHook, 'twitch', false, eventMsg);
        selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
        return this.SpellManager.generateSpell(selectedPlayer)
          .then((spell) => {
            const spellEventResult = this.generateItemEventMessage(selectedPlayer, spell);
            if (selectedPlayer.spells.length > 0) {
              let shouldAddToList = false;
              let tempArray;
              selectedPlayer.spells.forEach((ownedSpell, index) => {
                const spellName = ownedSpell.name.split(/ (.+)/)[1];
                if (spell.power > ownedSpell.power) {
                  if (spell.name.includes(spellName)) {
                    tempArray = selectedPlayer.spells.splice(index, 1, spell);
                    shouldAddToList = true;
                  } else {
                    shouldAddToList = true;
                  }
                }
              });

              if (shouldAddToList) {
                helper.sendMessage(discordHook, 'twitch', false, `${spellEventResult.eventMsg}`);
                selectedPlayer = helper.logEvent(selectedPlayer, spellEventResult.eventLog);
                if (tempArray) {
                  selectedPlayer.spells = tempArray;
                }
                selectedPlayer.spells.push(spell);
              }
            } else {
              helper.sendMessage(discordHook, 'twitch', false, `${spellEventResult.eventMsg}`);
              selectedPlayer = helper.logEvent(selectedPlayer, spellEventResult.eventLog);
              selectedPlayer.spells.push(spell);
            }

            return resolve(selectedPlayer);
          });
      } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 2)) {
        return this.ItemManager.generateItem(selectedPlayer)
          .then((item) => {
            switch (item.position) {
              case enumHelper.equipment.types.helmet.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.helmet) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
                }
                break;

              case enumHelper.equipment.types.armor.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.armor) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
                }
                break;

              case enumHelper.equipment.types.weapon.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.weapon) >= item.rating) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
                }
                break;

              case enumHelper.inventory.position:
                selectedPlayer = this.InventoryManager.addItemIntoInventory(selectedPlayer, item);
                break;
            }

            const itemEventResult = this.generateItemEventMessage(selectedPlayer, item);
            helper.sendMessage(discordHook, 'twitch', false, itemEventResult.eventMsg);
            selectedPlayer = helper.logEvent(selectedPlayer, itemEventResult.eventLog);

            return resolve(selectedPlayer);
          });
      }
    });
  }

  generateGamblingEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      if (selectedPlayer.gold < 10) {
        return resolve(selectedPlayer)
      }

      const luckGambleChance = helper.randomBetween(0, 100);
      const luckGambleGold = Math.round(helper.randomBetween(selectedPlayer.gold / 10, selectedPlayer.gold / 3));
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 2)) {
        selectedPlayer.gold -= luckGambleGold;
        if (selectedPlayer.gold <= 0) {
          selectedPlayer.gold = 0;
        }

        const eventMsgLoseGamble = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} decided to try ${helper.generateGenderString(selectedPlayer, 'his')} luck in a tavern.
        Unfortunately, ${helper.generateGenderString(selectedPlayer, 'he')} lost ${luckGambleGold} gold!`;
        const eventLogLoseGamble = `Oh dear! You lost ${luckGambleGold} gold by gambling in a tavern.`;

        helper.sendMessage(discordHook, 'twitch', false, eventMsgLoseGamble);
        selectedPlayer = helper.logEvent(selectedPlayer, eventLogLoseGamble);

        return resolve(selectedPlayer);
      }

      selectedPlayer.gold += luckGambleGold;

      const eventMsgWinGamble = `[\`${selectedPlayer.map.name}\`] ${helper.generatePlayerName(selectedPlayer)} decided to try ${helper.generateGenderString(selectedPlayer, 'his')} luck in a tavern.
      Fortunately, ${helper.generateGenderString(selectedPlayer, 'he')} won ${luckGambleGold} gold!`;
      const eventLogWinGamble = `Congrats! You won ${luckGambleGold} gold by gambling in a tavern.`;

      helper.sendMessage(discordHook, 'twitch', false, eventMsgWinGamble);
      selectedPlayer = helper.logEvent(selectedPlayer, eventLogWinGamble);

      return resolve(selectedPlayer);
    });
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
        helper.sendMessage(discordHook, 'twitch', false, '@everyone\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
        return this.isBlizzardActive;
      case 'off':
        if (!this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = false;
        helper.sendMessage(discordHook, 'twitch', false, '@everyone\`\`\`python\n\'It seems that blizzard has ended, you can safely travel to other realms. Do not walk away from the road as evil creatures may wait for you in dark forests!\'\`\`\`');
        return this.isBlizzardActive;
    }
  }

  chanceToCatchSnowflake(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      const snowFlakeDice = helper.randomBetween(0, 100);
      if (snowFlakeDice <= 15) {
        const snowFlake = this.ItemManager.generateSnowflake(selectedPlayer);
        if (helper.calculateItemRating(selectedPlayer.equipment.relic) < snowFlake.rating) {
          selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';

          helper.sendMessage(discordHook, 'twitch', false, eventMsgSnowflake);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogSnowflake);
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