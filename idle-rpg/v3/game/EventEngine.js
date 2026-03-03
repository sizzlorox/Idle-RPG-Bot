const enumHelper = require('../../utils/enumHelper');
const { errorLog } = require('../../utils/logger');
const { randomBetween } = require('../utils/helpers');
const { generatePlayerName } = require('../utils/formatters');
const AttackEvent = require('./events/AttackEvent');
const LuckEvent = require('./events/LuckEvent');

class EventEngine {

  constructor({ db, map, monsterGen, itemGen, spellGen, inventory, player, battle }) {
    this.db = db;
    this.map = map;
    this.monsterGen = monsterGen;
    this.itemGen = itemGen;
    this.spellGen = spellGen;
    this.inventory = inventory;
    this.player = player;
    this.battle = battle;
    this.townEvent = new AttackEvent({ db, itemGen, inventory, player });
    this.luck = new LuckEvent({ db, spellGen, itemGen, inventory, player });
  }

  async moveEvent(playerObj) {
    const updatedPlayer = Object.assign({}, playerObj);
    const eventMsg = [];
    const eventLog = [];
    try {
      let mapObj;
      let isQuestMovement = false;

      const questMobName = updatedPlayer.quest && updatedPlayer.quest.questMob && updatedPlayer.quest.questMob.name !== 'None'
        ? updatedPlayer.quest.questMob.name
        : null;

      if (questMobName) {
        const mobBiomes = this.map._mobBiomes.get(questMobName);
        const alreadyInBiome = mobBiomes && mobBiomes.has(updatedPlayer.map.biome.name);
        if (!alreadyInBiome) {
          const nearestMap = this.map.findNearestMapForMob(updatedPlayer.map.coords, questMobName);
          if (nearestMap) {
            mapObj = this.map.moveTowardCoords(updatedPlayer, nearestMap.coords);
            if (mapObj) isQuestMovement = true;
          }
        }
      }

      if (!mapObj) mapObj = await this.map.moveToRandomMap(updatedPlayer);
      if (mapObj.map.name === updatedPlayer.previousMap) return { updatedPlayer };

      updatedPlayer.previousMap = updatedPlayer.map.name;
      updatedPlayer.map = mapObj.map;
      updatedPlayer.travelled++;

      const moveMsg = isQuestMovement
        ? `${generatePlayerName(updatedPlayer)} is hunting \`${questMobName}\` and heads \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\`, arriving in \`${mapObj.map.name}\`.`
        : `${generatePlayerName(updatedPlayer)} decided to head \`${mapObj.direction}\` from \`${updatedPlayer.previousMap}\` and arrived in \`${mapObj.map.name}\`.`;

      eventMsg.push(moveMsg);
      eventLog.push(`Travelled ${mapObj.direction} from ${updatedPlayer.previousMap} and arrived in ${mapObj.map.name}`);
      await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.move);
      return { type: 'movement', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async attackEvent(loadedPlayer, onlinePlayers, globalMultiplier, guildEvents) {
    let updatedPlayer = Object.assign({}, loadedPlayer);
    const isBloodMoonActive = guildEvents && guildEvents.isBloodMoonActive;
    try {
      const luckDice = randomBetween(0, 99);
      const towns = this.map.getTowns();
      if (towns.includes(updatedPlayer.map.name) && luckDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const eventMsg = [];
        const eventLog = [];
        const townSellResults = await this.townEvent.sell(updatedPlayer);
        if (townSellResults.msg) {
          eventMsg.push(townSellResults.msg);
          eventLog.push(townSellResults.pm);
          updatedPlayer = townSellResults.updatedPlayer;
        }
        const townItemResults = await this.townEvent.generateItemEvent(updatedPlayer);
        if (townItemResults.msg) {
          eventMsg.push(townItemResults.msg);
          eventLog.push(townItemResults.pm);
          updatedPlayer = townItemResults.updatedPlayer;
        }
        return eventMsg.length > 0
          ? { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog }
          : { updatedPlayer };
      }

      if (!towns.includes(updatedPlayer.map.name)) {
        if (luckDice >= (95 - (updatedPlayer.stats.luk / 4)) && updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          if (onlinePlayers.length <= 1) {
            const mobToBattle = this.monsterGen.generateMonster(updatedPlayer, guildEvents);
            return this.battle.playerVsMob(updatedPlayer, mobToBattle, globalMultiplier + updatedPlayer.personalMultiplier, isBloodMoonActive);
          }
          const { randomPlayer } = await this.battle.findPlayerToBattle(updatedPlayer, onlinePlayers);
          if (!randomPlayer) {
            const mobToBattle = this.monsterGen.generateMonster(updatedPlayer, guildEvents);
            return this.battle.playerVsMob(updatedPlayer, mobToBattle, globalMultiplier + updatedPlayer.personalMultiplier, isBloodMoonActive);
          }
          return this.battle.playerVsPlayer(updatedPlayer, randomPlayer, globalMultiplier + updatedPlayer.personalMultiplier);
        }
        if (updatedPlayer.health > (100 + (updatedPlayer.level * 5)) / 4) {
          const mobToBattle = this.monsterGen.generateMonster(updatedPlayer, guildEvents);
          return this.battle.playerVsMob(updatedPlayer, mobToBattle, globalMultiplier + updatedPlayer.personalMultiplier, isBloodMoonActive);
        }
        return this.battle.camp(updatedPlayer);
      }

      return this.luck.itemEvent(updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async luckEvent(loadedPlayer, events, globalMultiplier) {
    const updatedPlayer = Object.assign({}, loadedPlayer);
    const { isBlizzardActive } = events || {};
    try {
      const luckDice = randomBetween(0, 99);
      if (luckDice <= 3 + (updatedPlayer.stats.luk / 4)) return this.luck.godsEvent(updatedPlayer);
      if (this.map.getTowns().includes(updatedPlayer.map.name) && updatedPlayer.gold.current >= 18) {
        if (luckDice <= 20 + (updatedPlayer.stats.luk / 4)) return this.luck.gamblingEvent(updatedPlayer);
        if (luckDice <= 45 + (updatedPlayer.stats.luk / 4)) {
          const mobForQuest = this.monsterGen.generateQuestMonster(updatedPlayer);
          return this.luck.questEvent(updatedPlayer, mobForQuest);
        }
      }
      if (isBlizzardActive && luckDice <= 10 + (updatedPlayer.stats.luk / 4)) {
        const snowFlake = this.itemGen.generateSnowflake(updatedPlayer);
        return this.luck.catchSnowFlake(updatedPlayer, snowFlake);
      }
      if (luckDice >= 65 - (updatedPlayer.stats.luk / 4)) return this.luck.itemEvent(updatedPlayer);
      return this.luck.goldEvent(updatedPlayer, globalMultiplier + updatedPlayer.personalMultiplier);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async retrieveNewQuest(loadedPlayer, isCommand) {
    const mobForQuest = this.monsterGen.generateQuestMonster(loadedPlayer);
    return this.luck.questEvent(loadedPlayer, mobForQuest, isCommand);
  }

}

module.exports = EventEngine;
