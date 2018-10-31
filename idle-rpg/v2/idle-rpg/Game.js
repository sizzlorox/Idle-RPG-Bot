// BASE
const { aggregation } = require('../Base/Util');
const BaseGame = require('../Base/Game');
const BaseHelper = require('../Base/Helper');

// DATA
const { newQuest } = require('../../../idle-rpg/database/schemas/quest');
const Commands = require('../idle-rpg/data/Commands');
const Events = require('./data/events/Events');
const Monster = require('../../game/utils/Monster');
const Item = require('../../game/utils/Item');
const Map = require('../../game/utils/Map');
const titles = require('./data/titles');
const { roamingNpcs, pmMode } = require('../../utils/enumHelper');

// UTILS
const Database = require('../../database/Database');
const { errorLog } = require('../../utils/logger');

class Game extends aggregation(BaseGame, BaseHelper) {

  constructor() {
    super();
    this.activeSpells = [];

    this.Database = new Database();
    this.MonsterManager = new Monster();
    this.ItemManager = new Item();
    this.Map = new Map();
    this.Events = new Events({
      Map: this.Map,
      Database: this.Database,
      ItemManager: this.ItemManager,
      MonsterManager: this.MonsterManager
    });
    this.Commands = new Commands({
      Database: this.Database,
      Events: this.Events,
      MapManager: this.Map,
      ItemManager: this.ItemManager,
      MonsterManager: this.MonsterManager
    });
    this.Database.resetPersonalMultipliers();
    this.guildCommandPrefixs = [];
  }

  async activateEvent(guildId, player, onlinePlayers) {
    try {
      const loadedPlayer = await this.Database.loadPlayer(player.discordId);
      if (!loadedPlayer) {
        const newPlayer = await this.Database.createNewPlayer(player.discordId, player.guildId, player.name);

        return await this.updatePlayer({
          type: 'actions',
          updatedPlayer: newPlayer,
          msg: [`${this.generatePlayerName(newPlayer, true)} was born in \`${newPlayer.map.name}\`! Welcome to the world of Idle-RPG!`],
          pm: ['You were born.']
        });
      }

      // Update players name in case they altered their discord name
      loadedPlayer.name = player.name;

      // TODO: Remove after reset
      if (loadedPlayer.isPrivateMessageImportant) {
        loadedPlayer.isPrivateMessage = pmMode.filtered;
      }

      if (loadedPlayer.guildId !== guildId) {
        return;
      }
      if (!loadedPlayer.quest && !loadedPlayer.quest.questMob) {
        loadedPlayer.quest = newQuest;
      }

      const loadedGuildConfig = await this.Database.loadGame(player.guildId);
      await this.passiveRegen(loadedPlayer, ((5 * loadedPlayer.level) / 4) + (loadedPlayer.stats.end / 8), ((5 * loadedPlayer.level) / 4) + (loadedPlayer.stats.int / 8));
      let eventResults = await this.selectEvent(loadedGuildConfig, loadedPlayer, onlinePlayers);
      eventResults = await this.setPlayerTitles(eventResults);
      const msgResults = await this.updatePlayer(eventResults);

      return msgResults;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async selectEvent(loadedGuildConfig, loadedPlayer, onlinePlayers) {
    try {
      const randomEvent = await this.randomBetween(0, 2);
      switch (randomEvent) {
        case 0:
          return this.Events.moveEvent(loadedPlayer);
        case 1:
          return this.Events.attackEvent(loadedPlayer, onlinePlayers, loadedGuildConfig.multiplier);
        case 2:
          return this.Events.luckEvent(loadedPlayer, loadedGuildConfig.events, loadedGuildConfig.multiplier);
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

  dbClass() {
    return this.Database;
  }

  getGuildCommandPrefix(guildId) {
    return this.guildCommandPrefixs.find(guild => guild.id === guildId);
  }

  async loadGuildConfig(guildId) {
    const loadedConfig = await this.Database.loadGame(guildId);
    if ((loadedConfig.multiplier === 1 && loadedConfig.spells.activeBless === 1) || loadedConfig.multiplier <= 0 || (loadedConfig.multiplier > 1 && loadedConfig.spells.activeBless === 0)) {
      loadedConfig.multiplier = 1;
      loadedConfig.spells.activeBless = 0;
      await this.Database.updateGame(guildId, loadedConfig);
    }
    console.log(`
    Config loaded for guild ${guildId}
    Multiplier:${loadedConfig.multiplier}
    Active Bless:${loadedConfig.spells.activeBless}
    Prize Pool:${loadedConfig.dailyLottery.prizePool}\n`);
    if (guildId !== '390509935097675777') {
      this.guildCommandPrefixs.push({ id: loadedConfig.guildId, prefix: loadedConfig.commandPrefix });
    } else {
      this.guildCommandPrefixs.push({ id: loadedConfig.guildId, prefix: '!' });
    }
    for (let i = 0; i < loadedConfig.spells.activeBless; i++) {
      setTimeout(async () => {
        const newLoadedConfig = await this.Database.loadGame(guildId);
        newLoadedConfig.spells.activeBless--;
        newLoadedConfig.multiplier--;
        newLoadedConfig.spells.multiplier = newLoadedConfig.spells.multiplier <= 0 ? 1 : newLoadedConfig.spells.multiplier;
        await this.Database.updateGame(guildId, newLoadedConfig);
      }, 1800000 + (5000 * i));
    }
  }

  async setPlayerTitles(eventResults) {
    if (roamingNpcs.find(npc => npc.discordId === eventResults.updatedPlayer.discordId)) {
      return eventResults;
    }

    await Object.keys(titles).forEach((title) => {
      eventResults.updatedPlayer = this.manageTitles(eventResults, title);
    });

    return eventResults;
  }

  fetchCommand(params) {
    return this.Commands[params.command](params);
  }

}
module.exports = Game;
