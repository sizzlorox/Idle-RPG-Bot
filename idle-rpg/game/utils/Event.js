const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Inventory = require('../utils/Inventory');
const Spell = require('../utils/Spell');
const events = require('../data/events');
const { errorLog } = require('../../utils/logger');
const Map = require('../utils/Map');

class Event {

  constructor(Database, Helper, discordHook) {
    this.Helper = Helper;
    this.Database = Database;
    this.discordHook = discordHook;
    this.Battle = new Battle(Helper);

    // Managers
    this.MonsterManager = new Monster(Helper);
    this.ItemManager = new Item(Helper);
    this.MapManager = new Map(Helper);
    this.SpellManager = new Spell(Helper);
    this.InventoryManager = new Inventory();

    // Events
    this.isBlizzardActive = false;

    // Params
    this.params = {
      hook: this.discordHook,
      db: this.Database,
      helper: this.Helper
    };
  }

  // Move Events
  async moveEvent(updatedPlayer, multiplier) {
    try {
      const mapObj = await this.MapManager.moveToRandomMap(updatedPlayer);
      // if (mapObj.map.name === updatedPlayer.map.name || mapObj.map.name === updatedPlayer.previousMap) {
      //   return await this.MapManager.getTowns().includes(updatedPlayer.map.name)
      //     ? this.generateQuestEvent(updatedPlayer)
      //     : this.attackEventMob(updatedPlayer, multiplier);
      // }
      return await events.movement.movePlayer(this.params, updatedPlayer, mapObj);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async attackEventPlayerVsPlayer(updatedPlayer, onlinePlayers, multiplier) {
    try {
      const mappedPlayers = await this.Database.getSameMapPlayers(updatedPlayer.map.name);
      const prepResults = await events.battle.pvpPreperation(this.params, updatedPlayer, mappedPlayers, onlinePlayers);
      const battleResults = prepResults.randomPlayer
        ? await this.Battle.newSimulateBattle(updatedPlayer, prepResults.randomPlayer)
        : await this.attackEventMob(updatedPlayer, multiplier);
      if (!battleResults.attacker) {
        return updatedPlayer;
      }
      const results = await events.battle.pvpResults(this.params, battleResults);
      if (!results.result) {
        return updatedPlayer;
      }
      switch (results.result) {
        case enumHelper.battle.outcomes.win:
          const winResults = await events.battle.steal(this.params, results.updatedAttacker, results.updatedDefender, this.InventoryManager);
          const updatedVictim = await this.Helper.checkHealth(this.params, this.MapManager, winResults.victimPlayer, winResults.stealingPlayer);
          await this.Database.savePlayer(updatedVictim);
          return await this.Helper.checkExperience(this.params, winResults.stealingPlayer);

        case enumHelper.battle.outcomes.fled:
          const fledUpdatedDefender = await this.Helper.checkExperience(this.params, results.updatedDefender);
          await this.Database.savePlayer(fledUpdatedDefender);
          return await this.Helper.checkExperience(this.params, results.updatedAttacker);

        case enumHelper.battle.outcomes.lost:
          const loseResults = await events.battle.steal(this.params, results.updatedDefender, results.updatedAttacker, this.InventoryManager);
          const lostUpdatedDefender = await this.Helper.checkExperience(this.params, loseResults.stealingPlayer);
          await this.Database.savePlayer(lostUpdatedDefender);
          return await this.Helper.checkHealth(this.params, this.MapManager, loseResults.victimPlayer, loseResults.stealingPlayer);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async attackEventMob(updatedPlayer, multiplier) {
    try {
      const mob = await this.MonsterManager.generateMonster(updatedPlayer);
      const simulatedBattle = await this.Battle.newSimulateBattle(updatedPlayer, mob);
      const battleResults = await events.battle.pveResults(this.params, simulatedBattle, multiplier);
      updatedPlayer = battleResults.updatedPlayer;
      switch (battleResults.result) {
        case enumHelper.battle.outcomes.win:
          updatedPlayer = await events.battle.dropItem(this.params, updatedPlayer, battleResults.updatedMob, this.ItemManager, this.InventoryManager);
          return await this.Helper.checkExperience(this.params, updatedPlayer);

        case enumHelper.battle.outcomes.fled:
          return await this.Helper.checkExperience(this.params, updatedPlayer);

        case enumHelper.battle.outcomes.lost:
          return await this.Helper.checkHealth(this.params, this.MapManager, updatedPlayer, battleResults.updatedMob);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Item Events
  async generateTownItemEvent(updatedPlayer) {
    try {
      const item = await this.ItemManager.generateItem(updatedPlayer);
      return await events.town.item(this.params, updatedPlayer, item, this.InventoryManager);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async sellInTown(updatedPlayer) {
    try {
      return await events.town.sell(this.params, updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async campEvent(updatedPlayer) {
    try {
      return await events.camp(this.params, updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateQuestEvent(updatedPlayer) {
    try {
      const mob = await this.MonsterManager.generateQuestMonster(updatedPlayer);
      return await events.town.quest(this.params, updatedPlayer, mob);
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Luck Events
  async generateGodsEvent(updatedPlayer) {
    try {
      const luckEvent = await this.Helper.randomBetween(1, 7);
      switch (luckEvent) {
        case 1:
          return await events.luck.gods.hades(this.params, updatedPlayer);

        case 2:
          return await events.luck.gods.zeus(this.params, updatedPlayer);

        case 3:
          return await events.luck.gods.aseco(this.params, updatedPlayer);

        case 4:
          return await events.luck.gods.hermes(this.params, updatedPlayer);

        case 5:
          updatedPlayer = await events.luck.gods.athena(this.params, updatedPlayer);
          return await this.Helper.checkExperience(this.params, updatedPlayer);

        case 6:
          const spell = await this.SpellManager.generateSpell(updatedPlayer);
          return await events.luck.gods.eris(this.params, updatedPlayer, spell);

        case 7:
          return await events.luck.gods.dionysus(this.params, updatedPlayer);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateGoldEvent(updatedPlayer, multiplier) {
    try {
      return await events.luck.gold(this.params, updatedPlayer, multiplier);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateLuckItemEvent(updatedPlayer) {
    try {
      const luckItemDice = await this.Helper.randomBetween(0, 100);
      if (luckItemDice <= 15 + (updatedPlayer.stats.luk / 4)) {
        const spell = await this.SpellManager.generateSpell(updatedPlayer);
        return await events.luck.item.spell(this.params, updatedPlayer, spell);
      } else if (luckItemDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const item = await this.ItemManager.generateItem(updatedPlayer);
        return await events.luck.item.item(this.params, updatedPlayer, item, this.InventoryManager);
      }

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateGamblingEvent(updatedPlayer) {
    try {
      return await events.luck.gambling(this.params, updatedPlayer);
    } catch (err) {
      errorLog.error(err);
    }
  }

  /**
   * EVENT FUNCTIONS
   */
  blizzardSwitch(blizzardSwitch) {
    switch (blizzardSwitch) {
      case 'on':
        if (this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = true;
        this.Helper.sendMessage(this.discordHook, undefined, false, '\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
        return this.isBlizzardActive;
      case 'off':
        if (!this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = false;
        this.Helper.sendMessage(this.discordHook, undefined, false, '\`\`\`python\n\'It seems that blizzard has ended, you can safely travel to other realms. Do not walk away from the road as evil creatures may wait for you in dark forests!\'\`\`\`');
        return this.isBlizzardActive;
    }
  }

  blizzardRandom() {
    if (!this.isBlizzardActive) {
      this.isBlizzardActive = true;
      setTimeout(() => {
        this.isBlizzardActive = false;
      }, this.Helper.randomBetween(7200000, 72000000)); // 2-20hrs
    }
  }

  async chanceToCatchSnowflake(updatedPlayer) {
    try {
      const snowFlake = await this.ItemManager.generateSnowflake(updatedPlayer);
      return await events.special.snowFlake(this.params, updatedPlayer, snowFlake);
    } catch (err) {
      errorLog.error(err);
    }
  }

  /**
   * GETTER SETTERS
   */
  get MonsterClass() {
    return this.MonsterManager;
  }

  get ItemClass() {
    return this.ItemManager;
  }

  get MapClass() {
    return this.MapManager;
  }

  get SpellClass() {
    return this.SpellManager;
  }

}
module.exports = Event;
