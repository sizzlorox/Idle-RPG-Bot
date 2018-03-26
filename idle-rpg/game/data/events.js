const Helper = require('../../utils/Helper');
const enumHelper = require('../../utils/enumHelper');
const Database = require('../../database/Database');
const { pvpLevelRestriction } = require('../../../settings');

const events = {
  movement: {
    movePlayer: (discordHook, selectedPlayer, mapObj) => new Promise((resolve) => {
      const previousMap = selectedPlayer.map;
      selectedPlayer.map = mapObj.map;
      const eventMsg = `${Helper.generatePlayerName(selectedPlayer)} decided to head \`${mapObj.direction}\` from \`${previousMap.name}\` and arrived in \`${mapObj.map.name}\`.`;
      const eventLog = `Moved ${mapObj.direction} and arrived in ${mapObj.map.name}`;
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return Promise.all([
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
      ])
        .then(resolve(selectedPlayer));
    })
  },

  camp: (discordHook, selectedPlayer) => new Promise((resolve) => {
    selectedPlayer = Helper.passiveRegen(selectedPlayer, ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.end / 2), ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.int / 2));
    // TODO: Make more camp event messages to be selected randomly
    const { eventMsg, eventLog } = Helper.randomCampEventMessage(selectedPlayer);
    selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

    return Promise.all([
      Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg),
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true)
    ])
      .then(resolve(selectedPlayer));
  }),

  town: {
    sell: (discordHook, selectedPlayer) => new Promise((resolve) => {
      if (selectedPlayer.inventory.equipment.length > 0) {
        let profit = 0;
        Helper.printEventDebug(selectedPlayer.inventory.equipment);
        selectedPlayer.inventory.equipment.forEach((equipment) => {
          Helper.printEventDebug(`Equipment selling: ${equipment.name}`);
          profit += Number(equipment.gold);
        });
        if (isNaN(profit)) {
          infoLog.info(selectedPlayer.inventory.equipment);
          profit = 100;
        }
        selectedPlayer.inventory.equipment.length = 0;
        profit = Math.floor(profit);
        selectedPlayer.gold.current += profit;
        selectedPlayer.gold.total += profit;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just sold what they found adventuring for ${profit} gold!`;
        const eventLog = `Made ${profit} gold selling what you found adventuring`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    }),

    item: (discordHook, selectedPlayer, item, InventoryManager) => new Promise((resolve) => {
      const itemCost = Math.round(item.gold);

      if (selectedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
        return resolve(selectedPlayer);
      }

      if (item.position !== enumHelper.inventory.position) {
        selectedPlayer.equipment[item.position].position = enumHelper.equipment.types[item.position].position;
        const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
        const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
        if (oldItemRating > newItemRating) {
          return resolve(selectedPlayer);
        }
      } else if (selectedPlayer.inventory.items.length >= enumHelper.inventory.maxItemAmount) {
        return resolve(selectedPlayer);
      }

      if (item.position !== enumHelper.inventory.position) {
        selectedPlayer.gold.current -= itemCost;
        selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
      } else {
        selectedPlayer.gold.current -= itemCost;
        selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
      }
      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just purchased \`${item.name}\` for ${itemCost} gold!`;
      const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return Promise.all([
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, true, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
      ])
        .then(resolve(selectedPlayer));
    })
  },

  battle: {
    pvpPreperation: (selectedPlayer, mappedPlayers, onlinePlayers) => new Promise((resolve) => {
      if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
        const sameMapPlayers = mappedPlayers.filter(player => player.name !== selectedPlayer.name
          && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1
          && player.level <= selectedPlayer.level + pvpLevelRestriction && player.level >= selectedPlayer.level - pvpLevelRestriction);

        if (sameMapPlayers.length > 0 && selectedPlayer.health > (100 + (selectedPlayer.level * 5)) / 4) {
          const randomPlayerIndex = Helper.randomBetween(0, sameMapPlayers.length - 1);
          const randomPlayer = sameMapPlayers[randomPlayerIndex];

          if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name && randomPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
            return resolve({ randomPlayer });
          }
        }
      }

      return resolve({});
    }),

    pvpResults: (discordHook, { attacker, defender, attackerDamage, defenderDamage }) => new Promise((resolve) => {
      let selectedPlayer = attacker;
      let randomPlayer = defender;
      const randomPlayerMaxHealth = 100 + (randomPlayer.level * 5);
      const playerMaxHealth = 100 + (selectedPlayer.level * 5);

      const battleResult = `Battle Results:
          ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${attackerDamage} damage.
          ${Helper.generatePlayerName(selectedPlayer, true)} has ${selectedPlayer.health} HP left.
          ${Helper.generatePlayerName(randomPlayer, true)} 's \`${randomPlayer.equipment.weapon.name}\` did ${defenderDamage} damage.
          ${Helper.generatePlayerName(randomPlayer, true)} has ${randomPlayer.health} HP left.`;

      Helper.printEventDebug(battleResult);

      if (selectedPlayer.health <= 0) {
        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(randomPlayer, true)} just killed ${Helper.generatePlayerName(selectedPlayer, true)} with ${Helper.generateGenderString(randomPlayer, 'his')} \`${randomPlayer.equipment.weapon.name}\`!
  ${Helper.generatePlayerName(selectedPlayer, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;

        const expGain = Math.floor(attackerDamage / 8);
        const eventLog = `Died to ${defender.name} in ${selectedPlayer.map.name}.`;
        const otherPlayerLog = `Killed ${selectedPlayer.name} in ${selectedPlayer.map.name}. [${expGain} exp]`;

        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
        randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
        randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
        selectedPlayer.battles.lost++;
        randomPlayer.battles.won++;
        randomPlayer.experience.current += expGain;
        randomPlayer.experience.total += expGain;

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true),
          Database.savePlayer(randomPlayer)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.lost,
            updatedAttacker: selectedPlayer,
            updatedDefender: randomPlayer
          }));
      }

      if (defender.health > 0 && selectedPlayer.health > 0) {
        const eventMsg = attackerDamage > defenderDamage
          ? `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} attacked ${Helper.generatePlayerName(randomPlayer, true)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} but ${Helper.generateGenderString(randomPlayer, 'he')} managed to get away!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`
          : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} attacked ${Helper.generatePlayerName(randomPlayer, true)} with ${Helper.generateGenderString(selectedPlayer, 'his')} ${selectedPlayer.equipment.weapon.name} but ${Helper.generatePlayerName(randomPlayer, true)} was too strong!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;

        const expGainAttacker = Math.floor(defenderDamage / 8);
        const expGainDefender = Math.floor(attackerDamage / 8);
        const eventLog = `Attacked ${randomPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`;
        const otherPlayerLog = `Attacked by ${selectedPlayer.name} in ${selectedPlayer.map.name} with ${selectedPlayer.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;

        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
        randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
        randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
        selectedPlayer.experience.current += expGainAttacker;
        selectedPlayer.experience.total += expGainAttacker;
        randomPlayer.experience.current += expGainDefender;
        randomPlayer.experience.total += expGainDefender;

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true),
          Database.savePlayer(randomPlayer)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.fled,
            updatedAttacker: selectedPlayer,
            updatedDefender: randomPlayer
          }));
      }

      const expGain = Math.floor(defenderDamage / 8);
      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just killed \`${randomPlayer.name}\` with ${Helper.generateGenderString(selectedPlayer, 'his')} \`${selectedPlayer.equipment.weapon.name}\`!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(randomPlayer, true)} HP:${defender.health}/${randomPlayerMaxHealth}]`;
      const eventLog = `Killed ${randomPlayer.name} in ${selectedPlayer.map.name}. [${expGain} exp]`;
      const otherPlayerLog = `Died to ${selectedPlayer.name} in ${selectedPlayer.map.name}.`;

      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastPvpEvents');
      randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastEvents');
      randomPlayer = Helper.logEvent(randomPlayer, otherPlayerLog, 'pastPvpEvents');
      selectedPlayer.battles.won++;
      randomPlayer.battles.lost++;
      selectedPlayer.experience.current += expGain;
      selectedPlayer.experience.total += expGain;

      return Promise.all([
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
        Helper.sendPrivateMessage(discordHook, randomPlayer, otherPlayerLog, true),
        Database.savePlayer(randomPlayer)
      ])
        .then(resolve({
          result: enumHelper.battle.outcomes.win,
          updatedAttacker: selectedPlayer,
          updatedDefender: randomPlayer
        }));
    }),

    pveResults: (discordHook, MapClass, results, multiplier) => new Promise((resolve) => {
      const mobMaxHealth = results.defender.maxHealth;
      const playerMaxHealth = 100 + (results.attacker.level * 5);

      let selectedPlayer = results.attacker;
      const battleResult = `Battle Results:
          ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` did ${results.attackerDamage} damage.
          ${Helper.generatePlayerName(selectedPlayer, true)} has ${selectedPlayer.health} / ${playerMaxHealth} HP left.
          ${results.defender.name}'s \`${results.defender.equipment.weapon.name}\` did ${results.defenderDamage} damage.
          ${results.defender.name} has ${results.defender.health} / ${mobMaxHealth} HP left.`;

      Helper.printEventDebug(battleResult);

      if (selectedPlayer.health <= 0) {
        const eventMsg = `[\`${selectedPlayer.map.name}\`] \`${results.defender.name}\`'s \`${results.defender.equipment.weapon.name}\` just killed ${Helper.generatePlayerName(selectedPlayer, true)}!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg! [\`${results.defender.name}\` HP:${results.defender.health}/${mobMaxHealth}]`;

        const eventLog = `${results.defender.name}'s ${results.defender.equipment.weapon.name} just killed you in ${selectedPlayer.map.name}!`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
        selectedPlayer.battles.lost++;

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.lost,
            updatedPlayer: selectedPlayer,
            updatedMob: results.defender
          }));
      }

      if (results.defender.health > 0 && selectedPlayer.health > 0) {
        const expGain = Math.floor(((results.defender.experience * multiplier) + (results.defenderDamage / 4)) / 6);
        const eventMsg = results.attackerDamage > results.defenderDamage
          ? `[\`${selectedPlayer.map.name}\`] \`${results.defender.name}\` just fled from ${Helper.generatePlayerName(selectedPlayer, true)}!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg\`${expGain === 0 ? '' : ` and gained \`${expGain}\` exp`}\`! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${results.defender.name}\` HP:${results.defender.health}/${mobMaxHealth}]`
          : `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just fled from \`${results.defender.name}\`!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg\`${expGain === 0 ? '' : ` and gained \`${expGain}\` exp`}\` exp! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${results.defender.name}\` HP:${results.defender.health}/${mobMaxHealth}]`;

        const eventLog = results.attackerDamage > results.defenderDamage
          ? `${results.defender.name} fled from you in ${selectedPlayer.map.name}!${expGain === 0 ? '' : ` [${expGain} exp]`}`
          : `You fled from ${results.defender.name} in ${selectedPlayer.map.name}!${expGain === 0 ? '' : ` [${expGain} exp]`}`;

        selectedPlayer.experience.current += expGain;
        selectedPlayer.experience.total += expGain;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.fled,
            updatedPlayer: selectedPlayer,
            updatedMob: results.defender
          }));
      }
      const goldGain = Number(results.defender.gold * multiplier);
      const expGain = Math.floor((results.defender.experience * multiplier) + (results.defenderDamage / 4));

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` just killed \`${results.defender.name}\`!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg and gained \`${expGain}\` exp${goldGain === 0 ? '' : ` and \`${goldGain}\` gold`}! [HP:${selectedPlayer.health}/${playerMaxHealth}]-[\`${results.defender.name}\` HP:${results.defender.health}/${mobMaxHealth}]`;
      const eventLog = `Killed ${results.defender.name} with your ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map.name}. [${expGain} exp${goldGain === 0 ? '' : `/${goldGain} gold`}]`;

      selectedPlayer.experience.current += expGain;
      selectedPlayer.experience.total += expGain;
      selectedPlayer.gold.current += goldGain;
      selectedPlayer.gold.total += goldGain;
      selectedPlayer.kills.mob++;
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
      selectedPlayer.battles.won++;

      return Promise.all([
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true)
      ])
        .then(resolve({
          result: enumHelper.battle.outcomes.win,
          updatedPlayer: selectedPlayer,
          updatedMob: results.defender
        }));
    }),

    steal: (discordHook, stealingPlayer, victimPlayer, InventoryManager) => new Promise((resolve) => {
      const luckStealChance = Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;
      let eventMsg = '';
      let eventLog = '';
      let otherPlayerLog = '';

      if (luckStealChance > (90 - canSteal)) {
        const luckItem = Helper.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (!['Nothing', 'Fist'].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          let stolenEquip;
          if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
            const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
            const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = removePreviousOwnerName;

            eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
            eventLog = `Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
            stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
            stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
            victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
            victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
          } else {
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
            eventLog = `Stole ${stolenEquip.name}`;
            otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
            stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
            stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
            victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
            victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
          }
          victimPlayer.stolen++;
          stealingPlayer.stole++;
          if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
            stealingPlayer.equipment[itemKeys[luckItem]].position = itemKeys[luckItem];
            victimPlayer.equipment[itemKeys[luckItem]].position = itemKeys[luckItem];
            const oldItemRating = Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
            const newItemRating = Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
            if (oldItemRating < newItemRating) {
              stealingPlayer = Helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, stolenEquip);
              if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = victimPlayer.equipment[itemKeys[luckItem]].previousOwners;
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners.push(victimPlayer.name);
              } else {
                stealingPlayer.equipment[itemKeys[luckItem]].previousOwners = [`${victimPlayer.name}`];
              }
            } else {
              stealingPlayer = InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
            }
            if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find(equip => equip.position === enumHelper.equipment.types[itemKeys[luckItem]].position) !== undefined) {
              const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKeys[luckItem]].position)
                .sort((item1, item2) => {
                  return item1.power - item2.power;
                })[0];
              victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
            } else {
              victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
            }
          }
        }

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true),
          Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true)
        ])
          .then(resolve({ stealingPlayer, victimPlayer }));
      } else if (victimPlayer.gold.current > victimPlayer.gold.current / 6) {
        const goldStolen = Math.round(victimPlayer.gold.current / 6);
        if (goldStolen !== 0) {
          stealingPlayer.gold.current += goldStolen;
          stealingPlayer.gold.total += goldStolen;
          stealingPlayer.gold.stole += goldStolen;

          victimPlayer.gold.current -= goldStolen;
          victimPlayer.gold.stolen += goldStolen;

          eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${goldStolen} gold from ${victimPlayer.name}!`);
          eventLog = `Stole ${goldStolen} gold from ${victimPlayer.name}`;
          otherPlayerLog = `${stealingPlayer.name} stole ${goldStolen} gold from you`;
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
          stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
          victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');

          return Promise.all([
            Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg),
            Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true),
            Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true)
          ])
            .then(resolve({ stealingPlayer, victimPlayer }));
        }
      }

      return resolve({ stealingPlayer, victimPlayer });
    }),

    dropItem: (discordHook, selectedPlayer, mob, ItemManager, InventoryManager) => new Promise((resolve) => {
      const dropitemChance = Helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 4)) {
        return ItemManager.generateItem(selectedPlayer, mob)
          .then((item) => {
            if (item.position !== enumHelper.inventory.position) {
              const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
              const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
              if (oldItemRating > newItemRating) {
                selectedPlayer = InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
              } else {
                selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
              }
            } else {
              selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
            }

            let eventMsg;
            if (!item.isXmasEvent) {
              eventMsg = `${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\``;
            } else {
              eventMsg = `**${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob.name}`;
            selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

            return Promise.all([
              Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
              Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
            ])
              .then(resolve(selectedPlayer));
          });
      }

      return resolve(selectedPlayer);
    })
  },

  luck: {
    item: {
      spell: (discordHook, selectedPlayer, spell) => new Promise((resolve) => {
        const { eventMsg, eventLog } = Helper.randomItemEventMessage(selectedPlayer, spell);
        if (selectedPlayer.spells.length > 0) {
          let shouldAddToList = false;
          let tempArray;
          selectedPlayer.spells.forEach((ownedSpell, index) => {
            const spellName = ownedSpell.name.split(/ (.+)/)[1];
            if (spell.power > ownedSpell.power) {
              if (spell.name.includes(spellName)) {
                tempArray = selectedPlayer.spells.splice(index, 1);
                shouldAddToList = true;
              } else {
                shouldAddToList = true;
              }
            }
          });

          if (shouldAddToList) {
            if (tempArray) {
              selectedPlayer.spells = tempArray;
            }
            selectedPlayer.spells.push(spell);
          }
        } else {
          selectedPlayer.spells.push(spell);
        }
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      item: (discordHook, selectedPlayer, item, InventoryManager) => new Promise((resolve) => {
        if (item.position !== enumHelper.inventory.position) {
          const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
          const newItemRating = Helper.calculateItemRating(selectedPlayer, item);
          if (oldItemRating > newItemRating) {
            selectedPlayer = InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
          } else {
            selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, item.position, item);
          }
        } else {
          selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
        }

        const { eventMsg, eventLog } = Helper.randomItemEventMessage(selectedPlayer, item);
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
        ])
          .then(resolve(selectedPlayer));
      })
    },

    gold: (discordHook, selectedPlayer, multiplier) => new Promise((resolve) => {
      const luckGoldChance = Helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = Helper.randomBetween(5, 100);
        const goldAmount = Math.round((luckGoldDice * selectedPlayer.stats.luk) / 2) * multiplier;
        selectedPlayer.gold.current += goldAmount;
        selectedPlayer.gold.total += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    }),

    gambling: (discordHook, selectedPlayer) => new Promise((resolve) => {
      if (selectedPlayer.gold.current < 10) {
        return resolve(selectedPlayer);
      }

      const luckGambleChance = Helper.randomBetween(0, 100);
      const luckGambleGold = Math.round(Helper.randomBetween(selectedPlayer.gold.current / 10, selectedPlayer.gold.current / 3));
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 4)) {
        selectedPlayer.gold.current -= luckGambleGold;
        if (selectedPlayer.gold.current <= 0) {
          selectedPlayer.gold.current = 0;
        }

        const { eventMsg, eventLog } = Helper.randomGambleEventMessage(selectedPlayer, luckGambleGold, false);
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
        ])
          .then(resolve(selectedPlayer));
      }

      selectedPlayer.gold.current += luckGambleGold;
      selectedPlayer.gold.total += luckGambleGold;

      const { eventMsg, eventLog } = Helper.randomGambleEventMessage(selectedPlayer, luckGambleGold, true);
      selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');

      return Promise.all([
        Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false)
      ])
        .then(resolve(selectedPlayer));
    }),

    gods: {
      hades: (discordHook, selectedPlayer) => new Promise((resolve) => {
        const luckExpAmount = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
        selectedPlayer.experience.current -= luckExpAmount;
        if (selectedPlayer.experience.current < 0) {
          selectedPlayer.experience.current = 0;
        }

        const eventMsgHades = `Hades unleashed his wrath upon ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} lose ${luckExpAmount} experience!`;
        const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHades, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHades),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHades, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      zeus: (discordHook, selectedPlayer) => new Promise((resolve) => {
        const luckHealthAmount = Helper.randomBetween(5, 50 + (selectedPlayer.level * 2));
        selectedPlayer.health -= luckHealthAmount;

        const eventMsgZeus = `${Helper.generatePlayerName(selectedPlayer, true)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
        const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogZeus, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgZeus),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogZeus, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      aseco: (discordHook, selectedPlayer) => new Promise((resolve) => {
        const healthDeficit = (100 + (selectedPlayer.level * 5)) - selectedPlayer.health;
        let eventMsgAseco = '';
        let eventLogAseco = '';

        if (healthDeficit) {
          const healAmount = Math.round(healthDeficit / 3);
          eventMsgAseco = `Fortune smiles upon ${Helper.generatePlayerName(selectedPlayer, true)} as Aseco cured ${Helper.generateGenderString(selectedPlayer, 'his')} sickness and restored ${Helper.generateGenderString(selectedPlayer, 'him')} ${healAmount} health!`;
          eventLogAseco = `Aseco healed you for ${healAmount}`;

          selectedPlayer.health += healAmount;
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAseco, 'pastEvents');

          return Promise.all([
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAseco),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, false)
          ])
            .then(resolve(selectedPlayer));
        }

        eventMsgAseco = `Aseco gave ${Helper.generatePlayerName(selectedPlayer, true)} an elixir of life but it caused no effect on ${Helper.generateGenderString(selectedPlayer, 'him')}. Actually it tasted like wine!`;
        eventLogAseco = 'Aseco wanted to heal you, but you had full health';
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAseco, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAseco),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      hermes: (discordHook, selectedPlayer) => new Promise((resolve) => {
        let eventMsgHermes = '';
        let eventLogHermes = '';
        if (selectedPlayer.gold.current < (selectedPlayer.gold.current / 6)) {
          eventMsgHermes = `Hermes demanded some gold from ${Helper.generatePlayerName(selectedPlayer, true)} but as ${Helper.generateGenderString(selectedPlayer, 'he')} had no money, Hermes left him alone.`;
          eventLogHermes = 'Hermes demanded gold from you but you had nothing to give';
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermes, 'pastEvents');

          return Promise.all([
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermes),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, false)
          ])
            .then(resolve(selectedPlayer));
        }

        const goldTaken = Math.round(selectedPlayer.gold.current / 6);
        eventMsgHermes = `Hermes took ${goldTaken} gold from ${Helper.generatePlayerName(selectedPlayer, true)} by force. Probably he is just out of humor.`
        eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

        selectedPlayer.gold.current -= goldTaken;
        if (selectedPlayer.gold.current < 0) {
          selectedPlayer.gold.current = 0;
        }
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogHermes, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgHermes),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      athena: (discordHook, selectedPlayer) => new Promise((resolve) => {
        const luckExpAthena = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
        selectedPlayer.experience.current += luckExpAthena;
        selectedPlayer.experience.total += luckExpAthena;

        const eventMsgAthena = `Athena shared her wisdom with ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} gain ${luckExpAthena} experience!`;
        const eventLogAthena = `Athena shared her wisdom with you making you gain ${luckExpAthena} experience`;
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogAthena, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgAthena),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAthena, false)
        ])
          .then(resolve(selectedPlayer));
      }),

      eris: (discordHook, selectedPlayer, spell) => new Promise((resolve) => {
        const eventMsgEris = `Eris has given ${Helper.generatePlayerName(selectedPlayer, true)} a scroll containing \`${spell.name}\` to add to ${Helper.generateGenderString(selectedPlayer, 'his')} spellbook!`;
        const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
        if (selectedPlayer.spells.length > 0) {
          let shouldAddToList = false;
          let tempArray;
          selectedPlayer.spells.forEach((ownedSpell, index) => {
            const spellName = ownedSpell.name.split(/ (.+)/)[1];
            if (spell.power > ownedSpell.power) {
              if (spell.name.includes(spellName)) {
                tempArray = selectedPlayer.spells.splice(index, 1);
                shouldAddToList = true;
              } else {
                shouldAddToList = true;
              }
            }
          });

          if (shouldAddToList) {
            if (tempArray) {
              selectedPlayer.spells = tempArray;
            }
            selectedPlayer.spells.push(spell);
          }
        } else {
          selectedPlayer.spells.push(spell);
        }
        selectedPlayer = Helper.logEvent(selectedPlayer, eventLogEris, 'pastEvents');

        return Promise.all([
          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgEris),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, false)
        ])
          .then(resolve(selectedPlayer));
      })
    }
  },

  special: {
    snowFlake: (discordHook, selectedPlayer) => new Promise((resolve) => {
      const snowFlakeDice = Helper.randomBetween(0, 100);
      if (snowFlakeDice <= 15) {
        const snowFlake = this.ItemManager.generateSnowflake(selectedPlayer);
        const oldItemRating = Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.relic);
        const newItemRating = Helper.calculateItemRating(selectedPlayer, snowFlake);
        if (oldItemRating < newItemRating) {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLogSnowflake, 'pastEvents');
          return Promise.all([
            Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsgSnowflake),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogSnowflake, false)
          ])
            .then(resolve(selectedPlayer));
        }
      }

      return resolve(selectedPlayer);
    })
  }
};

module.exports = events;