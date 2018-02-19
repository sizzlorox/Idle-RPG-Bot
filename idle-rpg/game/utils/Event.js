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
const { errorLog } = require('../../utils/logger');

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
      selectedPlayer.map = this.MapManager.moveToRandomMap(selectedPlayer);
      const eventMsg = `${Helper.generatePlayerName(selectedPlayer)} just arrived in \`${selectedPlayer.map.name}\`.`;
      const eventLog = `Arrived in ${selectedPlayer.map.name}`;
      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg);
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false);
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);

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
                  ${Helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                  ${Helper.generatePlayerName(selectedPlayer)} has ${selectedPlayer.health} HP left.
                  ${Helper.generatePlayerName(randomPlayer)} 's \`${randomPlayer.equipment.weapon.name}\` did ${defenderDamage} damage.
                  ${Helper.generatePlayerName(randomPlayer)} has ${randomPlayer.health} HP left.`;

                Helper.printEventDebug(battleResult);

                if (selectedPlayer.health <= 0) {
                  const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(randomPlayer)} just killed ${Helper.generatePlayerName(selectedPlayer)} with ${Helper.generateGenderString(randomPlayer, 'his')} \`${randomPlayer.equipment.weapon.name}\`!
    ${Helper.generatePlayerName(selectedPlayer)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${Helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;

                  const eventLog = `Died to ${defender.name} in ${selectedPlayer.map.name}.`;
                  const otherPlayerLog = `Killed ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
                  Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
                  Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true);
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog);
                  selectedPlayer.battles.lost++;
                  randomPlayer.battles.won++;

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
                    ? `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} attacked ${Helper.generatePlayerName(randomPlayer)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${Helper.generateGenderString(randomPlayer, 'he')} managed to get away!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`
                    : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} attacked ${Helper.generatePlayerName(randomPlayer)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} in \`${selectedPlayer.map.name}\` but ${Helper.generatePlayerName(randomPlayer)} was too strong!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                  // TODO: Find a way of making this visible some other method
                  // eventMsg = eventMsg.concat(battleResult);
                  const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and dealt ${attackerDamage} damage!`;
                  const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and received ${attackerDamage} damage!`;

                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
                  randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog);

                  return selectedPlayer;
                }

                const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} just killed \`${randomPlayer.name}\` with ${Helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\`!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
                const eventLog = `Killed ${randomPlayer.name} in ${selectedPlayer.map.name}.`;
                const otherPlayerLog = `Died to ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
                Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
                Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true);
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
                randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog);
                selectedPlayer.battles.won++;
                randomPlayer.battles.lost++;

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
                ${Helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
                ${Helper.generatePlayerName(selectedPlayer)} has ${selectedPlayer.health} / ${playerMaxHealth} HP left.
                ${defender.name}'s \`${defender.equipment.weapon.name}\` did ${defenderDamage} damage.
                ${defender.name} has ${defender.health} / ${mobMaxHealth} HP left.`;

              Helper.printEventDebug(battleResult);

              if (selectedPlayer.health <= 0) {
                const eventMsg = `[\`${selectedPlayer.map.name}\`] \`${mob.name}\`'s \`${defender.equipment.weapon.name}\` just killed ${Helper.generatePlayerName(selectedPlayer)}!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = `${mob.name}'s ${defender.equipment.weapon.name} just killed you in ${selectedPlayer.map.name}!`;
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
                Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
                Helper.checkHealth(this.MapClass, selectedPlayer, mob, discordHook);
                selectedPlayer.battles.lost++;

                return resolve(selectedPlayer);
              }

              if (defender.health > 0 && selectedPlayer.health > 0) {
                const expGain = Math.floor((defender.experience * multiplier) / 2);
                const eventMsg = attackerDamage > defenderDamage
                  ? `[\`${selectedPlayer.map.name}\`] \`${mob.name}\` just fled from ${Helper.generatePlayerName(selectedPlayer)}!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`
                  : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} just fled from \`${mob.name}\`!
    ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained ${expGain} exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;

                const eventLog = attackerDamage > defenderDamage
                  ? `${mob.name} fled from you in ${selectedPlayer.map.name}!`
                  : `You fled from ${mob.name} in ${selectedPlayer.map.name}!`;

                selectedPlayer.experience += expGain;
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
                Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
                Helper.checkExperience(selectedPlayer, discordHook);

                return resolve(selectedPlayer);
              }

              const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)}'s \`${selectedPlayer.equipment.weapon.name}\` just killed \`${mob.name}\`!
      ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg and gained \`${defender.experience * multiplier}\` exp and \`${defender.gold * multiplier}\` gold! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${mob.name}\` HP:${defender.health}/${mobMaxHealth}]`;
              const eventLog = `Killed ${mob.name} with your ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map.name}.`;

              selectedPlayer.experience += defender.experience * multiplier;
              selectedPlayer.gold += defender.gold * multiplier;
              selectedPlayer.kills.mob++;
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
              Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
              selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
              Helper.checkExperience(selectedPlayer, discordHook);
              selectedPlayer.battles.won++;

              return resolve(selectedPlayer);
            });
        });
    });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = Helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 2)) {
        return this.ItemManager.generateItem(selectedPlayer, mob)
          .then((item) => {
            events.utils.dropItem(selectedPlayer, item);

            let eventMsg;
            if (!item.isXmasEvent) {
              eventMsg = `${Helper.generatePlayerName(selectedPlayer)} received \`${item.name}\` from \`${mob.name}!\``;
            } else {
              eventMsg = `**${Helper.generatePlayerName(selectedPlayer)} received \`${item.name}\` from \`${mob.name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob.name}`;

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);

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

          if (selectedPlayer.gold <= itemCost || item.name.startsWith('Cracked')) {
            return resolve(selectedPlayer);
          }

          events.utils.townItem(selectedPlayer, item, itemCost, resolve);

          const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} just purchased \`${item.name}\` for ${itemCost} gold!`;
          const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);

          return resolve(selectedPlayer);
        });
    });
  }

  sellInTown(discordHook, twitchBot, selectedPlayer) {
    if (selectedPlayer.inventory.equipment.length > 0) {
      let profit = 0;
      Helper.printEventDebug(selectedPlayer.inventory.equipment);
      selectedPlayer.inventory.equipment.forEach((equipment) => {
        Helper.printEventDebug(`Equipment selling: ${equipment.name}`);
        profit += Number(equipment.gold);
      });
      selectedPlayer.inventory.equipment.length = 0;
      profit = Math.floor(profit);
      selectedPlayer.gold += profit;

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} just sold what they found adventuring for ${profit} gold!`;
      const eventLog = `Made ${profit} gold selling what you found adventuring`;

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsg}`);
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false);
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);
    }

    return selectedPlayer;
  }

  campEvent(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      selectedPlayer = Helper.passiveRegen(selectedPlayer, 5 + (selectedPlayer.stats.end / 2), 5 + (selectedPlayer.stats.int / 2));
      // TODO: Make more camp event messages to be selected randomly
      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} has set up camp and began resting.`;
      const eventLog = 'Set up camp to rest.';

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsg}`);
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false);
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);

      return resolve(selectedPlayer);
    });
  }

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventInt = Helper.randomBetween(0, 9);
    return events.utils.randomEventMessage(randomEventInt);
  }

  stealPlayerItem(discordHook, twitchBot, stealingPlayer, victimPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;

      console.log(`>>>>>>>>>>>>>>>>>>>> CHANCE : ${chance} - LUCKSTEALCHANCE : ${luckStealChance} - BOUNTYLUCK : ${90 - canSteal}`);
      if (luckStealChance > (90 - canSteal)) {
        const luckItem = Helper.randomBetween(0, 2);
        const itemKeys = ['helmet', 'armor', 'weapon'];

        events.utils.stealEquip(discordHook, stealingPlayer, victimPlayer, itemKeys[luckItem]);
      } else if (victimPlayer.gold > 0) {
        const goldStolen = Math.round(victimPlayer.gold / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold += goldStolen;
          victimPlayer.gold -= goldStolen;

          const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
          const eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;

          Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
          Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true);
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog);
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

          const eventMsgHades = `Hades unleashed his wrath upon ${Helper.generatePlayerName(selectedPlayer)} making ${Helper.generateGenderString(selectedPlayer, 'him')} lose ${luckExpAmount} experience!`;
          const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHades);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHades, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHades);

          return resolve(selectedPlayer);

        case 2:
          const luckHealthAmount = Helper.randomBetween(5, 50 + (selectedPlayer.level * 2));
          selectedPlayer.health -= luckHealthAmount;
          Helper.checkHealth(this.MapClass, selectedPlayer, discordHook);

          const eventMsgZeus = `${Helper.generatePlayerName(selectedPlayer)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
          const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgZeus);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogZeus, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogZeus);

          return resolve(selectedPlayer);

        case 3:
          const healthDeficit = (100 + (selectedPlayer.level * 5)) - selectedPlayer.health;

          if (healthDeficit) {
            const healAmount = Math.round(healthDeficit / 3);

            const eventMsgAseco = `Fortune smiles upon ${Helper.generatePlayerName(selectedPlayer)} as Aseco cured ${Helper.generateGenderString(selectedPlayer, 'him')} sickness and restored ${Helper.generateGenderString(selectedPlayer, 'him')} ${healAmount} health!`;
            const eventLogAseco = `Aseco healed you for ${healAmount}`;

            selectedPlayer.health += healAmount;

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAseco);
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, false);
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAseco);

            return resolve(selectedPlayer);
          }

          const eventMsgAsecoFull = `Aseco gave ${Helper.generatePlayerName(selectedPlayer)} an elixir of life but it caused no effect on ${Helper.generateGenderString(selectedPlayer, 'him')}. Actually it tasted like wine!`;
          const eventLogAsecoFull = 'Aseco wanted to heal you, but you had full health';

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAsecoFull);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAsecoFull, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAsecoFull);

          return resolve(selectedPlayer);

        case 4:
          if (selectedPlayer.gold < 20) {
            const eventMsgHermesFail = `Hermes demanded some gold from ${Helper.generatePlayerName(selectedPlayer)} but as ${Helper.generateGenderString(selectedPlayer, 'he')} had no money, Hermes left him alone.`;
            const eventLogHermesFail = 'Hermes demanded gold from you but you had nothing to give';

            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermesFail);
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermesFail, false);
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermesFail);

            return resolve(selectedPlayer);
          }

          const goldTaken = Math.round(selectedPlayer.gold / 20);

          const eventMsgHermes = `Hermes took ${goldTaken} gold from ${Helper.generatePlayerName(selectedPlayer)} by force. Probably he is just out of humor.`
          const eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

          selectedPlayer.gold -= goldTaken;
          if (selectedPlayer.gold < 0) {
            selectedPlayer.gold = 0;
          }

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermes);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermes);

          return resolve(selectedPlayer);

        case 5:
          const luckExpAthena = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
          selectedPlayer.experience += luckExpAthena;
          Helper.checkExperience(selectedPlayer, discordHook)

          const eventMsgAthene = `Athene shared her wisdom with ${Helper.generatePlayerName(selectedPlayer)} making ${Helper.generateGenderString(selectedPlayer, 'him')} gain ${luckExpAthena} experience!`;
          const eventLogAthene = `Athene shared her wisdom with you making you gain ${luckExpAthena} experience`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAthene);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAthene, false);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAthene);

          return resolve(selectedPlayer);

        case 6:
          return this.SpellManager.generateSpell(selectedPlayer)
            .then((spell) => {
              const eventMsgEris = `Eris has given ${Helper.generatePlayerName(selectedPlayer)} a scroll containing \`${spell.name}\` to add to ${Helper.generateGenderString(selectedPlayer, 'his')} spellbook!`;
              const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
              if (selectedPlayer.spells.length > 0) {
                let shouldAddToList = false;
                let tempArray;
                selectedPlayer.spells.forEach((ownedSpell, index) => {
                  const spellName = ownedSpell.name.split(/ (.+)/)[1];
                  if (spell.power > ownedSpell.power) {
                    if (spell.name.includes(spellName)) {
                      tempArray = selectedPlayer.spells.splice(index, 1, spell);
                      shouldAddToList = true;
                    } else {
                      shouldAddToList = true;
                    }
                  }
                });

                if (shouldAddToList) {
                  Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsgEris}`);
                  Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, false);
                  selectedPlayer = Helper.logEvent(selectedPlayer, eventLogEris);
                  if (tempArray) {
                    selectedPlayer.spells = tempArray;
                  }
                  selectedPlayer.spells.push(spell);
                }
              } else {
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${eventMsgEris}`);
                Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, false);
                selectedPlayer = Helper.logEvent(selectedPlayer, eventLogEris);
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
        selectedPlayer.gold += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;

        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false);
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog);

        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = Helper.randomBetween(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
        return this.SpellManager.generateSpell(selectedPlayer)
          .then((spell) => {
            const spellEventResult = this.generateItemEventMessage(selectedPlayer, spell);
            if (selectedPlayer.spells.length > 0) {
              let shouldAddToList = false;
              let tempArray;
              selectedPlayer.spells.forEach((ownedSpell, index) => {
                const spellName = ownedSpell.name.split(/ (.+)/)[1];
                if (spell.power > ownedSpell.power) {
                  if (spell.name.includes(spellName)) {
                    tempArray = selectedPlayer.spells.splice(index, 1, spell);
                    shouldAddToList = true;
                  } else {
                    shouldAddToList = true;
                  }
                }
              });

              if (shouldAddToList) {
                Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${spellEventResult.eventMsg}`);
                Helper.sendPrivateMessage(discordHook, selectedPlayer, spellEventResult.eventLog, false);
                selectedPlayer = Helper.logEvent(selectedPlayer, spellEventResult.eventLog);
                if (tempArray) {
                  selectedPlayer.spells = tempArray;
                }
                selectedPlayer.spells.push(spell);
              }
            } else {
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, `${spellEventResult.eventMsg}`);
              Helper.sendPrivateMessage(discordHook, selectedPlayer, spellEventResult.eventLog, false);
              selectedPlayer = Helper.logEvent(selectedPlayer, spellEventResult.eventLog);
              selectedPlayer.spells.push(spell);
            }

            return resolve(selectedPlayer);
          });
      } else if (luckItemDice <= 30 + (selectedPlayer.stats.luk / 2)) {
        return this.ItemManager.generateItem(selectedPlayer)
          .then((item) => {
            switch (item.position) {
              case enumHelper.equipment.types.helmet.position:
                if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.helmet) > Helper.calculateItemRating(selectedPlayer, item.power)) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
                }
                break;

              case enumHelper.equipment.types.armor.position:
                if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.armor) > Helper.calculateItemRating(selectedPlayer, item.power)) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
                }
                break;

              case enumHelper.equipment.types.weapon.position:
                if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.weapon) > Helper.calculateItemRating(selectedPlayer, item.power)) {
                  selectedPlayer = this.InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
                } else {
                  selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
                }
                break;

              case enumHelper.inventory.position:
                selectedPlayer = this.InventoryManager.addItemIntoInventory(selectedPlayer, item);
                break;
            }

            const itemEventResult = this.generateItemEventMessage(selectedPlayer, item);
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, itemEventResult.eventMsg);
            Helper.sendPrivateMessage(discordHook, selectedPlayer, itemEventResult.eventLog, true);
            selectedPlayer = Helper.logEvent(selectedPlayer, itemEventResult.eventLog);

            return resolve(selectedPlayer);
          });
      }
    });
  }

  generateGamblingEvent(discordHook, selectedPlayer, multiplier) {
    return new Promise((resolve) => {
      if (selectedPlayer.gold < 10) {
        return resolve(selectedPlayer)
      }

      const luckGambleChance = Helper.randomBetween(0, 100);
      const luckGambleGold = Math.round(Helper.randomBetween(selectedPlayer.gold / 10, selectedPlayer.gold / 3));
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 2)) {
        selectedPlayer.gold -= luckGambleGold;
        if (selectedPlayer.gold <= 0) {
          selectedPlayer.gold = 0;
        }

        const eventMsgLoseGamble = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} decided to try ${Helper.generateGenderString(selectedPlayer, 'his')} luck in a tavern.
        Unfortunately, ${Helper.generateGenderString(selectedPlayer, 'he')} lost ${luckGambleGold} gold!`;
        const eventLogLoseGamble = `Oh dear! You lost ${luckGambleGold} gold by gambling in a tavern.`;

        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgLoseGamble);
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventMsgLoseGamble, true);
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogLoseGamble);

        return resolve(selectedPlayer);
      }

      selectedPlayer.gold += luckGambleGold;

      const eventMsgWinGamble = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} decided to try ${Helper.generateGenderString(selectedPlayer, 'his')} luck in a tavern.
      Fortunately, ${Helper.generateGenderString(selectedPlayer, 'he')} won ${luckGambleGold} gold!`;
      const eventLogWinGamble = `Congrats! You won ${luckGambleGold} gold by gambling in a tavern.`;

      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgWinGamble);
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventMsgWinGamble, true);
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLogWinGamble);

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
        if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.relic) < Helper.calculateItemRating(selectedPlayer, snowFlake.power)) {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';

          Helper.sendMessage(discordHook, 'twitch', false, eventMsgSnowflake);
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogSnowflake, true);
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogSnowflake);
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