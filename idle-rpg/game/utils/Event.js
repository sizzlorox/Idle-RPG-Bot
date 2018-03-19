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
const { pvpLevelRestriction } = require('../../../settings');
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
    return new Promise((resolve) => {
      // TODO: Remove later after release
      if (!selectedPlayer.map) {
        selectedPlayer.map = Map.getMapByCoords([3, 5]);
      }

      const { map, direction } = this.MapManager.moveToRandomMap(selectedPlayer);
      selectedPlayer.map = map;
      const eventMsg = `${Helper.generatePlayerName(selectedPlayer)} decided to head \`${direction}\` and arrived in \`${map.name}\` DEBUG:[ ${map.coords.toString()} ].`;
      const eventLog = `Moved ${direction} and arrived in ${map.name}`;

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return resolve(selectedPlayer);
    });
  }

  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers, multiplier) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then((mappedPlayers) => {
        if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
          const sameMapPlayers = mappedPlayers.filter(player => player.name !== selectedPlayer.name
            && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
            && player.level <= selectedPlayer.level + pvpLevelRestriction && player.level >= selectedPlayer.level - pvpLevelRestriction);

          if (sameMapPlayers.length > 0 && selectedPlayer.health > (100 + (selectedPlayer.level * 5)) / 4) {
            const randomPlayerIndex = Helper.randomBetween(0, sameMapPlayers.length - 1);
            let randomPlayer = sameMapPlayers[randomPlayerIndex];

            if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name && randomPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
              const randomPlayerMaxHealth = 100 + (randomPlayer.level * 5);
              const playerMaxHealth = 100 + (selectedPlayer.level * 5);
              return Battle.newSimulateBattle(
                selectedPlayer,
                randomPlayer
              ).then(({
                attacker, defender, attackerDamage, defenderDamage
              }) => {
                selectedPlayer = attacker;
                randomPlayer = defender;
                const battleResult = `Battle Results:
                  ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                  ${Helper.generatePlayerName(selectedPlayer, true)} has ${selectedPlayer.health} HP left.
                  ${Helper.generatePlayerName(randomPlayer, true)} 's \`${randomPlayer.equipment.weapon.name}\` did ${defenderDamage} damage.
                  ${Helper.generatePlayerName(randomPlayer, true)} has ${randomPlayer.health} HP left.`;

                Helper.printEventDebug(battleResult);

                if (selectedPlayer.health <= 0) {
                  const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(randomPlayer, true)} just killed ${Helper.generatePlayerName(selectedPlayer, true)} with ${Helper.generateGenderString(randomPlayer, 'his')} \`${randomPlayer.equipment.weapon.name}\`!
    ${Helper.generatePlayerName(selectedPlayer, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;

                  const eventLog = `Died to ${defender.name} in ${selectedPlayer.map.name}.`;
                  const otherPlayerLog = `Killed ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                    .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true))
                    .then(() => Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true));
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
                  selectedPlayer.battles.lost++;
                  randomPlayer.battles.won++;
                  randomPlayer.experience += Math.floor(attackerDamage / 8);

                  return this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer)
                    .then((stealResult) => {
                      Helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                      return Database.savePlayer(stealResult.stealingPlayer)
                        .then(() => {
                          return stealResult.victimPlayer;
                        });
                    })
                    .catch(err => errorLog.error(err));
                }

                if (defender.health > 0 && selectedPlayer.health > 0) {
                  const eventMsg = attackerDamage > defenderDamage
                    ? `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} attacked ${Helper.generatePlayerName(randomPlayer, true)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${Helper.generateGenderString(randomPlayer, 'he')} managed to get away!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`
                    : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} attacked ${Helper.generatePlayerName(randomPlayer, true)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${Helper.generatePlayerName(randomPlayer, true)} was too strong!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                  // TODO: Find a way of making this visible some other method
                  // eventMsg = eventMsg.concat(battleResult);
                  const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and dealt ${attackerDamage} damage!`;
                  const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and received ${attackerDamage} damage!`;

                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                    .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true))
                    .then(() => Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true));
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
                  selectedPlayer.experience += Math.floor(defenderDamage / 8);
                  randomPlayer.experience += Math.floor(attackerDamage / 8);

                  return selectedPlayer;
                }

                const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just killed \`${randomPlayer.name}\` with ${Helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\`!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                const eventLog = `Killed ${randomPlayer.name} in ${selectedPlayer.map.name}.`;
                const otherPlayerLog = `Died to ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true))
                  .then(() => Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
                randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
                randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
                selectedPlayer.battles.won++;
                randomPlayer.battles.lost++;
                selectedPlayer.experience += Math.floor(defenderDamage / 8);

                return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer)
                  .then((stealResult) => {
                    Helper.checkHealth(this.MapClass, stealResult.victimPlayer, stealResult.stealingPlayer, discordHook);
                    return Database.savePlayer(stealResult.victimPlayer)
                      .then(() => {
                        return stealResult.stealingPlayer;
                      });
                  })
                  .catch(err => errorLog.error(err));
              });
            }
          }
        }

        return this.attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier)
          .catch(err => errorLog.error(err));
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      selectedPlayer.map = this.MapClass.getMapByName(selectedPlayer.map.name);
      return this.MonsterManager.generateNewMonster(selectedPlayer)
        .then((mob) => {
          const mobMaxHealth = mob.health;
          const playerMaxHealth = 100 + (selectedPlayer.level * 5);
          return Battle.newSimulateBattle(selectedPlayer, mob)
            .then(({
              attacker, defender, attackerDamage, defenderDamage
            }) => {
              selectedPlayer = attacker;
              const battleResult = `Battle Results:
                ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                ${Helper.generatePlayerName(selectedPlayer, true)} has ${selectedPlayer.health} / ${playerMaxHealth} HP left.
                ${defender.name}'s \`${defender.equipment.weapon.name}\` did ${defenderDamage} damage.
                ${defender.name} has ${defender.health} / ${mobMaxHealth} HP left.`;

              Helper.printEventDebug(battleResult);

              if (selectedPlayer.health <= 0) {
                const eventMsg = `[\`${selectedPlayer.map.name}\`] \`${mob.name}\`'s \`${defender.equipment.weapon.name}\` just killed ${Helper.generatePlayerName(selectedPlayer, true)}!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = `${mob.name}'s ${defender.equipment.weapon.name} just killed you in ${selectedPlayer.map.name}!`;
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                Helper.checkHealth(this.MapClass, selectedPlayer, mob, discordHook);
                selectedPlayer.battles.lost++;

                return resolve(selectedPlayer);
              }

              if (defender.health > 0 && selectedPlayer.health > 0) {
                const expGain = Math.floor((defender.experience * multiplier) / 2);
                const eventMsg = attackerDamage > defenderDamage
                  ? `[\`${selectedPlayer.map.name}\`] \`${mob.name}\` just fled from ${Helper.generatePlayerName(selectedPlayer, true)}!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`
                  : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just fled from \`${mob.name}\`!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = attackerDamage > defenderDamage
                  ? `${mob.name} fled from you in ${selectedPlayer.map.name}!`
                  : `You fled from ${mob.name} in ${selectedPlayer.map.name}!`;

                selectedPlayer.experience += expGain;
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                Helper.checkExperience(selectedPlayer, discordHook);

                return resolve(selectedPlayer);
              }
              const goldGain = defender.gold.current * multiplier;

              let eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` just killed \`${mob.name}\`!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained \`${defender.experience * multiplier}\` exp and \`${goldGain}\` gold! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;
              const eventLog = `Killed ${mob.name} with your ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map.name}.`;

              if (goldGain === 0) {
                eventMsg = eventMsg.replace(` and \`${goldGain}\` gold`, '');
              }

              selectedPlayer.experience += defender.experience * multiplier;
              selectedPlayer.gold.current += goldGain;
              selectedPlayer.gold.total += goldGain;
              selectedPlayer.kills.mob++;
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
              selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
              Helper.checkExperience(selectedPlayer, discordHook);
              selectedPlayer.battles.won++;

              return this.generateDropItemEvent(discordHook, 'twitch', selectedPlayer, mob)
                .then((updatedPlayer) => {
                  selectedPlayer = updatedPlayer;
                  return resolve(selectedPlayer);
                });
            });
        });
    });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = Helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 4)) {
        return this.ItemManager.generateItem(selectedPlayer, mob)
          .then((item) => {
            events.utils.dropItem(this.InventoryManager, selectedPlayer, item);

            let eventMsg;
            if (!item.isXmasEvent) {
              eventMsg = `${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\``;
            } else {
              eventMsg = `**${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob.name}`;

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

            return resolve(selectedPlayer);
          });
      }

      return resolve(selectedPlayer);
    });
  }

  // Item Events
  generateTownItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      return this.ItemManager.generateItem(selectedPlayer)
        .then((item) => {
          const itemCost = Math.round(item.gold);

          if (selectedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
            return resolve(selectedPlayer);
          }

          if (item.position !== enumHelper.inventory.position) {
            selectedPlayer.equipment[item.position].position = enumHelper.equipment.types[item.position].position;
            if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]) > Helper.calculateItemRating(selectedPlayer, item)) {
              return resolve(selectedPlayer);
            }
          }

          infoLog.info({ event: 'TOOOOOOWN', item });
          events.utils.townItem(this.InventoryManager, discordHook, selectedPlayer, item, itemCost);

          return resolve(selectedPlayer);
        });
    });
  }

  sellInTown(discordHook, twitchBot, selectedPlayer) {
    if (selectedPlayer.inventory.equipment.length > 0) {
      let profit = 0;
      Helper.printEventDebug(selectedPlayer.inventory.equipment);
      infoLog.log({ sell: 'SELLL', equip: selectedPlayer.inventory.equipment });
      selectedPlayer.inventory.equipment.forEach((equipment) => {
        infoLog.log(equipment);
        Helper.printEventDebug(`Equipment selling: ${equipment.name}`);
        profit += Number(equipment.gold);
      });
      selectedPlayer.inventory.equipment.length = 0;
      profit = Math.floor(profit);
      selectedPlayer.gold.current += profit;
      selectedPlayer.gold.total += profit;

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just sold what they found adventuring for ${profit} gold!`;
      const eventLog = `Made ${profit} gold selling what you found adventuring`;

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
    }

    return selectedPlayer;
  }

  campEvent(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      selectedPlayer = Helper.passiveRegen(selectedPlayer, ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.end / 2), ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.int / 2));
      // TODO: Make more camp event messages to be selected randomly
      const { eventMsg, eventLog } = events.messages.randomCampEventMessage(selectedPlayer);
      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return resolve(selectedPlayer);
    });
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
    return new Promise((resolve) => {
      const luckEvent = Helper.randomBetween(1, 6);
      switch (luckEvent) {
        case 1:
          const luckExpAmount = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          const eventMsgHades = `Hades unleashed his wrath upon ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} lose ${luckExpAmount} experience!`;
          const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHades)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHades, false));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHades, 'pastEvents');

          return resolve(selectedPlayer);

        case 2:
          const luckHealthAmount = Helper.randomBetween(5, 50 + (selectedPlayer.level * 2));
          selectedPlayer.health -= luckHealthAmount;
          Helper.checkHealth(this.MapClass, selectedPlayer, discordHook);

          const eventMsgZeus = `${Helper.generatePlayerName(selectedPlayer, true)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
          const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgZeus)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogZeus, false));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogZeus, 'pastEvents');

          return resolve(selectedPlayer);

        case 3:
          const healthDeficit = (100 + (selectedPlayer.level * 5)) - selectedPlayer.health;

          if (healthDeficit) {
            const healAmount = Math.round(healthDeficit / 3);

            const eventMsgAseco = `Fortune smiles upon ${Helper.generatePlayerName(selectedPlayer, true)} as Aseco cured ${Helper.generateGenderString(selectedPlayer, 'his')} sickness and restored ${Helper.generateGenderString(selectedPlayer, 'him')} ${healAmount} health!`;
            const eventLogAseco = `Aseco healed you for ${healAmount}`;

            selectedPlayer.health += healAmount;

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAseco)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, false));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAseco, 'pastEvents');

            return resolve(selectedPlayer);
          }

          const eventMsgAsecoFull = `Aseco gave ${Helper.generatePlayerName(selectedPlayer, true)} an elixir of life but it caused no effect on ${Helper.generateGenderString(selectedPlayer, 'him')}. Actually it tasted like wine!`;
          const eventLogAsecoFull = 'Aseco wanted to heal you, but you had full health';

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAsecoFull)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAsecoFull, false));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAsecoFull, 'pastEvents');

          return resolve(selectedPlayer);

        case 4:
          if (selectedPlayer.gold.current < (selectedPlayer.gold.current / 6)) {
            const eventMsgHermesFail = `Hermes demanded some gold from ${Helper.generatePlayerName(selectedPlayer, true)} but as ${Helper.generateGenderString(selectedPlayer, 'he')} had no money, Hermes left him alone.`;
            const eventLogHermesFail = 'Hermes demanded gold from you but you had nothing to give';

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermesFail)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermesFail, false));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermesFail, 'pastEvents');

            return resolve(selectedPlayer);
          }

          const goldTaken = Math.round(selectedPlayer.gold.current / 6);

          const eventMsgHermes = `Hermes took ${goldTaken} gold from ${Helper.generatePlayerName(selectedPlayer, true)} by force. Probably he is just out of humor.`
          const eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

          selectedPlayer.gold.current -= goldTaken;
          if (selectedPlayer.gold.current < 0) {
            selectedPlayer.gold.current = 0;
          }

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermes)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, false));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermes, 'pastEvents');

          return resolve(selectedPlayer);

        case 5:
          const luckExpAthena = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
          selectedPlayer.experience += luckExpAthena;
          Helper.checkExperience(selectedPlayer, discordHook)

          const eventMsgAthene = `Athene shared her wisdom with ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} gain ${luckExpAthena} experience!`;
          const eventLogAthene = `Athene shared her wisdom with you making you gain ${luckExpAthena} experience`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAthene)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAthene, false));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAthene, 'pastEvents');

          return resolve(selectedPlayer);

        case 6:
          return this.SpellManager.generateSpell(selectedPlayer)
            .then((spell) => {
              const eventMsgEris = `Eris has given ${Helper.generatePlayerName(selectedPlayer, true)} a scroll containing \`${spell.name}\` to add to ${Helper.generateGenderString(selectedPlayer, 'his')} spellbook!`;
              const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
              if (selectedPlayer.spells.length > 0) {
                let shouldAddToList = false;
                let tempArray;
                selectedPlayer.spells.forEach((ownedSpell, index) => {
                  const spellName = ownedSpell.name.split(/ (.+)/)[1];
                  if (spell.power > ownedSpell.power) {
                    if (spell.name.includes(spellName)) {
                      tempArray = selectedPlayer.spells.splice(index, 1, ownedSpell);
                      shouldAddToList = true;
                    } else {
                      shouldAddToList = true;
                    }
                  }
                });

                if (shouldAddToList) {
                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsgEris}`)
                    .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, false));
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLogEris, 'pastEvents');
                  if (tempArray) {
                    selectedPlayer.spells = tempArray;
                  }
                  selectedPlayer.spells.push(spell);
                }
              } else {
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsgEris}`)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, false));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLogEris, 'pastEvents');
                selectedPlayer.spells.push(spell);
              }

              return resolve(selectedPlayer);
            });
      }
    });
  }

  generateGoldEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      const luckGoldChance = Helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = Helper.randomBetween(5, 100);
        const goldAmount = Math.round((luckGoldDice * selectedPlayer.stats.luk) / 2) * multiplier;
        selectedPlayer.gold.current += goldAmount;
        selectedPlayer.gold.total += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;

        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
          .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = Helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 4)) {
        return this.SpellManager.generateSpell(selectedPlayer)
          .then((spell) => {
            const { eventMsg, eventLog } = events.messages.randomItemEventMessage(selectedPlayer, spell);
            if (selectedPlayer.spells.length > 0) {
              let shouldAddToList = false;
              let tempArray;
              selectedPlayer.spells.forEach((ownedSpell, index) => {
                const spellName = ownedSpell.name.split(/ (.+)/)[1];
                if (spell.power > ownedSpell.power) {
                  if (spell.name.includes(spellName)) {
                    tempArray = selectedPlayer.spells.splice(index, 1, ownedSpell);
                    shouldAddToList = true;
                  } else {
                    shouldAddToList = true;
                  }
                }
              });

              if (shouldAddToList) {
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                  .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
                if (tempArray) {
                  selectedPlayer.spells = tempArray;
                }
                selectedPlayer.spells.push(spell);
              }
            } else {
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
                .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false));
              selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
              selectedPlayer.spells.push(spell);
            }

            return resolve(selectedPlayer);
          });
      } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 4)) {
        return this.ItemManager.generateItem(selectedPlayer)
          .then((item) => {
            if (item.position !== enumHelper.inventory.position) {
              const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
              const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
              if (oldItemRating > newItemRating) {
                selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
              } else {
                selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, item.position, item);
              }
            } else {
              selectedPlayer = this.InventoryManager.addItemIntoInventory(selectedPlayer, item);
            }

            const { eventMsg, eventLog } = events.messages.randomItemEventMessage(selectedPlayer, item);
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
              .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

            return resolve(selectedPlayer);
          });
      }
    });
  }

  generateGamblingEvent(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      if (selectedPlayer.gold.current < 10) {
        return resolve(selectedPlayer)
      }

      const luckGambleChance = Helper.randomBetween(0, 100);
      const luckGambleGold = Math.round(Helper.randomBetween(selectedPlayer.gold.current / 10, selectedPlayer.gold.current / 3));
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 4)) {
        selectedPlayer.gold.current -= luckGambleGold;
        if (selectedPlayer.gold.current <= 0) {
          selectedPlayer.gold.current = 0;
        }

        const { eventMsg, eventLog } = events.messages.randomGambleEventMessage(selectedPlayer, luckGambleGold, false);
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
          .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return resolve(selectedPlayer);
      }

      selectedPlayer.gold.current += luckGambleGold;
      selectedPlayer.gold.total += luckGambleGold;

      const { eventMsg, eventLog } = events.messages.randomGambleEventMessage(selectedPlayer, luckGambleGold, true);
      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
        .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return resolve(selectedPlayer);
    });
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
    return new Promise((resolve) => {
      const snowFlakeDice = Helper.randomBetween(0, 100);
      if (snowFlakeDice <= 15) {
        const snowFlake = this.ItemManager.generateSnowflake(selectedPlayer);
        if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.relic) < Helper.calculateItemRating(selectedPlayer, snowFlake)) {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';

          Helper.sendMessage(discordHook, 'twitch', false, eventMsgSnowflake)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogSnowflake, true))
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogSnowflake, 'pastEvents');
        }
      }

      return resolve(selectedPlayer);
    });
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