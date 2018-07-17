const enumHelper = require('../../../utils/enumHelper');
const { errorLog } = require('../../../utils/logger');

class Commands {

  constructor(params) {
    const { Database, Events, config } = params;
    this.Database = Database;
    this.Events = Events;
    this.config = Config;
  }

  playerStats(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, enumHelper.statsSelectFields);
  }

  playerInventory(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, enumHelper.inventorySelectFields);
  }

  async resetQuest(commandAuthor) {
    const loadedPlayer = await this.Database.loadPlayer(commandAuthor);
    try {
      if (!loadedPlayer || !loadedPlayer.quest) {
        return 'I\'m sorry but you have no quest.';
      }
      if (((new Date() - loadedPlayer.quest.updated_at) / (1000 * 60 * 60 * 24)) >= 2) {
        return 'I\'m sorry but you must have a quest at least 2 days old';
      }
      const oldQuestMob = loadedPlayer.quest.questMob.name;
      const updatedPlayer = await this.Events.retrieveNewQuest(loadedPlayer);
      await this.Database.savePlayer(updatedPlayer);
      return `Quest ${oldQuestMob} has been changed to ${updatedPlayer.quest.questMob.name} Count: ${updatedPlayer.quest.questMob.count}`;
    } catch (err) {
      errorLog.error(err);
    }
  }

  joinLottery(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        if (player.lottery.joined) {
          return 'You\'ve already joined todays daily lottery!';
        }
        player.lottery.joined = true;
        player.lottery.amount += 100;

        return this.Database.loadGame()
          .then((updatedConfig) => {
            updatedConfig.dailyLottery.prizePool += 100;
            this.config = updatedConfig;

            return this.Database.updateGame(updatedConfig)
              .then(() => this.Database.savePlayer(player))
              .then(() => 'You have joined todays daily lottery! Good luck!')
              .catch(err => errorLog.error(err));
          })
          .catch(err => errorLog.error(err));
      });
  }

  prizePool() {
    return this.Database.loadLotteryPlayers()
      .then((lotteryPlayers) => {
        return `There are ${lotteryPlayers.length} contestants for a prize pool of ${this.config.dailyLottery.prizePool} gold!`;
      });
  }

  checkMultiplier() {
    return `Current Multiplier: ${this.config.multiplier}x\nActive Bless: ${this.config.spells.activeBless}x`;
  }

}
module.exports = Commands;