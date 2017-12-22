const helper = require('../../utils/helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Map = require('../utils/Map');
const Database = require('../../database/Database');

class Event {

  // Move Events
  moveEvent(selectedPlayer, discordHook) {
    return new Promise((resolve) => {
      selectedPlayer.map = Map.moveToRandomMap(selectedPlayer);
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

          const { playerChance, otherPlayerChance } = Battle.simulateBattleWithPlayer(
            selectedPlayer,
            randomPlayer
          );

          console.log(`GAME: Attacking Player: ${playerChance} - Random Defending Player: ${otherPlayerChance}`);

          if (playerChance >= otherPlayerChance) {
            randomPlayer.health -= Math.abs(playerChance);
            selectedPlayer.battles.won++;
            randomPlayer.battles.lost++;

            const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just attacked ${helper.generatePlayerName(randomPlayer)} in \`${selectedPlayer.map.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` dealing ${Math.abs(playerChance)} damage!`;
            const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and dealt ${Math.abs(playerChance)} damage`;
            const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and lost ${Math.abs(playerChance)} health`;

            helper.sendMessage(discordHook, 'twitch', false, eventMsg);
            selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
            randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

            return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer)
              .then((battleResults) => {
                helper.checkHealth(battleResults.randomPlayer, battleResults.selectedPlayer, discordHook);
                return Database.savePlayer(battleResults.randomPlayer)
                  .then(() => {
                    return battleResults.selectedPlayer;
                  });
              })
              .catch(err => console.log(err));
          }

          selectedPlayer.health -= Math.abs(otherPlayerChance);
          randomPlayer.battles.won++;
          selectedPlayer.battles.lost++;

          const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just attacked ${helper.generatePlayerName(randomPlayer)} with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` but failed!
          ${helper.generatePlayerName(randomPlayer)}s \`${randomPlayer.equipment.weapon.name}\` dealt ${Math.abs(otherPlayerChance)} damage!`;

          const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and failed.
          ${randomPlayer.name} did ${Math.abs(otherPlayerChance)} damage with ${randomPlayer.equipment.weapon.name}`;

          const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} but he/she failed.
          You did ${Math.abs(otherPlayerChance)} damage with ${randomPlayer.equipment.weapon.name}`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsg);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
          randomPlayer = helper.logEvent(randomPlayer, otherPlayerLog);

          return this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer)
            .then((battleResults) => {
              //  TODO: inverted because of how I set the stealPlayerItem function (think of a way to make this better!)
              helper.checkHealth(battleResults.randomPlayer, battleResults.selectedPlayer, discordHook);
              return Database.savePlayer(battleResults.selectedPlayer)
                .then(() => {
                  return battleResults.randomPlayer;
                });
            })
            .catch(err => console.log(err));
        }

        return this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
          .catch(err => console.log(err));
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      return Monster.generateMonster(selectedPlayer)
        .then((mob) => {
          return Battle.simulateBattleWithMob(selectedPlayer, mob)
            .then((battleResults) => {
              console.log(`GAME: PlayerChance: ${battleResults.playerChance} - MobChance: ${battleResults.mobChance}`);
              if (battleResults.playerChance >= battleResults.mobChance) {
                selectedPlayer.experience += mob.experience * multiplier;
                selectedPlayer.gold += mob.gold * multiplier;
                selectedPlayer.kills.mob++;
                helper.checkExperience(selectedPlayer, discordHook);

                const eventMsg = `${helper.generatePlayerName(selectedPlayer)} just killed \`${mob.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` gaining ${mob.experience * multiplier} exp and ${mob.gold * multiplier} gold!`;
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
              helper.checkHealth(selectedPlayer, mob, discordHook);

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
        return Item.generateItem(selectedPlayer)
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

            const eventMsg = `${helper.generatePlayerName(selectedPlayer)} received \`${item.name}\` from \`${mob.name}!\``;
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
      return Item.generateItem(selectedPlayer)
        .then((item) => {
          if (selectedPlayer.gold <= item.gold) {
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
          eventMsg: `${helper.generatePlayerName(selectedPlayer)} a bird just dropped \`${item.name}\` infront of him/her in \`${selectedPlayer.map.name}\`!`,
          eventLog: `A bird just dropped ${item.name} infront of you in ${selectedPlayer.map.name}`
        };
    }
  }

  stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = helper.randomBetween(0, 100);
      if (luckStealChance > 50 || randomPlayer.health <= 0) {
        const luckItem = helper.randomBetween(0, 2);
        switch (luckItem) {
          case 0:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) < helper.calculateItemRating(randomPlayer.equipment.helmet)) {
              selectedPlayer.equipment.helmet = randomPlayer.equipment.helmet;
              if (randomPlayer.equipment.helmet.previousOwners.length > 0) {
                const removePreviousOwnerName = randomPlayer.equipment.helmet.name.replace(`${randomPlayer.equipment.helmet.previousOwners[randomPlayer.equipment.helmet.previousOwners.length - 1]}s`, `${randomPlayer.name}s`);
                selectedPlayer.equipment.helmet.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${removePreviousOwnerName}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              } else {
                selectedPlayer.equipment.helmet.name = `${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}`;
                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              }

              if (!randomPlayer.equipment.helmet.previousOwners) {
                selectedPlayer.equipment.helmet.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.helmet.previousOwners = randomPlayer.equipment.helmet.previousOwners;
                selectedPlayer.equipment.helmet.previousOwners.push(randomPlayer.name);
              }
              randomPlayer.stolen++;
              selectedPlayer.stole++;
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.helmet.position, enumHelper.equipment.empty.helmet);
            }
            break;
          case 1:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) < helper.calculateItemRating(randomPlayer.equipment.armor)) {
              selectedPlayer.equipment.armor = randomPlayer.equipment.armor;
              if (randomPlayer.equipment.armor.previousOwners.length > 0) {
                const removePreviousOwnerName = randomPlayer.equipment.armor.name.replace(`${randomPlayer.equipment.armor.previousOwners[randomPlayer.equipment.armor.previousOwners.length - 1]}s`, `${randomPlayer.name}s`);
                selectedPlayer.equipment.armor.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${removePreviousOwnerName}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              } else {
                selectedPlayer.equipment.armor.name = `${randomPlayer.name}s ${randomPlayer.equipment.armor.name}`;
                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.armor.name}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${randomPlayer.equipment.armor.name}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              }

              if (!randomPlayer.equipment.armor.previousOwners) {
                selectedPlayer.equipment.armor.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.armor.previousOwners = randomPlayer.equipment.armor.previousOwners;
                selectedPlayer.equipment.armor.previousOwners.push(randomPlayer.name);
              }
              randomPlayer.stolen++;
              selectedPlayer.stole++;
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.armor.position, enumHelper.equipment.empty.armor);
            }
            break;
          case 2:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) < helper.calculateItemRating(randomPlayer.equipment.weapon)) {
              selectedPlayer.equipment.weapon = randomPlayer.equipment.weapon;
              if (randomPlayer.equipment.weapon.previousOwners.length > 0) {
                const removePreviousOwnerName = randomPlayer.equipment.weapon.name.replace(`${randomPlayer.equipment.weapon.previousOwners[randomPlayer.equipment.weapon.previousOwners.length - 1]}s`, `${randomPlayer.name}s`);
                selectedPlayer.equipment.weapon.name = removePreviousOwnerName;

                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${removePreviousOwnerName}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${removePreviousOwnerName}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              } else {
                selectedPlayer.equipment.weapon.name = `${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}`;
                const eventMsg = helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}!`);
                const eventLog = `Stole ${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}`;

                helper.sendMessage(discordHook, 'twitch', false, eventMsg);
                selectedPlayer = helper.logEvent(selectedPlayer, eventLog);
              }

              if (!randomPlayer.equipment.weapon.previousOwners) {
                selectedPlayer.equipment.weapon.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.weapon.previousOwners = randomPlayer.equipment.weapon.previousOwners;
                selectedPlayer.equipment.weapon.previousOwners.push(randomPlayer.name);
              }
              randomPlayer.stolen++;
              selectedPlayer.stole++;
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.weapon.position, enumHelper.equipment.empty.weapon);
            }
            break;
        }
      }

      return resolve({ selectedPlayer, randomPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = helper.randomBetween(0, 2);
      switch (luckEvent) {
        case 0:
          const luckStat = helper.randomBetween(0, 4);
          let luckStatAmount = helper.randomBetween(2, 10);
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
            case 4:
              stat = enumHelper.stats.int;
              selectedPlayer.stats.int += luckStatAmount;
              break;
          }

          const eventMsgApollo = `Apollo has blessed ${helper.generatePlayerName(selectedPlayer)} with his music raising his/her \`${stat}\` by ${luckStatAmount}!`;
          const eventLogApollo = `Apollo blessed you with his music raising your ${stat} by ${luckStatAmount}`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgApollo);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogApollo);

          return resolve(selectedPlayer);

        case 1:
          let luckExpAmount = helper.randomBetween(5, 15);
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          const eventMsgHades = `Hades unleashed his wrath upon ${helper.generatePlayerName(selectedPlayer)} making him/her lose ${luckExpAmount} experience!`;
          const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgHades);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogHades);

          return resolve(selectedPlayer);

        case 2:
          let luckHealthAmount = helper.randomBetween(5, 50);
          selectedPlayer.health -= luckHealthAmount;
          helper.checkHealth(selectedPlayer, discordHook);

          const eventMsgTrip = `${helper.generatePlayerName(selectedPlayer)} just lost ${luckHealthAmount} health by tripping and hitting his/her head!`;
          const eventLogTrip = `You lost ${luckHealthAmount} health by tripping and hitting your head`;

          helper.sendMessage(discordHook, 'twitch', false, eventMsgTrip);
          selectedPlayer = helper.logEvent(selectedPlayer, eventLogTrip);

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
        return Item.generateItem(selectedPlayer)
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

        const eventMsgLoseGamble = `${helper.generatePlayerName(selectedPlayer)} decided to try his/her luck in \`${selectedPlayer.map.name}\` tavern. Unfortunately, he/she lost ${luckGambleGold} gold!`;
        const eventLogLoseGamble = `Oh dear! You lost ${luckGambleGold} by gambling in a tavern.`;

        helper.sendMessage(discordHook, 'twitch', false, eventMsgLoseGamble);
        selectedPlayer = helper.logEvent(selectedPlayer, eventLogLoseGamble);

        return resolve(selectedPlayer);
      }

      selectedPlayer.gold += luckGambleGold;

      const eventMsgWinGamble = `${helper.generatePlayerName(selectedPlayer)} decided to try his/her luck in \`${selectedPlayer.map.name}\` tavern. Fortunately, he/she won ${luckGambleGold} gold!`;
      const eventLogWinGamble = `Congrats! You won ${luckGambleGold} by gambling in a tavern.`;

      helper.sendMessage(discordHook, 'twitch', false, eventMsgWinGamble);
      selectedPlayer = helper.logEvent(selectedPlayer, eventLogWinGamble);

      return resolve(selectedPlayer);
    });
  }
}
module.exports = new Event();