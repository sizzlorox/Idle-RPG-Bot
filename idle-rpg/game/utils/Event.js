const helper = require('../../utils/helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Spell = require('../utils/Spell');
const Map = require('../utils/Map');
const Database = require('../../database/Database');

class Event {

  constructor() {
    this.MonsterManager = new Monster();
    this.ItemManager = new Item();
    this.MapManager = new Map();
    this.SpellManager = new Spell();

    // Events
    this.isBlizzardActive = false;
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
        const sameMapPlayers = mappedPlayers.filter(player => player.name !== selectedPlayer.name
          && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
          && player.level <= selectedPlayer.level + 5 && player.level >= selectedPlayer.level - 5);

        if (sameMapPlayers.length > 0) {
          const randomPlayerIndex = helper.randomBetween(0, sameMapPlayers.length - 1);
          let randomPlayer = sameMapPlayers[randomPlayerIndex];

          return Battle.newSimulateBattleWithPlayer(
            selectedPlayer,
            randomPlayer
          ).then(({ attacker, defender, attackerDamage, defenderDamage }) => {
            selectedPlayer = attacker;
            randomPlayer = defender;

            const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just attacked ${helper.generatePlayerName(randomPlayer)} in \`${selectedPlayer.map.name}\`!
Battle Results:
${helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
${helper.generatePlayerName(selectedPlayer)} has ${selectedPlayer.health} HP left.
${helper.generatePlayerName(randomPlayer)}'s \`${randomPlayer.equipment.weapon.name}\` did ${defenderDamage} damage.
${helper.generatePlayerName(randomPlayer)} has ${randomPlayer.health} HP left.`;

            const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and failed.
            ${randomPlayer.name} did ${defenderDamage} damage with ${randomPlayer.equipment.weapon.name}`;

            const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} but ${helper.generateGenderString(selectedPlayer, 'he')} failed.
            You did ${defenderDamage} damage with ${randomPlayer.equipment.weapon.name}`;

            helper.sendMessage(discordHook, 'twitch', false, eventMsg);
            selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
            randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

            if (selectedPlayer.health <= 0) {
              return this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer)
                .then((stealResult) => {
                  //  TODO: inverted because of how I set the stealPlayerItem function (think of a way to make this better!)
                  helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                  return Database.savePlayer(stealResult.stealingPlayer)
                    .then(() => {
                      return stealResult.victimPlayer;
                    });
                })
                .catch(err => console.log(err));
            }

            if (randomPlayer.health <= 0) {
              return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer)
                .then((stealResult) => {
                  helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                  return Database.savePlayer(stealResult.victimPlayer)
                    .then(() => {
                      return stealResult.stealingPlayer;
                    });
                })
                .catch(err => console.log(err));
            }

            return selectedPlayer;
          });
        }

        return this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
          .catch(err => console.log(err));
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      selectedPlayer.map = this.MapClass.getMapByName(selectedPlayer.map.name);
      return this.MonsterManager.generateMonster(selectedPlayer)
        .then((mob) => {
          return Battle.simulateBattleWithMob(selectedPlayer, mob)
            .then((battleResults) => {
              console.log(`GAME: PlayerChance: ${battleResults.playerChance} - MobChance: ${battleResults.mobChance}`);
              if (battleResults.playerChance >= battleResults.mobChance) {
                selectedPlayer.experience += mob.experience * multiplier;
                selectedPlayer.gold += mob.gold * multiplier;
                selectedPlayer.kills.mob++;
                helper.checkExperience(selectedPlayer, discordHook);

                let eventMsg;
                if (!mob.isXmasEvent) {
                  eventMsg = `${helper.generatePlayerName(selectedPlayer)} just killed \`${mob.name}\` with ${helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` gaining ${mob.experience * multiplier} exp and ${mob.gold * multiplier} gold!`;
                } else {
                  eventMsg = `**${helper.generatePlayerName(selectedPlayer)} just killed \`${mob.name}\` with ${helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` gaining ${mob.experience * multiplier} exp and ${mob.gold * multiplier} gold!**`;
                }
                const eventLog = `Killed ${mob.name} with ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map.name} gaining ${mob.experience * multiplier} exp and ${mob.gold * multiplier} gold`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

                return this.generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob)
                  .then((updatedPlayer) => {
                    return resolve(updatedPlayer);
                  });
              }

              battleResults.mobChance = Math.abs(battleResults.mobChance);

              selectedPlayer.health -= battleResults.mobChance;
              selectedPlayer.gold -= mob.gold;
              if (selectedPlayer.gold <= 0) {
                selectedPlayer.gold = 0;
              }
              helper.checkHealth(this.MapClass, selectedPlayer, mob, discordHook);

              const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just lost a battle to \`${mob.name}\` in \`${selectedPlayer.map.name}\` losing ${battleResults.mobChance} health and ${mob.gold} gold!`;
              const eventLog = `Lost a battle to ${mob.name} in ${selectedPlayer.map.name} losing ${battleResults.mobChance} health and ${mob.gold} gold`;

              helper.sendMessage(discordHook, 'twitch', false, eventMsg);
              selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

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
                if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
                break;
              case enumHelper.equipment.types.armor.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
                break;
              case enumHelper.equipment.types.weapon.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
                break;
              case enumHelper.equipment.types.relic.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.relic) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, item);
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
          if (selectedPlayer.gold <= item.gold || item.name.startsWith('Cracked')) {
            return resolve(selectedPlayer);
          }

          switch (item.position) {
            case enumHelper.equipment.types.helmet.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= item.gold;
              helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
              break;

            case enumHelper.equipment.types.armor.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= item.gold;
              helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
              break;

            case enumHelper.equipment.types.weapon.position:
              if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
                return resolve(selectedPlayer);
              }

              selectedPlayer.gold -= item.gold;
              helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
              break;
          }

          const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just purchased \`${item.name}\` from Town for ${item.gold} Gold!`;
          const eventLog = `Purchased ${item.name} from Town for ${item.gold} Gold`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsg);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLog);

          return resolve(selectedPlayer);
        });
    });
  }

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventMessage = helper.randomBetween(0, 3);
    switch (randomEventMessage) {
      case 0:
        return {
          eventMsg: `${helper.generatePlayerName(selectedPlayer)} found a chest containing \`${item.name}\` in \`${selectedPlayer.map.name}\`!`,
          eventLog: `Found a chest containing ${item.name} in ${selectedPlayer.map.name}`
        };
      case 1:
        return {
          eventMsg: `${helper.generatePlayerName(selectedPlayer)} found \`${item.name}\` on the ground in \`${selectedPlayer.map.name}\`!`,
          eventLog: `Found ${item.name} on the ground in ${selectedPlayer.map.name}`
        };
      case 2:
        return {
          eventMsg: `${helper.generatePlayerName(selectedPlayer)} explored an abandoned hut in \`${selectedPlayer.map.name}\` which had \`${item.name}\` inside!`,
          eventLog: `Explored an abandoned hut in ${selectedPlayer.map.name} which had ${item.name} inside`
        };
      case 3:
        return {
          eventMsg: `${helper.generatePlayerName(selectedPlayer)} a bird just dropped \`${item.name}\` infront of ${helper.generateGenderString(selectedPlayer, 'him')} in \`${selectedPlayer.map.name}\`!`,
          eventLog: `A bird just dropped ${item.name} infront of you in ${selectedPlayer.map.name}`
        };
    }
  }

  stealPlayerItem(discordHook, twitchBot, stealingPlayer, victimPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = helper.randomBetween(0, 100);
      if (luckStealChance > 50) {
        const luckItem = helper.randomBetween(0, 2);
        switch (luckItem) {
          case 0:
            if (helper.calculateItemRating(stealingPlayer.equipment.helmet) < helper.calculateItemRating(victimPlayer.equipment.helmet)) {
              stealingPlayer.equipment.helmet = victimPlayer.equipment.helmet;
              if (victimPlayer.equipment.helmet.previousOwners.length > 0) {
                const lastOwnerInList = victimPlayer.equipment.helmet.previousOwners[victimPlayer.equipment.helmet.previousOwners.length - 1];
                const removePreviousOwnerName = victimPlayer.equipment.helmet.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
                stealingPlayer.equipment.helmet.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${removePreviousOwnerName}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${removePreviousOwnerName} from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              } else {
                stealingPlayer.equipment.helmet.name = `${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}`;
                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}!`);
                const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.helmet.name}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.helmet.name} from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              }

              if (!victimPlayer.equipment.helmet.previousOwners) {
                stealingPlayer.equipment.helmet.previousOwners = [`${victimPlayer.name}`];
              } else {
                stealingPlayer.equipment.helmet.previousOwners = victimPlayer.equipment.helmet.previousOwners;
                stealingPlayer.equipment.helmet.previousOwners.push(victimPlayer.name);
              }
              victimPlayer.stolen++;
              stealingPlayer.stole++;
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.helmet.position, enumHelper.equipment.empty.helmet);
            }
            break;
          case 1:
            if (helper.calculateItemRating(stealingPlayer.equipment.armor) < helper.calculateItemRating(victimPlayer.equipment.armor)) {
              stealingPlayer.equipment.armor = victimPlayer.equipment.armor;
              if (victimPlayer.equipment.armor.previousOwners.length > 0) {
                const lastOwnerInList = victimPlayer.equipment.armor.previousOwners[victimPlayer.equipment.armor.previousOwners.length - 1];
                const removePreviousOwnerName = victimPlayer.equipment.armor.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
                stealingPlayer.equipment.armor.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${removePreviousOwnerName}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${removePreviousOwnerName} from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              } else {
                stealingPlayer.equipment.armor.name = `${victimPlayer.name}s ${victimPlayer.equipment.armor.name}`;
                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.armor.name}!`);
                const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.armor.name}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.armor.name} from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              }

              if (!victimPlayer.equipment.armor.previousOwners) {
                stealingPlayer.equipment.armor.previousOwners = [`${victimPlayer.name}`];
              } else {
                stealingPlayer.equipment.armor.previousOwners = victimPlayer.equipment.armor.previousOwners;
                stealingPlayer.equipment.armor.previousOwners.push(victimPlayer.name);
              }
              victimPlayer.stolen++;
              stealingPlayer.stole++;
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.armor.position, enumHelper.equipment.empty.armor);
            }
            break;
          case 2:
            if (helper.calculateItemRating(stealingPlayer.equipment.weapon) < helper.calculateItemRating(victimPlayer.equipment.weapon)) {
              stealingPlayer.equipment.weapon = victimPlayer.equipment.weapon;
              if (victimPlayer.equipment.weapon.previousOwners.length > 0) {
                const lastOwnerInList = victimPlayer.equipment.weapon.previousOwners[victimPlayer.equipment.weapon.previousOwners.length - 1];
                const removePreviousOwnerName = victimPlayer.equipment.weapon.name.replace(`${lastOwnerInList}s`, `${victimPlayer.name}s`);
                stealingPlayer.equipment.weapon.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${removePreviousOwnerName}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${removePreviousOwnerName} from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              } else {
                stealingPlayer.equipment.weapon.name = `${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}`;
                const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}`);
                const eventLog = `Stole ${victimPlayer.name}s ${victimPlayer.equipment.weapon.name}`;
                const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment.weapon.name} gold from you`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
                victimPlayer = helper.logEvent(victimPlayer, otherPlayerLog);
              }

              if (!victimPlayer.equipment.weapon.previousOwners) {
                stealingPlayer.equipment.weapon.previousOwners = [`${victimPlayer.name}`];
              } else {
                stealingPlayer.equipment.weapon.previousOwners = victimPlayer.equipment.weapon.previousOwners;
                stealingPlayer.equipment.weapon.previousOwners.push(victimPlayer.name);
              }
              victimPlayer.stolen++;
              stealingPlayer.stole++;
              victimPlayer = helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types.weapon.position, enumHelper.equipment.empty.weapon);
            }
            break;
        }
      } else if (victimPlayer.gold > 0) {
        const goldStolen = Math.floor(victimPlayer.gold / 4);
        stealingPlayer.gold += goldStolen;
        victimPlayer.gold -= goldStolen;

        const eventMsg = helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
        const eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;

        helper.sendMessage(discordHook, 'twitch', false, eventMsg);
        stealingPlayer = helper.logEvent(stealingPlayer, eventLog);
      }

      return resolve({ stealingPlayer, victimPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = helper.randomBetween(0, 6);
      switch (luckEvent) {
        case 0:
          const luckStat = helper.randomBetween(0, 3);
          const luckStatAmount = helper.randomBetween(1, 5);
          let stat;
          switch (luckStat) {
            case 0:
              stat = enumHelper.stats.str;
              selectedPlayer.stats.str += luckStatAmount;
              break;
            case 1:
              stat = enumHelper.stats.dex;
              selectedPlayer.stats.dex += luckStatAmount;
              break;
            case 2:
              stat = enumHelper.stats.end;
              selectedPlayer.stats.end += luckStatAmount;
              break;
            case 3:
              stat = enumHelper.stats.int;
              selectedPlayer.stats.int += luckStatAmount;
              break;
          }

          const eventMsgApollo = `Apollo has blessed ${helper.generatePlayerName(selectedPlayer)} with his music raising ${helper.generateGenderString(selectedPlayer, 'his')} \`${stat}\` by ${luckStatAmount}!`;
          const eventLogApollo = `Apollo blessed you with his music raising your ${stat} by ${luckStatAmount}`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgApollo);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogApollo);

          return resolve(selectedPlayer);

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
          const spell = this.SpellManager.generateSpell(selectedPlayer);

          const eventMsgEris = `**Eris has given ${helper.generatePlayerName(selectedPlayer)} a scroll containing ${spell.name} to add to ${helper.generateGenderString(selectedPlayer, 'his')} spellbook!**`;
          const eventLogEris = `Eris gave you a scroll of ${spell.name}`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgEris);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogEris);

          return resolve(selectedPlayer);
      }
    });
  }

  generateGoldEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      const luckGoldChance = helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = helper.randomBetween(5, 100);
        const goldAmount = Number(((luckGoldDice * selectedPlayer.stats.luk) / 2).toFixed()) * multiplier;
        selectedPlayer.gold += goldAmount;

        const eventMsg = `${helper.generatePlayerName(selectedPlayer)} found ${goldAmount} gold in \`${selectedPlayer.map.name}\`!`;
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
        return this.ItemManager.generateItem(selectedPlayer)
          .then((item) => {
            switch (item.position) {
              case enumHelper.equipment.types.helmet.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
                break;
              case enumHelper.equipment.types.armor.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
                  return resolve(selectedPlayer);
                }


                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
                break;
              case enumHelper.equipment.types.weapon.position:
                if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
                  return resolve(selectedPlayer);
                }

                selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
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
      const luckGambleGold = Math.round(helper.randomBetween(selectedPlayer.gold / 10, selectedPlayer.gold / 3)) * multiplier;
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 2)) {
        selectedPlayer.gold -= luckGambleGold;
        if (selectedPlayer.gold <= 0) {
          selectedPlayer.gold = 0;
        }

        const eventMsgLoseGamble = `${helper.generatePlayerName(selectedPlayer)} decided to try ${helper.generateGenderString(selectedPlayer, 'his')} luck in \`${selectedPlayer.map.name}\` tavern. Unfortunately, ${helper.generateGenderString(selectedPlayer, 'he')} lost ${luckGambleGold} gold!`;
        const eventLogLoseGamble = `Oh dear! You lost ${luckGambleGold} by gambling in a tavern.`;

        helper.sendMessage(discordHook, 'twitch', false, eventMsgLoseGamble);
        selectedPlayer = helper.logEvent(selectedPlayer, eventLogLoseGamble);

        return resolve(selectedPlayer);
      }

      selectedPlayer.gold += luckGambleGold;

      const eventMsgWinGamble = `${helper.generatePlayerName(selectedPlayer)} decided to try ${helper.generateGenderString(selectedPlayer, 'his')} luck in \`${selectedPlayer.map.name}\` tavern. Fortunately, ${helper.generateGenderString(selectedPlayer, 'he')} won ${luckGambleGold} gold!`;
      const eventLogWinGamble = `Congrats! You won ${luckGambleGold} by gambling in a tavern.`;

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
        // helper.sendMessage(discordHook, 'twitch', false, '@everyone\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
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
        if (helper.calculateItemRating(selectedPlayer.equipment.relic) < helper.calculateItemRating(snowFlake)) {
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