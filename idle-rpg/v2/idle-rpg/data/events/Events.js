// BASE
const BaseHelper = require('../../../Base/Helper');

// UTILS
const { errorLog } = require('../../../../utils/logger');

// DATA
const enumHelper = require('../../../../utils/enumHelper');
const Town = require('./Town');
const Battle = require('./Battle');
const Luck = require('./Luck');
const Spell = require('../../../../game/utils/Spell');
const Inventory = require('../../../../game/utils/Inventory');

class Events extends BaseHelper {

  constructor(params) {
    super();
    const { Helper, Map, Database, ItemManager, MonsterManager } = params;
    this.Helper = Helper;
    this.MapManager = Map;
    this.Database = Database;
    this.SpellManager = new Spell(this.Helper);
    this.InventoryManager = new Inventory();
    this.MonsterManager = MonsterManager;
    this.ItemManager = ItemManager;
    this.Battle = new Battle({
      Helper: this.Helper,
      Database: this.Database,
      MapManager: this.MapManager,
      InventoryManager: this.InventoryManager,
      ItemManager: this.ItemManager
    });
    this.TownEvents = new Town({
      Helper: this.Helper,
      Database: this.Database,
      ItemManager: this.ItemManager,
      InventoryManager: this.InventoryManager
    });
    this.LuckEvents = new Luck({
      Helper: this.Helper,
      Database: this.Database,
      SpellManager: this.SpellManager,
      ItemManager: this.ItemManager,
      InventoryManager: this.InventoryManager
    });
  }

  async moveEvent(playerObj) {
    const updatedPlayer = Object.assign({}, playerObj);
    const eventMsg = [];
    const eventLog = [];
    try {
      const mapObj = await this.MapManager.moveToRandomMap(updatedPlayer);
      if (mapObj.map.name === updatedPlayer.previousMap) {
        return {
          updatedPlayer
        };
      }
      updatedPlayer.previousMap = updatedPlayer.map.name;
      updatedPlayer.map = mapObj.map;
      updatedPlayer.travelled++;
      eventMsg.push(`${this.generatePlayerName(updatedPlayer)} decided to head \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\` and arrived in \`${mapObj.map.name}\`.`);
      eventLog.push(`Travelled ${mapObj.direction} from ${updatedPlayer.previousMap} and arrived in ${mapObj.map.name}`);
      await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.move);

      return {
        type: 'movement',
        updatedPlayer,
        msg: eventMsg,
        pm: eventLog
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async attackEvent(loadedPlayer, onlinePlayers, globalMultiplier) {
    let updatedPlayer = Object.assign({}, loadedPlayer);
    try {
      const luckDice = await this.randomBetween(0, 100);
      if (this.MapManager.getTowns().includes(updatedPlayer.map.name) && luckDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const eventMsg = [];
        const eventLog = [];
        const townSellResults = await this.TownEvents.sell(updatedPlayer);
        if (townSellResults.msg) {
          eventMsg.push(townSellResults.msg);
          eventLog.push(townSellResults.pm);
          updatedPlayer = townSellResults.updatedPlayer;
        }
        const townItemResults = await this.TownEvents.generateItemEvent(updatedPlayer);
        if (townItemResults.msg) {
          eventMsg.push(townItemResults.msg);
          eventLog.push(townItemResults.pm);
          updatedPlayer = townItemResults.updatedPlayer;
        }

        return eventMsg.length > 0
          ? {
            type: 'actions',
            updatedPlayer,
            msg: eventMsg,
            pm: eventLog
          }
          : { updatedPlayer }
      }

      if (!this.MapManager.getTowns().includes(updatedPlayer.map.name)) {
        if (luckDice >= (95 - (updatedPlayer.stats.luk / 4)) && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          if (onlinePlayers.length <= 1) {
            const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
            return this.Battle.playerVsMob(updatedPlayer, mobToBattle, (globalMultiplier + updatedPlayer.personalMultiplier));
          }
          const { randomPlayer } = await this.Battle.findPlayerToBattle(updatedPlayer, onlinePlayers);
          if (!randomPlayer) {
            const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
            return this.Battle.playerVsMob(updatedPlayer, mobToBattle, (globalMultiplier + updatedPlayer.personalMultiplier));
          }

          return this.Battle.playerVsPlayer(updatedPlayer, randomPlayer, (globalMultiplier + updatedPlayer.personalMultiplier));
        }

        if (updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
          return this.Battle.playerVsMob(updatedPlayer, mobToBattle, (globalMultiplier + updatedPlayer.personalMultiplier));
        }

        return this.Battle.camp(updatedPlayer);
      }

      return this.LuckEvents.itemEvent(updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async luckEvent(loadedPlayer, events, globalMultiplier) {
    const updatedPlayer = Object.assign({}, loadedPlayer);
    const { isBlizzardActive } = events;
    try {
      const luckDice = await this.randomBetween(0, 100);
      if (luckDice <= 3 + (updatedPlayer.stats.luk / 4)) {
        return this.LuckEvents.godsEvent(updatedPlayer);
      }

      if (this.MapManager.getTowns().includes(updatedPlayer.map.name)) {
        if (luckDice <= 20 + (updatedPlayer.stats.luk / 4)) {
          return this.LuckEvents.gamblingEvent(updatedPlayer);
        }

        if (luckDice <= 45 + (updatedPlayer.stats.luk / 4)) {
          const mobForQuest = await this.MonsterManager.generateQuestMonster(updatedPlayer);
          return this.LuckEvents.questEvent(updatedPlayer, mobForQuest);
        }
      }

      if (isBlizzardActive && luckDice <= 10 + (updatedPlayer.stats.luk / 4)) {
        const snowFlake = await this.ItemManager.generateSnowflake(updatedPlayer);
        return this.LuckEvents.catchSnowFlake(updatedPlayer, snowFlake);
      }

      if (luckDice >= 65 - (updatedPlayer.stats.luk / 4)) {
        return this.LuckEvents.itemEvent(updatedPlayer);
      }

      return this.LuckEvents.goldEvent(updatedPlayer, (globalMultiplier + updatedPlayer.personalMultiplier));
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Used in command
  async retrieveNewQuest(loadedPlayer, isCommand) {
    const mobForQuest = await this.MonsterManager.generateQuestMonster(loadedPlayer);
    return this.LuckEvents.questEvent(loadedPlayer, mobForQuest, isCommand);
  }

}
module.exports = Events;