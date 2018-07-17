const { errorLog } = require('../../../../utils/logger');
const enumHelper = require('../../../../utils/enumHelper');
const Town = require('./Town');
const Battle = require('./Battle');
const Luck = require('./Luck');
const Monster = require('../../../../game/utils/Monster');
const Spell = require('../../../../game/utils/Spell');
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
    this.SpellManager = new Spell(this.Helper);
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
      console.log('move event');
      await eventMsg.push(`${this.Helper.generatePlayerName(updatedPlayer)} decided to head \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\` and arrived in \`${mapObj.map.name}\`.`);
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

  async attackEvent(loadedPlayer, onlinePlayers) {
    const updatedPlayer = Object.assign({}, loadedPlayer);
    try {
      const luckDice = await this.Helper.randomBetween(0, 100);
      if (this.MapManager.getTowns().includes(updatedPlayer.map.name) && luckDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const townSellResults = await this.TownEvents.sell(updatedPlayer);
        const townItemResults = await this.TownEvents.generateItemEvent(townSellResults.updatedPlayer);
        console.log('town item event');

        return {
          type: 'actions',
          updatedPlayer: townItemResults.updatedPlayer,
          msg: townSellResults.msg.push(townItemResults.msg),
          pm: townSellResults.pm.push(townItemResults.pm)
        };
      }

      if (!this.MapManager.getTowns().includes(updatedPlayer.map.name)) {
        if (luckDice >= (95 - (updatedPlayer.stats.luk / 4)) && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          if (onlinePlayers.length <= 1) {
            const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
            console.log('pve event');
            return await this.Battle.playerVsMob(updatedPlayer, mobToBattle, (this.config.multiplier + updatedPlayer.personalMultiplier));
          }
          const playerToBattle = await this.Battle.findPlayerToBattle(updatedPlayer, onlinePlayers);
          if (Object.keys(playerToBattle).length === 0) {
            const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
            console.log('pve event from empty pvp');
            return await this.Battle.playerVsMob(updatedPlayer, mobToBattle, (this.config.multiplier + updatedPlayer.personalMultiplier));
          }

          console.log('pvp event');
          return await this.Battle.playerVsPlayer(updatedPlayer, playerToBattle);
        }

        if (updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          const mobToBattle = await this.MonsterManager.generateMonster(updatedPlayer);
          console.log('pve event');
          return await this.Battle.playerVsMob(updatedPlayer, mobToBattle, (this.config.multiplier + updatedPlayer.personalMultiplier));
        }

        console.log('camp event');
        return await this.Battle.camp(updatedPlayer);
      }

      console.log('attack item event');
      return await this.LuckEvents.itemEvent(updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async luckEvent(loadedPlayer) {
    const updatedPlayer = Object.assign({}, loadedPlayer);
    try {
      const luckDice = await this.Helper.randomBetween(0, 100);
      if (luckDice <= 5 + (updatedPlayer.stats.luk / 4)) {
        console.log('gods event');
        return this.LuckEvents.godsEvent(updatedPlayer);
      }

      if (this.MapManager.getTowns().includes(updatedPlayer.map.name)) {
        if (luckDice <= 20 + (updatedPlayer.stats.luk / 4)) {
          console.log('gamble event');
          return this.LuckEvents.gamblingEvent(updatedPlayer);
        }

        if (luckDice <= 45 + (updatedPlayer.stats.luk / 4)) {
          console.log('quest event');
          const mobForQuest = await this.MonsterManager.generateMonster(updatedPlayer);
          return this.LuckEvents.questEvent(updatedPlayer, mobForQuest);
        }
      }

      // TODO: change to save event status to this.config
      // if (this.Event.isBlizzardActive && luckDice <= 10 + (updatedPlayer.stats.luk / 4)) {
      //   return this.Event.chanceToCatchSnowflake(updatedPlayer);
      // }

      if (luckDice >= 65 - (updatedPlayer.stats.luk / 4)) {
        console.log('luck item event');
        return await this.LuckEvents.itemEvent(updatedPlayer);
      }

      return this.LuckEvents.goldEvent(updatedPlayer, (this.config.multiplier + updatedPlayer.personalMultiplier));
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Used in command
  retrieveNewQuest(loadedPlayer) {
    return this.LuckEvents.questEvent(loadedPlayer);
  }

}
module.exports = Events;