const helper = require('../utils/helper');
const enumHelper = require('../utils/enumHelper');
const Database = require('../database/Database');
const Event = require('./utils/Event');
const moment = require('moment');
const logger = require('../utils/logger');

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
            this.attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
          case 2:
            console.log(`GAME: ${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, discordHook, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
        }

        if (selectedPlayer.events % 100 === 0) {
          helper.sendMessage(discordHook, twitchBot, `\`\`\`css\n${selectedPlayer.name} has encountered ${selectedPlayer.events} events!\`\`\``);
        }
      })
      .catch(err => logger.error(err));
  }

  moveEvent(selectedPlayer) {
    return Event.moveEvent(selectedPlayer);
  }

  attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (selectedPlayer.map.type === enumHelper.map.types.town && luckDice <= 15 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateTownItemEvent(discordHook, twitchBot, selectedPlayer);
    }

    console.log(`GAME: Attack Luck Dice: ${luckDice}`);

    if (luckDice >= 75 - (selectedPlayer.stats.luk / 2) && selectedPlayer.map.type !== enumHelper.map.types.town) {
      return Event.attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers);
    }

    return Event.attackEventMob(discordHook, twitchBot, selectedPlayer);
  }

  luckEvent(selectedPlayer, discordHook, twitchBot) {
    const luckDice = helper.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(discordHook, twitchBot, selectedPlayer);
    } else if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateLuckItemEvent(discordHook, twitchBot, selectedPlayer);
    }

    return Event.generateGoldEvent(selectedPlayer);
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
