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
  }

  // Move Events
  async moveEvent(selectedPlayer, multiplier) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const mapObj = await this.MapManager.moveToRandomMap(updatedPlayer);
      if (mapObj.map.name === updatedPlayer.map.name || mapObj.map.name === updatedPlayer.previousMap) {
        return await this.MapManager.getTowns().includes(updatedPlayer.map.name)
          ? this.generateQuestEvent(updatedPlayer)
          : this.attackEventMob(updatedPlayer, multiplier);
      }
      updatedPlayer = await events.movement.movePlayer(this.discordHook, this.Database, this.Helper, updatedPlayer, mapObj);

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  attackEventPlayerVsPlayer(selectedPlayer, onlinePlayers, multiplier) {
    return this.Database.getSameMapPlayers(selectedPlayer.map.name)
      .then(mappedPlayers => events.battle.pvpPreperation(this.Helper, selectedPlayer, mappedPlayers, onlinePlayers))
      .then(prepResults => prepResults.randomPlayer
        ? this.Battle.newSimulateBattle(selectedPlayer, prepResults.randomPlayer)
        : this.attackEventMob(selectedPlayer, multiplier)
          .catch(err => errorLog.error(err)))
      .then(battleResults => battleResults.attacker
        ? events.battle.pvpResults(this.discordHook, this.Database, this.Helper, battleResults)
        : battleResults)
      .then((battleResults) => {
        if (battleResults.result) {
          switch (battleResults.result) {
            case enumHelper.battle.outcomes.win:
              return Promise.all([
                events.battle.steal(this.discordHook, this.Database, this.Helper, battleResults.updatedAttacker, battleResults.updatedDefender, this.InventoryManager)
              ])
                .then(promiseResults => this.Helper.checkHealth(this.MapManager, promiseResults[0].victimPlayer, promiseResults[0].stealingPlayer, this.Database, this.discordHook)
                  .then(updatedVictim => this.Database.savePlayer(updatedVictim))
                  .then(() => this.Helper.checkExperience(promiseResults[0].stealingPlayer, this.Database, this.discordHook, 'ToRemoveLater')));

            case enumHelper.battle.outcomes.fled:
              return this.Helper.checkExperience(battleResults.updatedDefender, this.Database, this.discordHook, 'ToRemoveLater')
                .then(updatedDefender => this.Database.savePlayer(updatedDefender))
                .then(() => this.Helper.checkExperience(battleResults.updatedAttacker, this.Database, this.discordHook, 'ToRemoveLater'));

            case enumHelper.battle.outcomes.lost:
              return Promise.all([
                events.battle.steal(this.discordHook, this.Database, this.Helper, battleResults.updatedDefender, battleResults.updatedAttacker, this.InventoryManager)
              ])
                .then(promiseResults => this.Helper.checkExperience(promiseResults[0].stealingPlayer, this.Database, this.discordHook, 'ToRemoveLater')
                  .then(updatedDefender => this.Database.savePlayer(updatedDefender))
                  .then(() => this.Helper.checkHealth(this.MapManager, promiseResults[0].victimPlayer, promiseResults[0].stealingPlayer, this.Database, this.discordHook)));
          }
        }

        return battleResults;
      });
  }

  async attackEventMob(selectedPlayer, multiplier) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const mob = await this.MonsterManager.generateNewMonster(updatedPlayer);
      const simulatedBattle = await this.Battle.newSimulateBattle(updatedPlayer, mob);
      const battleResults = await events.battle.pveResults(this.discordHook, this.Database, this.Helper, this.MapManager, simulatedBattle, multiplier);
      updatedPlayer = battleResults.updatedPlayer;
      switch (battleResults.result) {
        case enumHelper.battle.outcomes.win:
          updatedPlayer = await events.battle.dropItem(this.discordHook, this.Database, this.Helper, updatedPlayer, battleResults.updatedMob, this.ItemManager, this.InventoryManager);
          updatedPlayer = await this.Helper.checkExperience(updatedPlayer, this.Database, this.discordHook);
          return updatedPlayer;

        case enumHelper.battle.outcomes.fled:
          updatedPlayer = await this.Helper.checkExperience(updatedPlayer, this.Database, this.discordHook);
          return updatedPlayer;

        case enumHelper.battle.outcomes.lost:
          updatedPlayer = await this.Helper.checkHealth(this.MapManager, updatedPlayer, battleResults.updatedMob, this.Database, this.discordHook);
          return updatedPlayer;
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Item Events
  async generateTownItemEvent(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const item = await this.ItemManager.generateItem(updatedPlayer);
      updatedPlayer = await events.town.item(this.discordHook, this.Database, this.Helper, updatedPlayer, item, this.InventoryManager);

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  sellInTown(selectedPlayer) {
    return events.town.sell(this.discordHook, this.Database, this.Helper, selectedPlayer);
  }

  async campEvent(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      updatedPlayer = await events.camp(this.discordHook, this.Database, this.Helper, updatedPlayer);

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateQuestEvent(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const mob = await this.MonsterManager.generateQuestMonster(updatedPlayer);
      updatedPlayer = await events.town.quest(this.discordHook, this.Database, this.Helper, updatedPlayer, mob);

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  // Luck Events
  generateGodsEvent(selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = this.Helper.randomBetween(1, 7);
      switch (luckEvent) {
        case 1:
          return events.luck.gods.hades(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 2:
          return events.luck.gods.zeus(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => this.Helper.checkHealth(this.MapManager, updatedPlayer, 'zeus', this.Database, this.discordHook))
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 3:
          return events.luck.gods.aseco(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 4:
          return events.luck.gods.hermes(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 5:
          return events.luck.gods.athena(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => this.Helper.checkExperience(updatedPlayer, this.Database, this.discordHook, 'removeLater'))
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 6:
          return this.SpellManager.generateSpell(selectedPlayer)
            .then(spell => events.luck.gods.eris(this.discordHook, this.Database, this.Helper, selectedPlayer, spell))
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);

        case 7:
          return events.luck.gods.dionysus(this.discordHook, this.Database, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer))
            .catch(err => console.log);
      }
    });
  }

  async generateGoldEvent(selectedPlayer, multiplier) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      updatedPlayer = await events.luck.gold(this.discordHook, this.Database, this.Helper, updatedPlayer, multiplier);

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateLuckItemEvent(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const luckItemDice = await this.Helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (updatedPlayer.stats.luk / 4)) {
        const spell = await this.SpellManager.generateSpell(updatedPlayer);
        updatedPlayer = await events.luck.item.spell(this.discordHook, this.Database, this.Helper, updatedPlayer, spell);

        return updatedPlayer;
      } else if (luckItemDice <= 30 + (updatedPlayer.stats.luk / 4)) {
        const item = await this.ItemManager.generateItem(updatedPlayer);
        updatedPlayer = await events.luck.item.item(this.discordHook, this.Database, this.Helper, updatedPlayer, item, this.InventoryManager);

        return updatedPlayer;
      }

      return updatedPlayer;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateGamblingEvent(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      updatedPlayer = await events.luck.gambling(this.discordHook, this.Database, this.Helper, updatedPlayer);

      return updatedPlayer;
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

  async chanceToCatchSnowflake(selectedPlayer) {
    let updatedPlayer = Object.assign({}, selectedPlayer);
    try {
      const snowFlake = await this.ItemManager.generateSnowflake(updatedPlayer);
      updatedPlayer = await events.special.snowFlake(this.discordHook, this.Database, this.Helper, selectedPlayer, snowFlake);

      return updatedPlayer;
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
