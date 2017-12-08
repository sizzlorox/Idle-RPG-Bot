const helper = require('../utils/helper');
const LocalDatabase = require('../utils/local-database/LocalDatabase');
const Database = require('../database/Database');
const Event = require('./utils/Event');
const Map = require('./utils/Map');
const logger = require('../utils/logger');
const moment = require('moment');

class Game {

  selectEvent(player, onlinePlayers, discordHook, twitchBot) {
    const randomEvent = helper.randomInt(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          return Database.createNewPlayer(player.discordId, player.name);
        }

        return selectedPlayer;
      })
      .then((selectedPlayer) => {
        selectedPlayer.events++;
        selectedPlayer = helper.passiveHeal(selectedPlayer);
        console.log(`\nGAME: Random Event ID: ${randomEvent} ${moment().utc('br')}`);

        switch (randomEvent) {
          case 0:
            console.log(`GAME: ${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer, discordHook, twitchBot);
            Database.savePlayer(selectedPlayer.discordId, selectedPlayer);
            break;
          case 1:
            console.log(`GAME: ${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot);
            Database.savePlayer(selectedPlayer.discordId, selectedPlayer);
            break;
          case 2:
            console.log(`GAME: ${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, discordHook, twitchBot);
            Database.savePlayer(selectedPlayer.discordId, selectedPlayer);
            break;
        }

        if (selectedPlayer.events % 100 === 0) {
          helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name} has encountered ${selectedPlayer.events} events!\``);
        }
      })
      .catch(err => console.log(err));
  }

  moveEvent(selectedPlayer, discordHook, twitchBot) {
    return Map.moveToRandomMap(selectedPlayer);
  }

  attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (selectedPlayer.map.type === 'Town' && luckDice <= 15 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateTownItemEvent(discordHook, twitchBot, selectedPlayer);
    }

    if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      if (selectedPlayer.map.type !== 'Town') {
        return Event.attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers);
      }
    }
    return Event.attackEventMob(discordHook, twitchBot, selectedPlayer);
  }

  luckEvent(selectedPlayer, discordHook, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(discordHook, twitchBot, selectedPlayer);
    } else if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateGoldEvent(selectedPlayer);
    }

    return Event.generateLuckItemEvent(discordHook, twitchBot, selectedPlayer);
  }

  // Commands
  playerStats(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  deleteAllPlayers() {
    return Database.deleteAllPlayers();
  }
}
module.exports = new Game();
