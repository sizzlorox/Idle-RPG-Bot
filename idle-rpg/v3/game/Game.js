const { newQuest } = require('../../database/schemas/quest');
const titles = require('../../v2/idle-rpg/data/titles');
const { roamingNpcs } = require('../../utils/enumHelper');
const roamingNpcIds = new Set(roamingNpcs.map((npc) => npc.discordId));
const titleKeys = Object.keys(titles);
const Database = require('../../database/Database');
const { errorLog } = require('../../utils/logger');
const { generatePlayerName } = require('../utils/formatters');

const { initHolidays } = require('../crons/tasks/holidayManager');
const MapNavigator = require('./generators/MapNavigator');
const MonsterGen = require('./generators/MonsterGen');
const ItemGen = require('./generators/ItemGen');
const SpellGen = require('./generators/SpellGen');
const InventoryManager = require('./generators/InventoryManager');
const PlayerManager = require('./PlayerManager');
const BattleEngine = require('./BattleEngine');
const EventEngine = require('./EventEngine');

class Game {
  constructor() {
    this.db = new Database();
    this.map = new MapNavigator();
    this.monsterGen = new MonsterGen();
    this.itemGen = new ItemGen();
    this.spellGen = new SpellGen();
    this.inventory = new InventoryManager();
    this.player = new PlayerManager({ db: this.db, map: this.map });
    this.battle = new BattleEngine({
      db: this.db,
      map: this.map,
      inventory: this.inventory,
      itemGen: this.itemGen,
      player: this.player,
    });
    this.events = new EventEngine({
      db: this.db,
      map: this.map,
      monsterGen: this.monsterGen,
      itemGen: this.itemGen,
      spellGen: this.spellGen,
      inventory: this.inventory,
      player: this.player,
      battle: this.battle,
    });
    this.canJoinLottery = true;
    this.db.resetPersonalMultipliers();
    initHolidays(this);
  }

  async activateEvent(guildId, player, onlinePlayers) {
    try {
      const loadedPlayer = await this.db.loadPlayer(player.discordId);
      if (!loadedPlayer) {
        const newPlayer = await this.db.createNewPlayer(
          player.discordId,
          player.guildId,
          player.name,
        );
        return await this.updatePlayer({
          type: 'actions',
          updatedPlayer: newPlayer,
          msg: [
            `${generatePlayerName(newPlayer, true)} was born in \`${newPlayer.map.name}\`! Welcome to the world of Idle-RPG!`,
          ],
          pm: ['You were born.'],
        });
      }
      if (loadedPlayer.guildId !== guildId) return;

      loadedPlayer.name = player.name;
      if (!loadedPlayer.quest || !loadedPlayer.quest.questMob) {
        loadedPlayer.quest = newQuest;
      }

      const loadedGuildConfig = await this.db.loadGame(guildId);
      this.player.passiveRegen(
        loadedPlayer,
        (5 * loadedPlayer.level) / 4 + loadedPlayer.stats.end / 8,
        (5 * loadedPlayer.level) / 4 + loadedPlayer.stats.int / 8,
      );

      const guildEvents = loadedGuildConfig.events || {};
      const weather = guildEvents.weather || {};
      const WEATHER_MULTIPLIERS = {
        sandstorm: 0.8,
        heatwave: 0.8,
        'warm sunshine': 1.2,
        rain: 1.1,
      };
      const weatherMult =
        weather.biome === loadedPlayer.map.biome.name && weather.type
          ? (WEATHER_MULTIPLIERS[weather.type] ?? 1.0)
          : 1.0;
      const effectiveMultiplier = loadedGuildConfig.multiplier * weatherMult;

      const randomEvent = Math.floor(Math.random() * 3);
      let eventResults;
      switch (randomEvent) {
        case 0:
          eventResults = await this.events.moveEvent(loadedPlayer);
          break;
        case 1:
          eventResults = await this.events.attackEvent(
            loadedPlayer,
            onlinePlayers,
            effectiveMultiplier,
            guildEvents,
          );
          break;
        case 2:
          eventResults = await this.events.luckEvent(
            loadedPlayer,
            guildEvents,
            effectiveMultiplier,
          );
          break;
      }

      eventResults = await this.setPlayerTitles(eventResults);
      return await this.updatePlayer(eventResults);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async setPlayerTitles(eventResults) {
    if (roamingNpcIds.has(eventResults.updatedPlayer.discordId)) return eventResults;
    titleKeys.forEach((title) => {
      eventResults.updatedPlayer = this.player.manageTitles(eventResults, title);
    });
    return eventResults;
  }

  async updatePlayer(eventResults) {
    eventResults.updatedPlayer.events++;
    await this.db.savePlayer(eventResults.updatedPlayer);
    return eventResults;
  }

  async loadGuildConfig(guildId) {
    const loadedConfig = await this.db.loadGame(guildId);
    console.log(
      `\n    Config loaded for guild ${guildId}\n    Multiplier:${loadedConfig.multiplier}\n    Active Bless:${loadedConfig.spells.bless.reduce((prev, curr) => prev + curr.count, 0)}\n    Prize Pool:${loadedConfig.dailyLottery.prizePool}\n    Command Prefix:${loadedConfig.commandPrefix}\n    Blizzard:${loadedConfig.events.blizzard.isActive}\n    Invasion:${loadedConfig.events.isInvasionActive} (${loadedConfig.events.invasionMobType})\n    Blood Moon:${loadedConfig.events.blizzard.isActive}\n    Weather:${loadedConfig.events.weather ? loadedConfig.events.weather.type : 'none'} in ${loadedConfig.events.weather ? loadedConfig.events.weather.biome : ''}\n`,
    );
    // TODO: Refactor
    if (loadedConfig.events.isInvasionActive) {
      setTimeout(
        () => {
          loadedConfig.events.isInvasionActive = false;
          loadedConfig.events.invasionMobType = '';
          this.db.updateGame(guildId, loadedConfig);
        },
        Math.floor(Math.random() * (28800000 - 10800000)) + 10800000,
      );
    }
    // TODO: Refactor
    if (loadedConfig.events.isBloodMoonActive) {
      setTimeout(
        () => {
          loadedConfig.events.isBloodMoonActive = false;
          this.db.updateGame(guildId, loadedConfig);
        },
        Math.floor(Math.random() * (21600000 - 7200000)) + 7200000,
      );
    }
    // TODO: Refactor
    if (loadedConfig.events.weather && loadedConfig.events.weather.type) {
      setTimeout(
        () => {
          loadedConfig.events.weather = { biome: '', type: '' };
          this.db.updateGame(guildId, loadedConfig);
        },
        Math.floor(Math.random() * (21600000 - 7200000)) + 7200000,
      );
    }
  }

  disableJoinLottery() {
    this.canJoinLottery = false;
  }
  enableJoinLottery() {
    this.canJoinLottery = true;
  }

  async fetchPlayerData(discordId) {
    return this.db.loadPlayer(discordId);
  }
}

module.exports = Game;
