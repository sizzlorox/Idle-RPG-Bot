const Database = require('../../database/Database');
const Events = require('./data/events/Events');
const Map = require('../../game/utils/Map');
const Commands = require('../idle-rpg/data/Commands');
const { errorLog } = require('../../utils/logger');

class Game {

  constructor(Helper) {
    this.activeSpells = [];
    this.config = '';

    this.Helper = Helper;
    this.Database = new Database(Helper);
    this.Map = new Map(Helper);
    if (process.env.NODE_ENV.includes('production')) {
      this.Database.loadGame()
        .then((loadedConfig) => {
          this.config = loadedConfig;
          if (this.config.spells.activeBless === 0) {
            this.config.multiplier = 1;
            this.Database.updateGame(this.config);
          }
        })
        .then(() => console.log(`Config loaded\nMultiplier:${this.config.multiplier}\nActive Bless:${this.config.spells.activeBless}\nPrize Pool:${this.config.dailyLottery.prizePool}`))
        .then(() => {
          for (let i = 0; i < this.config.spells.activeBless; i++) {
            setTimeout(() => {
              this.config.spells.activeBless--;
              this.config.multiplier -= 1;
              this.config.multiplier = this.config.multiplier <= 0 ? 1 : this.config.multiplier;
              if (this.config.spells.activeBless === 0) {
                this.config.multiplier = 1;
              }
              this.Database.updateGame(this.config);
            }, 1800000 + (5000 * i));
          }
        })
        .then(() => this.Database.resetPersonalMultipliers());
    } else {
      this.config = {
        multiplier: 1,
        spells: {
          activeBless: 0
        },
        dailyLottery: {
          prizePool: 1500
        }
      };
    }
    this.Events = new Events({ Helper: this.Helper, Map: this.Map, Database: this.Database, config: this.config });
    this.Commands = new Commands({ Database: this.Database, Events: this.Events, Config: this.config });
  }

  async activateEvent(player, onlinePlayers) {
    try {
      const loadedPlayer = await this.Database.loadPlayer(player.discordId);
      if (!loadedPlayer) {
        return {
          updatedPlayer: await this.Database.createNewPlayer(player.discordId, player.name),
          msg: `${this.Helper.generatePlayerName(loadedPlayer, true)} was born in \`${loadedPlayer.map.name}\`! Welcome to the world of Idle-RPG!`,
          pm: 'You were born.'
        };
      }

      if (loadedPlayer.updated_at) {
        const lastUpdated = (new Date().getTime() - loadedPlayer.updated_at.getTime()) / 1000;
        console.log(`${loadedPlayer.name} was last updated: ${this.Helper.secondsToTimeFormat(Math.floor(lastUpdated))} ago.`);
      }
      await this.Helper.passiveRegen(loadedPlayer, ((5 * loadedPlayer.level) / 4) + (loadedPlayer.stats.end / 8), ((5 * loadedPlayer.level) / 4) + (loadedPlayer.stats.int / 8));
      const eventResults = await this.selectEvent(loadedPlayer, onlinePlayers);
      const msgResults = await this.updatePlayer(eventResults);

      return msgResults;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async selectEvent(loadedPlayer, onlinePlayers) {
    try {
      const randomEvent = await this.Helper.randomBetween(0, 2);
      switch (randomEvent) {
        case 0:
          return await this.Events.moveEvent(loadedPlayer);
        case 1:
          return await this.Events.attackEvent(loadedPlayer, onlinePlayers);
        case 2:
          return await this.Events.luckEvent(loadedPlayer);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async updatePlayer(eventResults) {
    eventResults.updatedPlayer.events++;
    await this.Database.savePlayer(eventResults.updatedPlayer);
    return eventResults;
  }

  fetchCommand(command, commandObj) {
    return this.Commands[command](commandObj);
  }

}
module.exports = Game;
