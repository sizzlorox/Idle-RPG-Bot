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

  regenItem(selectedPlayer) {
    const regeneratedHelmet = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.helmet, 'helmet');
    selectedPlayer.equipment.helmet = regeneratedHelmet;

    const regeneratedArmor = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.armor, 'armor');
    selectedPlayer.equipment.armor = regeneratedArmor;

    const regeneratedWeapon = this.ItemManager.regenerateItemByName(selectedPlayer.equipment.weapon, 'weapon');
    selectedPlayer.equipment.weapon = regeneratedWeapon;
    return selectedPlayer;
  }

  // Move Events
  moveEvent(selectedPlayer) {
    const mapObj = this.MapManager.moveToRandomMap(selectedPlayer);
    return events.movement.movePlayer(this.discordHook, this.Helper, selectedPlayer, mapObj);
  }

  attackEventPlayerVsPlayer(selectedPlayer, onlinePlayers, multiplier) {
    return this.Database.getSameMapPlayers(selectedPlayer.map.name)
      .then(mappedPlayers => events.battle.pvpPreperation(this.Helper, selectedPlayer, mappedPlayers, onlinePlayers))
      .then(prepResults => prepResults.randomPlayer
        ? this.Battle.newSimulateBattle(selectedPlayer, prepResults.randomPlayer)
        : this.attackEventMob(selectedPlayer, multiplier)
          .catch(err => errorLog.error(err)))
      .then(battleResults => battleResults.attacker
        ? events.battle.pvpResults(this.discordHook, this.Helper, battleResults)
        : battleResults)
      .then((battleResults) => {
        if (battleResults.result) {
          switch (battleResults.result) {
            case enumHelper.battle.outcomes.win:
              return Promise.all([
                events.battle.steal(this.discordHook, this.Helper, battleResults.updatedAttacker, battleResults.updatedDefender, this.InventoryManager)
              ])
                .then(promiseResults => this.Helper.checkHealth(this.MapManager, promiseResults[0].victimPlayer, promiseResults[0].stealingPlayer, this.discordHook)
                  .then(updatedVictim => this.Database.savePlayer(updatedVictim))
                  .then(() => this.Helper.checkExperience(promiseResults[0].stealingPlayer, this.discordHook, 'ToRemoveLater')));

            case enumHelper.battle.outcomes.fled:
              return this.Helper.checkExperience(battleResults.updatedDefender, this.discordHook, 'ToRemoveLater')
                .then(updatedDefender => this.Database.savePlayer(updatedDefender))
                .then(() => this.Helper.checkExperience(battleResults.updatedAttacker, this.discordHook, 'ToRemoveLater'));

            case enumHelper.battle.outcomes.lost:
              return Promise.all([
                events.battle.steal(this.discordHook, this.Helper, battleResults.updatedDefender, battleResults.updatedAttacker, this.InventoryManager)
              ])
                .then(promiseResults => this.Helper.checkExperience(promiseResults[0].stealingPlayer, this.discordHook, 'ToRemoveLater')
                  .then(updatedDefender => this.Database.savePlayer(updatedDefender))
                  .then(() => this.Helper.checkHealth(this.MapManager, promiseResults[0].victimPlayer, promiseResults[0].stealingPlayer, this.discordHook)));
          }
        }

        return battleResults;
      });
  }

  attackEventMob(selectedPlayer, multiplier) {
    return this.MonsterManager.generateNewMonster(selectedPlayer)
      .then(mob => this.Battle.newSimulateBattle(selectedPlayer, mob))
      .then(results => events.battle.pveResults(this.discordHook, this.Helper, this.MapManager, results, multiplier))
      .then((battleResults) => {
        switch (battleResults.result) {
          case enumHelper.battle.outcomes.win:
            return Promise.all([
              events.battle.dropItem(this.discordHook, this.Helper, battleResults.updatedPlayer, battleResults.updatedMob, this.ItemManager, this.InventoryManager)
            ])
              .then(promiseResults => this.Helper.checkExperience(promiseResults[0], this.discordHook, 'ToRemoveLater'));

          case enumHelper.battle.outcomes.fled:
            return this.Helper.checkExperience(battleResults.updatedPlayer, this.discordHook, 'ToRemoveLater');

          case enumHelper.battle.outcomes.lost:
            return this.Helper.checkHealth(this.MapManager, battleResults.updatedPlayer, battleResults.updatedMob, this.discordHook);
        }
      });
  }

  // Item Events
  generateTownItemEvent(selectedPlayer) {
    return this.ItemManager.generateItem(selectedPlayer)
      .then(item => events.town.item(this.discordHook, this.Helper, selectedPlayer, item, this.InventoryManager));
  }

  sellInTown(selectedPlayer) {
    return events.town.sell(this.discordHook, this.Helper, selectedPlayer);
  }

  campEvent(selectedPlayer) {
    return events.camp(this.discordHook, this.Helper, selectedPlayer);
  }

  // Luck Events
  generateGodsEvent(selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = this.Helper.randomBetween(1, 7);
      switch (luckEvent) {
        case 1:
          return events.luck.gods.hades(this.discordHook, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer));

        case 2:
          return events.luck.gods.zeus(this.discordHook, this.Helper, selectedPlayer)
            .then(updatedPlayer => this.Helper.checkHealth(this.MapManager, updatedPlayer, 'zeus', this.discordHook))
            .then(updatedPlayer => resolve(updatedPlayer));

        case 3:
          return events.luck.gods.aseco(this.discordHook, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer));

        case 4:
          return events.luck.gods.hermes(this.discordHook, this.Helper, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer));

        case 5:
          return events.luck.gods.athena(this.discordHook, this.Helper, selectedPlayer)
            .then(updatedPlayer => this.Helper.checkExperience(updatedPlayer, this.discordHook, 'removeLater'))
            .then(updatedPlayer => resolve(updatedPlayer));

        case 6:
          return this.SpellManager.generateSpell(selectedPlayer)
            .then(spell => events.luck.gods.eris(this.discordHook, this.Helper, selectedPlayer, spell))
            .then(updatedPlayer => resolve(updatedPlayer));

        case 7:
          return events.luck.gods.dionysus(this.discordHook, this.Helper, this.Database, selectedPlayer)
            .then(updatedPlayer => resolve(updatedPlayer));
      }
    });
  }

  generateGoldEvent(selectedPlayer, multiplier) {
    return events.luck.gold(this.discordHook, this.Helper, selectedPlayer, multiplier);
  }

  generateLuckItemEvent(selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = this.Helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 4)) {
        return this.SpellManager.generateSpell(selectedPlayer)
          .then(spell => events.luck.item.spell(this.discordHook, this.Helper, selectedPlayer, spell))
          .then(updatedPlayer => resolve(updatedPlayer));
      } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 4)) {
        return this.ItemManager.generateItem(selectedPlayer)
          .then(item => events.luck.item.item(this.discordHook, this.Helper, selectedPlayer, item, this.InventoryManager))
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      return resolve(selectedPlayer);
    });
  }

  generateGamblingEvent(selectedPlayer) {
    return events.luck.gambling(this.discordHook, this.Helper, selectedPlayer);
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
        this.Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
        return this.isBlizzardActive;
      case 'off':
        if (!this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = false;
        this.Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'It seems that blizzard has ended, you can safely travel to other realms. Do not walk away from the road as evil creatures may wait for you in dark forests!\'\`\`\`');
        return this.isBlizzardActive;
    }
  }

  chanceToCatchSnowflake(selectedPlayer) {
    events.special.snowFlake(this.discordHook, this.Helper, selectedPlayer);
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
