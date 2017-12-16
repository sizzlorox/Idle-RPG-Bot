const helper = require('../utils/helper');
const Database = require('../database/Database');
const { getTowns } = require('./utils/Map');
const Event = require('./utils/Event');
const moment = require('moment');
const logger = require('../utils/logger');
let { multiplier } = require('../../settings');
const { powerHourWarn, powerHourBegin, powerHourEnd } = require('../utils/cron');

class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;

    powerHourWarn.onTick = this.powerHourWarn;
    powerHourBegin.onTick = this.powerHourBegin;
    powerHourEnd.onTick = this.powerHourEnd;

    powerHourWarn.start();
    powerHourBegin.start();
    powerHourEnd.start();
  }

  selectEvent(player, onlinePlayers, twitchBot) {
    const randomEvent = helper.randomInt(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          return Database.createNewPlayer(player.discordId, player.name);
        }

        return selectedPlayer;
      })
      .then((selectedPlayer) => {
        selectedPlayer.name = player.name;
        selectedPlayer.events++;
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

        if (selectedPlayer.events % 100 === 0) {
          helper.sendMessage(this.discordHook, twitchBot, false, helper.setImportantMessage(`${selectedPlayer.name} has encountered ${selectedPlayer.events} events!`));
        }
      })
      .catch(err => logger.error(err));
  }

  moveEvent(selectedPlayer) {
    return Event.moveEvent(selectedPlayer, this.discordHook);
  }

  attackEvent(selectedPlayer, onlinePlayers, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (getTowns().includes(selectedPlayer.map.name) && luckDice <= 30 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateTownItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    console.log(`GAME: Attack Luck Dice: ${luckDice}`);

    if (luckDice >= 90 - (selectedPlayer.stats.luk / 2) && !getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventPlayerVsPlayer(this.discordHook, twitchBot, selectedPlayer, onlinePlayers);
    }

    if (!getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventMob(this.discordHook, twitchBot, selectedPlayer, multiplier);
    }

    return selectedPlayer;
  }

  luckEvent(selectedPlayer, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(this.discordHook, twitchBot, selectedPlayer);
    } else if (luckDice >= 65 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateLuckItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    return Event.generateGoldEvent(this.discordHook, selectedPlayer, multiplier);
  }

  // Event
  powerHourWarn() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));
  }

  powerHourBegin() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
    multiplier = 2;
  }

  powerHourEnd() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
    multiplier = 1;
  }

  // Commands
  playerStats(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  playerEquipment(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  forcePvp(discordBot, commandAuthor, playerToAttack, otherPlayerToAttack) {
    if (!otherPlayerToAttack) {
      return Database.loadPlayer(commandAuthor.id)
        .then((selectedPlayer) => {
          const playerToAttackObj = discordBot.users.filter(player => player.username === playerToAttack && !player.bot);
          if (playerToAttackObj.size === 0) {
            commandAuthor.send(`${playerToAttack} was not found!`);
            return;
          }

          this.playerStats(playerToAttackObj.array()[0])
            .then((playerToAttackStats) => {
              if (!playerToAttackStats) {
                return commandAuthor.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
              }

              const updatedPlayer = Event.attackForcePvPAttack(this.discordHook, 'twitchBot', selectedPlayer, playerToAttackStats);
              Database.savePlayer(updatedPlayer);
            });
        });
    }

    const playerToAttackObj = discordBot.users.filter(player => player.username === playerToAttack && !player.bot);
    const otherPlayerToAttackObj = discordBot.users.filter(player => player.username === otherPlayerToAttack && !player.bot);

    return this.playerStats(playerToAttackObj.array()[0])
      .then((playerToAttackStats) => {
        if (!playerToAttackStats) {
          return commandAuthor.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
        }

        this.playerStats(otherPlayerToAttackObj.array()[0])
          .then((otherPlayerToAttackStats) => {
            if (!otherPlayerToAttackStats) {
              return commandAuthor.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const updatedPlayer = Event.attackForcePvPAttack(discordHook, 'twitchBot', playerToAttackStats, otherPlayerToAttackStats);
            Database.savePlayer(updatedPlayer);
          });
      });
  }

  getOnlinePlayerMaps(onlinePlayers) {
    return Database.loadOnlinePlayerMaps(onlinePlayers);
  }

  deletePlayer(playerId) {
    return Database.deletePlayer(playerId);
  }

  deleteAllPlayers() {
    return Database.deleteAllPlayers();
  }

}

module.exports = Game;
