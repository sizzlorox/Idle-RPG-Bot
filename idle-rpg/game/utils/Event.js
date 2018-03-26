const Helper = require('../../utils/Helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Inventory = require('../utils/Inventory');
const Spell = require('../utils/Spell');
const Map = require('../utils/Map');
const Database = require('../../database/Database');
const events = require('../data/events');
const { errorLog, infoLog } = require('../../utils/logger');

class Event {

  constructor() {
    // Managers
    this.MonsterManager = new Monster();
    this.ItemManager = new Item();
    this.MapManager = new Map();
    this.SpellManager = new Spell();
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
  moveEvent(selectedPlayer, discordHook) {
    const mapObj = this.MapManager.moveToRandomMap(selectedPlayer);
    return events.movement.movePlayer(discordHook, selectedPlayer, mapObj);
  }

  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers, multiplier) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then(mappedPlayers => events.battle.pvpPreperation(selectedPlayer, mappedPlayers, onlinePlayers))
      /**
       * If found an online randomplayer in current map
       * Returns {
       *  randomPlayer
       * }
       * Else
       * Returns an empty object
       */

      .then((prepResults) => {
        return prepResults.randomPlayer
          ? Battle.newSimulateBattle(selectedPlayer, prepResults.randomPlayer)
          : this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
            .catch(err => errorLog.error(err));
      })
      /**
       * If PvP battle was executed (Found an online randomplayer in current map)
       * Returns {
       *  attacker,
       *  defender,
       *  attackerDamage,
       *  defenderDamage
       * }
       * Else
       * Returns selectedPlayer from this.attackEventMob method
       */

      .then((battleResults) => {
        return battleResults.attacker
          ? events.battle.pvpResults(discordHook, battleResults)
          : battleResults;
      })
      /**
       * If PvP battle was executed (Found an online randomplayer in current map)
       * Returns {
       *  result,
       *  updatedAttacker,
       *  updatedDefender
       * }
       * Else
       * Returns selectedPlayer from this.attackEventMob method
       */

      .then((battleResults) => {
        if (battleResults.result) {
          switch (battleResults.result) {
            case enumHelper.battle.outcomes.win:
              return this.stealPlayerItem(discordHook, twitchBot, battleResults.updatedAttacker, battleResults.updatedDefender)
                .then(stealResult => Helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook)
                  .then((updatedVictim) => {
                    Database.savePlayer(updatedVictim);
                    return Helper.checkExperience(stealResult.stealingPlayer, discordHook, twitchBot);
                  }));

            case enumHelper.battle.outcomes.fled:
              return Helper.checkExperience(battleResults.updatedDefender, discordHook, twitchBot)
                .then((updatedDefender) => {
                  Database.savePlayer(updatedDefender);
                  return Helper.checkExperience(battleResults.updatedAttacker, discordHook, twitchBot);
                });

            case enumHelper.battle.outcomes.lost:
              return this.stealPlayerItem(discordHook, twitchBot, battleResults.updatedDefender, battleResults.updatedAttacker)
                .then(stealResult => Helper.checkExperience(stealResult.stealingPlayer, discordHook, twitchBot)
                  .then((updatedDefender) => {
                    Database.savePlayer(updatedDefender);
                    return Helper.checkHealth(this.MapClass, stealResult.victimPlayer, updatedDefender, discordHook);
                  }));
          }
        }

        return battleResults;
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    selectedPlayer.map = this.MapClass.getMapByName(selectedPlayer.map.name);
    return this.MonsterManager.generateNewMonster(selectedPlayer)
      .then(mob => Battle.newSimulateBattle(selectedPlayer, mob))
      .then(results => events.battle.pveResults(discordHook, this.MapClass, results, multiplier))
      .then((battleResults) => {
        switch (battleResults.result) {
          case enumHelper.battle.outcomes.win:
            return events.battle.dropItem(discordHook, battleResults.updatedPlayer, battleResults.updatedMob, this.ItemManager, this.InventoryManager)
              .then(updatedPlayer => Helper.checkExperience(updatedPlayer, discordHook, twitchBot));

          case enumHelper.battle.outcomes.fled:
            return Helper.checkExperience(battleResults.updatedPlayer, discordHook, twitchBot);

          case enumHelper.battle.outcomes.lost:
            return Helper.checkHealth(this.MapClass, battleResults.updatedPlayer, battleResults.updatedMob, discordHook);
        }
      });
  }

  // Item Events
  generateTownItemEvent(discordHook, selectedPlayer) {
    return this.ItemManager.generateItem(selectedPlayer)
      .then(item => events.town.item(discordHook, selectedPlayer, item, this.InventoryManager));
  }

  sellInTown(discordHook, selectedPlayer) {
    return events.town.sell(discordHook, selectedPlayer);
  }

  campEvent(discordHook, selectedPlayer) {
    return events.camp(discordHook, selectedPlayer);
  }

  stealPlayerItem(discordHook, twitchBot, stealingPlayer, victimPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      console.log(`>>>>>>>>>>>>>>>>>>>> CHANCE : ${chance} - LUCKSTEALCHANCE : ${luckStealChance} - BOUNTYLUCK : ${90 - canSteal}`);
      if (luckStealChance > (90 - canSteal)) {
        const luckItem = Helper.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (!['Nothing', 'Fist'].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          events.utils.stealEquip(this.InventoryManager, discordHook, stealingPlayer, victimPlayer, itemKeys[luckItem]);
        }
      } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
        const goldStolen = Math.round(victimPlayer.gold.current / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold.current += goldStolen;
          stealingPlayer.gold.total += goldStolen;
          stealingPlayer.gold.stole += goldStolen;

          victimPlayer.gold.current -= goldStolen;
          victimPlayer.gold.stolen += goldStolen;

          const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
          const eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;
          const otherPlayerLog = `${stealingPlayer.name} stole ${goldStolen} gold from you`;

          Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg)
            .then(() => Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true))
            .then(() => Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true));
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
        }
      }

      return resolve({ stealingPlayer, victimPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    const luckEvent = Helper.randomBetween(1, 6);
    switch (luckEvent) {
      case 1:
        return events.luck.gods.hades(discordHook, selectedPlayer);

      case 2:
        return events.luck.gods.zeus(discordHook, selectedPlayer)
          .then(updatedPlayer => Helper.checkHealth(this.MapClass, updatedPlayer, discordHook));

      case 3:
        return events.luck.gods.aseco(discordHook, selectedPlayer);

      case 4:
        return events.luck.gods.hermes(discordHook, selectedPlayer);

      case 5:
        return events.luck.gods.athena(discordHook, selectedPlayer);

      case 6:
        return this.SpellManager.generateSpell(selectedPlayer)
          .then(spell => events.gods.eris(discordHook, selectedPlayer, spell));
    }
  }

  generateGoldEvent(discordHook, selectedPlayer, multiplier) {
    return events.luck.gold(discordHook, selectedPlayer, multiplier);
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    const luckItemDice = Helper.randomBetween(0, 100);

    if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 4)) {
      return this.SpellManager.generateSpell(selectedPlayer)
        .then(spell => events.luck.item.spell(discordHook, selectedPlayer, spell));
    } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 4)) {
      return this.ItemManager.generateItem(selectedPlayer)
        .then(item => events.luck.item.item(discordHook, selectedPlayer, item, this.InventoryManager));
    }
  }

  generateGamblingEvent(discordHook, selectedPlayer) {
    return events.luck.gambling(discordHook, selectedPlayer);
  }

  /**
   * EVENT FUNCTIONS
   */
  blizzardSwitch(discordHook, blizzardSwitch) {
    switch (blizzardSwitch) {
      case 'on':
        if (this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = true;
        Helper.sendMessage(discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Heroes, sit near a fireplace at your home or take a beer with your friends at the inn. It\`s better to stay in cozy place as lots of heroes are in the midst of a violent snowstorm across the lands fighting mighty Yetis!\'\`\`\`');
        return this.isBlizzardActive;
      case 'off':
        if (!this.isBlizzardActive) {
          return this.isBlizzardActive;
        }

        this.isBlizzardActive = false;
        Helper.sendMessage(discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'It seems that blizzard has ended, you can safely travel to other realms. Do not walk away from the road as evil creatures may wait for you in dark forests!\'\`\`\`');
        return this.isBlizzardActive;
    }
  }

  chanceToCatchSnowflake(discordHook, selectedPlayer) {
    events.special.snowFlake(discordHook, selectedPlayer);
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
module.exports = new Event();