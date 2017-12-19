const helper = require('../utils/helper');
const Database = require('../database/Database');
const { getTowns } = require('./utils/Map');
const Event = require('./utils/Event');
const spells = require('./data/spells');
const moment = require('moment');
const logger = require('../utils/logger');
const { multiplier } = require('../../settings');

class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;
    this.multiplier = multiplier;
    this.activeSpells = [];
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

    if (luckDice >= 90 - (selectedPlayer.stats.luk / 2) && !getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventPlayerVsPlayer(this.discordHook, twitchBot, selectedPlayer, onlinePlayers, this.multiplier);
    }

    if (!getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventMob(this.discordHook, twitchBot, selectedPlayer, this.multiplier);
    }

    return Event.generateLuckItemEvent(this.discordHook, 'twitch', selectedPlayer);
  }

  luckEvent(selectedPlayer, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(this.discordHook, twitchBot, selectedPlayer);
    } else if (getTowns().includes(selectedPlayer.map.name) && luckDice <= 20 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGamblingEvent(this.discordHook, selectedPlayer, this.multiplier);
    } else if (luckDice >= 65 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateLuckItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    return Event.generateGoldEvent(this.discordHook, selectedPlayer, this.multiplier);
  }

  // Event
  powerHourWarn() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));
  }

  powerHourBegin() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
    this.multiplier += 1;
  }

  powerHourEnd() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
    this.multiplier -= 1;
  }

  giveGold(playerId, amount) {
    return Database.loadPlayer(playerId)
      .then((updatingPlayer) => {
        updatingPlayer.gold += Number(amount);
        Database.savePlayer(updatingPlayer);
      });
  }

  // Commands
  top10(commandAuthor, type = { level: -1 }) {
    return Database.loadTop10(type)
      .then((top10) => {
        commandAuthor.send(`\`\`\`Top 10 ${Object.keys(type)[0]}:
${top10.filter(player => player[Object.keys(type)[0]] > 0).map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${Object.keys(type)[0]}: ${player[Object.keys(type)[0]]}`).join('\n')}
        \`\`\``);
      });
  }

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