const { errorLog } = require('../../../../utils/logger');
const enumHelper = require('../../../../utils/enumHelper');
const Town = require('./Town');
const Battle = require('./Battle');
const Monster = require('../../../../game/utils/Monster');
const Item = require('../../../../game/utils/Item');
const Inventory = require('../../../../game/utils/Inventory');

class Events {

  constructor(params) {
    const { Helper, Map, Database, config } = params;
    this.config = config;
    this.Helper = Helper;
    this.MapManager = Map;
    this.Database = Database;
    this.MonsterManager = new Monster(this.Helper);
    this.ItemManager = new Item(this.Helper);
    this.InventoryManager = new Inventory();
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
  }

  async moveEvent(playerObj) {
    const updatedPlayer = Object.assign({}, playerObj);
    const eventMsg = [];
    const pmMsg = [];
    try {
      const mapObj = await this.MapManager.moveToRandomMap(updatedPlayer);
      updatedPlayer.previousMap = updatedPlayer.map.name;
      updatedPlayer.map = mapObj.map;
      updatedPlayer.travelled++;
      updatedPlayer.events++;
      eventMsg.push(`${this.Helper.generatePlayerName(updatedPlayer)} decided to head \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\` and arrived in \`${mapObj.map.name}\`.`);
      const eventLog = `Travelled ${mapObj.direction} from ${updatedPlayer.previousMap} and arrived in ${mapObj.map.name}`;
      pmMsg.push(eventLog);
      await this.Helper.logEvent(updatedPlayer, this.Database, eventLog, enumHelper.logTypes.move);

      return {
        type: 'movement',
        updatedPlayer,
        msg: eventMsg,
        pm: pmMsg
      };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async attackEvent(loadedPlayer, onlinePlayers) {
    const updatedPlayer = Object.assign({}, loadedPlayer);
    try {
      const luckDice = await this.Helper.randomBetween(0, 100);
      if (this.MapManager.getTowns().includes(updatedPlayer.map.name) && luckDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const townSellResults = await this.TownEvents.sell(updatedPlayer);
        const townItemResults = await this.TownEvents.generateItemEvent(townSellResults.updatedPlayer);

        return {
          type: 'actions',
          updatedPlayer: townItemResults.updatedPlayer,
          msg: townSellResults.msg.push(townItemResults.msg),
          pm: townSellResults.pmMsg.push(townItemResults.pmMsg)
        };
      }

      if (!this.MapManager.getTowns().includes(updatedPlayer.map.name)) {
        if (luckDice >= (95 - (updatedPlayer.stats.luk / 4)) && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          const playerToBattle = this.Battle.findPlayerToBattle(updatedPlayer, onlinePlayers);
          return this.Battle.playerVsPlayer(updatedPlayer, playerToBattle);
        }

        if (updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
          return await this.Battle.playerVsMob(updatedPlayer, mobToBattle, (this.config.multiplier + updatedPlayer.personalMultiplier));
        }

        return await this.Battle.camp(updatedPlayer);
      }

      // return this.Event.generateLuckItemEvent(updatedPlayer);
      return await this.TownEvents.generateItemEvent(updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

}
module.exports = Events;