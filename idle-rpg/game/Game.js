const helper = require('../utils/helper');
const Database = require('../database/Database');
const { getTowns } = require('./utils/Map');
const Event = require('./utils/Event');
const moment = require('moment');
const logger = require('../utils/logger');
let { multiplier } = require('../../settings');

class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;
  }

  selectEvent(player, onlinePlayers, twitchBot) {
    const randomEvent = helper.randomBetween(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          helper.sendMessage(this.discordHook, twitchBot, false, `<@!${player.discordId}> was born! Welcome to the world of Idle-RPG!`);

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
      .catch(err => console.log(err));
  }

  moveEvent(selectedPlayer) {
    return Event.moveEvent(selectedPlayer, this.discordHook);
  }

  attackEvent(selectedPlayer, onlinePlayers, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
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

    return Event.generateLuckItemEvent(this.discordHook, 'twitch', selectedPlayer);
  }

  luckEvent(selectedPlayer, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
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
    multiplier += 1;
  }

  powerHourEnd() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
    multiplier -= 1;
  }

  giveGold(playerId, amount) {
    return Database.loadPlayer(playerId)
      .then((updatingPlayer) => {
        updatingPlayer.gold += Number(amount);
        Database.savePlayer(updatingPlayer);
      });
  }

  // Commands
  castSpell(commandAuthor, hook, spell) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        switch (spell) {
          case 'bless':
            const spellCost = 1500;
            if (castingPlayer.gold >= spellCost) {
              castingPlayer.spells++;
              castingPlayer.gold -= spellCost;
              multiplier += 1;
              hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name} just casted ${spell}!!! Current Multiplier is: ${multiplier}x`));
              setTimeout(() => {
                multiplier -= 1;
                hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off. Current Multiplier is: ${multiplier}x`));
              }, 1800000); // 30 minutes
              Database.savePlayer(castingPlayer);
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${spellCost} gold. You are lacking ${spellCost - castingPlayer.gold} gold.`);
            }
            break;
        }
      });
  }

  playerEventLog(playerId, count) {
    return Database.loadPlayer(playerId)
      .then((player) => {
        return helper.generateLog(player, count);
      });
  }

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

  savePlayer(player) {
    return Database.savePlayer(player);
  }

  loadPlayer(playerId) {
    return Database.loadPlayer(playerId);
  }

  deletePlayer(playerId) {
    return Database.deletePlayer(playerId);
  }

  deleteAllPlayers() {
    return Database.deleteAllPlayers();
  }

}

module.exports = Game;
