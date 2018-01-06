const helper = require('../utils/helper');
const Database = require('../database/Database');
const Event = require('./utils/Event');
const spells = require('./data/spells');
const moment = require('moment');
const { multiplier } = require('../../settings');

/**
 * GANE CLASS
 */
class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;
    this.multiplier = multiplier;
    this.activeSpells = [];
  }

  /**
   * Loads player by discordID and rolls a dice to select which type of event to activate
   * @param {*} player 
   * @param {*} onlinePlayers 
   * @param {*} twitchBot 
   */
  selectEvent(player, onlinePlayers, twitchBot) {
    const randomEvent = helper.randomBetween(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          helper.sendMessage(this.discordHook, twitchBot, false, `${helper.generatePlayerName(player)} was born! Welcome to the world of Idle-RPG!`);

          return Database.createNewPlayer(player.discordId, player.name);
        }

        return selectedPlayer;
      })
      .then((selectedPlayer) => {
        //selectedPlayer = Event.regenItem(selectedPlayer);
        selectedPlayer.name = player.name;
        selectedPlayer.events++;
        if (selectedPlayer.gender === 'boy')
          selectedPlayer.gender = 'male';
        if (selectedPlayer.gender === 'girl')
          selectedPlayer.gender = 'female';

        if (selectedPlayer.events % 100 === 0) {
          helper.sendMessage(this.discordHook, twitchBot, false, helper.setImportantMessage(`${selectedPlayer.name} has encountered ${selectedPlayer.events} events!`));
        }

        helper.passiveHeal(selectedPlayer);
        console.log(`\nGAME: Random Event ID: ${randomEvent} ${moment().utc('br')}`);

        switch (randomEvent) {
          case 0:
            console.log(`GAME: ${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
          case 1:
            console.log(`GAME: ${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
          case 2:
            console.log(`GAME: ${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
        }
      })
      .catch(err => console.log(err));
  }

  moveEvent(selectedPlayer) {
    return Event.moveEvent(selectedPlayer, this.discordHook);
  }

  /**
   * Rolls dice to select which type of attack event is activated for the player
   * @param {*} selectedPlayer 
   * @param {*} onlinePlayers 
   * @param {*} twitchBot 
   */
  attackEvent(selectedPlayer, onlinePlayers, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
    if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 30 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateTownItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    if (luckDice >= 90 - (selectedPlayer.stats.luk / 2) && !Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventPlayerVsPlayer(this.discordHook, twitchBot, selectedPlayer, onlinePlayers, this.multiplier);
    }

    if (!Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventMob(this.discordHook, twitchBot, selectedPlayer, this.multiplier);
    }

    return Event.generateLuckItemEvent(this.discordHook, 'twitch', selectedPlayer);
  }

  /**
   * Rolls dice to select which type of luck event is activated for the player
   * @param {*} selectedPlayer 
   * @param {*} twitchBot 
   */
  luckEvent(selectedPlayer, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
    console.log(`Player: ${selectedPlayer.name} - Dice: ${luckDice}`);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 20 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGamblingEvent(this.discordHook, selectedPlayer, this.multiplier);
    }

    if (Event.isBlizzardActive && Event.MapClass.getMapsByType('Snow').includes(selectedPlayer.map.name) && luckDice <= 35 + (selectedPlayer.stats.luk / 2)) {
      return Event.chanceToCatchSnowflake(this.discordHook, selectedPlayer);
    }

    if (luckDice >= 65 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateLuckItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    return Event.generateGoldEvent(this.discordHook, selectedPlayer, this.multiplier);
  }

  // Event
  powerHourBegin() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));

    setTimeout(() => {
      helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
      this.multiplier += 1;
    }, 1800000); // 30 minutes

    setTimeout(() => {
      helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
      this.multiplier -= 1;
      this.multiplier = this.multiplier <= 0 ? 1 : this.multiplier;
    }, 5400000); // 1hr 30 minutes
  }

  /**
   * Gives gold amount to player
   * @param {*} playerId 
   * @param {*} amount 
   */
  giveGold(playerId, amount) {
    return Database.loadPlayer(playerId)
      .then((updatingPlayer) => {
        updatingPlayer.gold += Number(amount);
        Database.savePlayer(updatingPlayer);
      });
  }

  /**
   * Returns top10 of a certain attribute
   * @param {*} commandAuthor 
   * @param {*} type 
   */
  top10(commandAuthor, type = { level: -1 }) {
    return Database.loadTop10(type)
      .then((top10) => {
        const rankString = `${top10.filter(player => player[Object.keys(type)[0]] > 0)
          .sort((player1, player2) => {
            if (Object.keys(type)[0] === 'level') {
              return player2.experience - player1.experience && player2.level - player2.level;
            }

            return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
          })
          .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${Object.keys(type)[0]}: ${player[Object.keys(type)[0]]}`)
          .join('\n')}`;

        commandAuthor.send(`\`\`\`Top 10 ${Object.keys(type)[0]}:
${rankString}
        \`\`\``);
      });
  }

  /**
   * Modify player preference for being @mentionned in events
   * @param Player commandAuthor
   * @param DiscordHook hook
   * @param Boolean isMentionInDiscord
   */
  modifyMention(commandAuthor, hook, isMentionInDiscord) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        if (castingPlayer.isMentionInDiscord !== isMentionInDiscord) {
          castingPlayer.isMentionInDiscord = isMentionInDiscord;
          return Database.savePlayer(castingPlayer)
            .then(() => {
              return commandAuthor.send('Preference for being @mention has been updated.');
            });
        }

        return commandAuthor.send('Your @mention preference is already set to this value.');
      });
  }

  /**
   * Modify player gender
   * @param Player commandAuthor
   * @param DiscordHook hook
   * @param String gender
   */
  modifyGender(commandAuthor, hook, gender) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        if (castingPlayer.gender !== gender) {
          castingPlayer.gender = gender;
          return Database.savePlayer(castingPlayer)
            .then(() => {
              return commandAuthor.send('Gender has been updated.');
            });
        }

        return commandAuthor.send('Your gender is already set to this value.');
      });
  }

  /**
   * Casts spell
   * @param {*} commandAuthor 
   * @param {*} hook 
   * @param {*} spell 
   */
  castSpell(commandAuthor, hook, spell) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        switch (spell) {
          case 'bless':
            if (castingPlayer.gold >= spells.bless.spellCost) {
              castingPlayer.spells++;
              castingPlayer.gold -= spells.bless.spellCost;
              this.multiplier += 1;
              const blessLogObj = {
                spellName: 'Bless',
                caster: castingPlayer.discordId
              };

              this.activeSpells.push(blessLogObj);

              let activeBlessCount = this.activeSpells.filter((bless) => {
                return bless.spellName === 'Bless';
              }).length;

              hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name} just casted ${spell}!!\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              setTimeout(() => {
                this.multiplier -= 1;
                this.multiplier = this.multiplier <= 0 ? 1 : this.multiplier;
                this.activeSpells.splice(this.activeSpells.indexOf(blessLogObj), 1);
                activeBlessCount = this.activeSpells.filter((bless) => {
                  return bless.spellName === 'Bless';
                }).length;

                hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off.\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              }, 1800000); // 30 minutes
              Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been casted!');
                });
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${spells.bless.spellCost} gold. You are lacking ${spells.bless.spellCost - castingPlayer.gold} gold.`);
            }
            break;
        }
      });
  }

  /**
   * places a bounty on specific player
   * @param {*} discordHook 
   * @param {*} playerId 
   * @param {*} recipient 
   * @param {*} amount 
   */
  placeBounty(discordHook, bountyPlacer, recipient, amount) {
    return Database.loadPlayer(bountyPlacer.id)
      .then((placer) => {
        if (placer.gold >= amount) {
          placer.gold -= amount;

          return Database.savePlayer(placer)
            .then(() => {
              return Database.loadPlayer(recipient)
                .then((bountyRecipient) => {
                  bountyRecipient.currentBounty += amount;
                  discordHook.actionHook.send(
                    helper.setImportantMessage(`${placer.name} just put a bounty of ${amount} gold on ${bountyRecipient.name}'s head!`)
                  );

                  return Database.savePlayer(bountyRecipient)
                    .then(() => {
                      return commandAuthor.send(`Bounty of ${amount} gold has been placed`);
                    });
                });
            });
        }

        return commandAuthor.send('You need more gold to place this bounty');
      });
  }

  /**
   * Returns player eventlog by <count> amount
   * @param {*} playerId 
   * @param {*} count 
   */
  playerEventLog(playerId, count) {
    return Database.loadPlayer(playerId)
      .then((player) => {
        return helper.generateLog(player, count);
      });
  }

  /**
   * Loads player stats by dicordId
   * @param {*} commandAuthor 
   */
  playerStats(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  /**
   * Loads player equipment by discordId
   * @param {*} commandAuthor 
   */
  playerEquipment(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  /**
   * Get online players maps by an array of discordIds
   * @param {*} onlinePlayers 
   */
  getOnlinePlayerMaps(onlinePlayers) {
    return Database.loadOnlinePlayerMaps(onlinePlayers);
  }

  /**
   * Saves player into database
   * @param {*} player 
   */
  savePlayer(player) {
    return Database.savePlayer(player);
  }

  /**
   * Loads player by discordId
   * @param {*} playerId 
   */
  loadPlayer(playerId) {
    return Database.loadPlayer(playerId);
  }

  /**
   * Deletes player by discordId
   * @param {*} playerId 
   */
  deletePlayer(playerId) {
    return Database.deletePlayer(playerId);
  }

  /**
   * Deletes all players in database
   */
  deleteAllPlayers() {
    return Database.resetAllPlayers();
  }

  /**
   * SPECIAL EVENTS
   */
  blizzardSwitch(blizzardSwitch) {
    return Event.blizzardSwitch(this.discordHook, blizzardSwitch);
  }

  /**
   * Sends Christmas Pre Event Message and another pre event message after 21 hours
   */
  sendChristmasFirstPreEventMessage() {
    return helper.sendMessage(this.discordHook, 'twitch', false, '@everyone\`\`\`python\n\'Terrible news from Kingdom of Olohaseth! Several people are now in hospitals with unknown wounds. They don\`t remember exactly what or who did it to them but they keep warning not to travel to other lands...\'\`\`\`');
  }

  sendChristmasSecondPreEventMessage() {
    return helper.sendMessage(this.discordHook, 'twitch', false, '@everyone\`\`\`python\n\'Rumour has it that some mysterious beasts appeared in Wintermere, Norpond and North Redmount. Inns and taverns all over the world are full of curious adventurers. Is it somehow connected with recent news from Olohaseth?\'\`\`\`');
  }

  // TODO change to utilize setTimeout
  /**
   * Activates christmas mobs to be spawnable and items droppable
   * @param {*} isStarting 
   */
  updateChristmasEvent(isStarting) {
    if (isStarting) {
      // helper.sendMessage(this.discordHook, 'twitch', false, '@everyone\`\`\`python\n\'The bravest adventurers started their expedition to the northern regions and discovered unbelievable things. It seems that Yetis had awoken from their snow caves after hundreds of years of sleep. Are they not a myth anymore?\'\`\`\`');
      Event.MonsterClass.monsters.forEach((mob) => {
        if (mob.isXmasEvent) {
          mob.isSpawnable = true;
        }
      });
      Event.ItemClass.items.forEach((type) => {
        type.forEach((item) => {
          if (item.isXmasEvent && item.name !== 'Snowflake') {
            item.isDroppable = true;
          }
        });
      });
      return '';
    }

    helper.sendMessage(this.discordHook, 'twitch', false, '@everyone\`\`\`python\n\'Thousand of townsmen in Olohaseth, Kindale and other towns are celebrating end of the Darknight. It seems that Christmas Gnomes lost all their candy canes and all Yetis are back to their caves. Though noone knows for how long...\'\`\`\`');
    Event.MonsterClass.monsters.forEach((mob) => {
      if (mob.isXmasEvent) {
        mob.isSpawnable = false;
      }
    });
    Event.ItemClass.items.forEach((type) => {
      type.forEach((item) => {
        if (item.isXmasEvent && item.name !== 'Snowflake') {
          item.isDroppable = false;
        }
      });
    });
    return '';
  }

}

module.exports = Game;
