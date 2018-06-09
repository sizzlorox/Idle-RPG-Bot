const enumHelper = require('../../utils/enumHelper');
const { pvpLevelRestriction } = require('../../../settings');
const { errorLog } = require('../../utils/logger');

function pveMessageFormat(Helper, results, selectedPlayer, playerMaxHealth, multiplier) {
  const mobListResult = [];
  const mobListInfo = { mobs: [] };
  let isQuestCompleted = false;
  let eventMsg = `[\`${results.attacker.map.name}\`] `;
  let mobCountString = '';
  let mobKillCountString = '';
  let mobFleeCountString = '';
  let expGain = 0;
  let goldGain = 0;
  let questExpGain = 0;
  let questGoldGain = 0;
  let eventLog = '';

  results.defender.forEach((mob) => {

    let infoList = mobListInfo.mobs.findIndex(arrayMob => arrayMob.mob === mob.name);
    if (infoList !== -1) {
      mobListInfo.mobs[infoList].totalCount++;
    } else {
      mobListInfo.mobs.push({
        mob: mob.name,
        totalCount: 0,
        event: {
          killed: 0,
          fled: 0
        }
      });
    }
    infoList = mobListInfo.mobs.findIndex(arrayMob => arrayMob.mob === mob.name);
    expGain += Math.ceil(((mob.experience * multiplier) + (mob.dmgDealt / 4)) / 6);

    if (mob.health <= 0) {
      goldGain += Math.floor((mob.gold * multiplier));
      mobListInfo.mobs[infoList].event.killed++;
    } else if (mob.health > 0 && selectedPlayer.health > 0) {
      mobListInfo.mobs[infoList].event.fled++;
    }

    if (!selectedPlayer.quest.questMob.name.includes('None') && mob.name.includes(selectedPlayer.quest.questMob.name) && mob.health <= 0) {
      selectedPlayer.quest.questMob.killCount++;
      if (selectedPlayer.quest.questMob.killCount >= selectedPlayer.quest.questMob.count) {
        isQuestCompleted = true;
        questExpGain = (expGain * selectedPlayer.quest.questMob.count) / 2;
        questGoldGain = (goldGain * selectedPlayer.quest.questMob.count) / 2;
        selectedPlayer.quest.questMob.name = 'None';
        selectedPlayer.quest.questMob.count = 0;
        selectedPlayer.quest.questMob.killCount = 0;
        selectedPlayer.quest.completed++;
      }
    }

    if (Math.floor(results.defenderDamage / (results.defender.length)) > 0) {
      mobListResult.push(`  ${mob.name}'s ${mob.equipment.weapon.name} did ${mob.dmgDealt} damage.
  ${mob.health <= 0 ? `${mob.name} took ${mob.dmgReceived} dmg and died.` : `${mob.name} took ${mob.dmgReceived} dmg and has ${mob.health} / ${mob.maxHealth} HP left.`}`);
    }
  });
  let battleResult = `Battle Results:
  You have ${selectedPlayer.health} / ${playerMaxHealth} HP left.
${mobListResult.join('\n')}`;

  if (selectedPlayer.health <= 0) {
    battleResult = battleResult.replace(`  You have ${selectedPlayer.health} / ${playerMaxHealth} HP left.`, '');
    const killerMob = results.defender.map((mob) => {
      if (mob.dmgDealt > 0) {
        return mob.name;
      }

      return '';
    }).join(', ').replace(/,$/g, '');
    eventMsg = eventMsg.concat(`${killerMob} just killed ${Helper.generatePlayerName(selectedPlayer, true)}!\n`);
    eventLog = eventLog.concat(`${killerMob} just killed you!\n`);
  }
  const eventMsgResults = `↳ ${Helper.capitalizeFirstLetter(Helper.generateGenderString(selectedPlayer, 'he'))} dealt \`${results.attackerDamage}\` dmg, received \`${results.defenderDamage}\` dmg and gained \`${expGain}\` exp${goldGain === 0 ? '' : ` and \`${goldGain}\` gold`}! [HP:${selectedPlayer.health}/${playerMaxHealth}]`;

  mobListInfo.mobs.forEach((mobInfo, i) => {
    mobCountString = i > 0 ? mobCountString.concat(`, ${mobInfo.event.killed + mobInfo.event.fled}x \`${mobInfo.mob}\``) : mobCountString.concat(`${mobInfo.event.killed + mobInfo.event.fled}x \`${mobInfo.mob}\``);
    if (mobInfo.event.killed > 0) {
      mobKillCountString = mobKillCountString !== '' ? mobKillCountString.concat(`, ${mobInfo.event.killed}x \`${mobInfo.mob}\``) : mobKillCountString.concat(`${mobInfo.event.killed}x \`${mobInfo.mob}\``);
    }
    if (mobInfo.event.fled > 0) {
      mobFleeCountString = mobKillCountString !== '' ? mobFleeCountString.concat(`, ${mobInfo.event.fled}x \`${mobInfo.mob}\``) : mobFleeCountString.concat(`${mobInfo.event.fled}x \`${mobInfo.mob}\``);
    }
  });

  if (mobFleeCountString) {
    eventMsg = eventMsg.concat(results.attackerDamage > results.defenderDamage
      ? `${mobFleeCountString} just fled from ${Helper.generatePlayerName(results.attacker, true)}!\n`
      : `${Helper.generatePlayerName(results.attacker, true)} just fled from ${mobFleeCountString}!\n`);
    eventLog = eventLog.concat(results.attackerDamage > results.defenderDamage
      ? `${mobFleeCountString} fled from you! [${expGain}exp]\n`
      : `You fled from ${mobFleeCountString}! [${expGain}exp]\n`);
  }

  if (mobKillCountString) {
    eventMsg = eventMsg.concat(`${Helper.generatePlayerName(selectedPlayer, true)}'s \`${selectedPlayer.equipment.weapon.name}\` just killed ${mobKillCountString}\n`);
    eventLog = eventLog.concat(`You killed ${mobKillCountString}! [\`${expGain}\` exp${goldGain === 0 ? '' : ` / \`${goldGain}\` gold`}]\n`);
  }
  const attackedMsg = `Attacked ${mobCountString.replace(/`/g, '')} with \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\`\n`;
  eventMsg = eventMsg.concat(eventMsgResults).replace(/1x /g, '').replace(/\n$/g, '');
  const pmMsg = attackedMsg.replace(/1x /g, '').concat('```').concat(battleResult).concat('```').concat(eventLog.replace(/1x /g, '').replace(/\n$/g, ''));

  return {
    selectedPlayer,
    expGain,
    goldGain,
    questExpGain,
    questGoldGain,
    eventMsg,
    eventLog,
    pmMsg,
    isQuestCompleted
  };
}

const events = {
  movement: {
    /**
     * Updates player map, sends move event message
     * @param {Hooks} discordHook
     * @param {Player} selectedPlayer
     * @param { map, direction } mapObj
     * @returns {Player} updatedPlayer
     */
    movePlayer: (discordHook, Database, Helper, selectedPlayer, mapObj) => new Promise((resolve) => {
      const previousMap = selectedPlayer.map;
      selectedPlayer.map = mapObj.map;
      const eventMsg = `${Helper.generatePlayerName(selectedPlayer)} decided to head \`${mapObj.direction}\` from \`${previousMap.name}\` and arrived in \`${mapObj.map.name}\`.`;
      const eventLog = `Moved ${mapObj.direction} from ${previousMap.name} and arrived in ${mapObj.map.name}`;

      return Promise.all([
        Helper.sendMessage(discordHook, selectedPlayer, true, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, false),
        Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.move)
      ])
        .then(resolve(selectedPlayer));
    })
  },

  /**
   * Regenerates HP and MP and sends random camp event message
   * @param {Hooks} discordHook
   * @param {Player} selectedPlayer
   * @returns {Player} updatedPlayer
   */
  camp: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
    selectedPlayer = Helper.passiveRegen(selectedPlayer, ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.end / 2), ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.int / 2));
    // TODO: Make more camp event messages to be selected randomly
    const { eventMsg, eventLog } = Helper.randomCampEventMessage(selectedPlayer);

    return Promise.all([
      Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
      Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
      Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
    ])
      .then(resolve(selectedPlayer));
  }),

  town: {
    /**
     * Sells equipment inside players inventory
     * @param {Hooks} discordHook
     * @param {Player} selectedPlayer
     * @returns {Player} updatedPlayer
     */
    sell: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
      if (selectedPlayer.inventory.equipment.length > 0) {
        let profit = 0;
        selectedPlayer.inventory.equipment.forEach((equipment) => {
          profit += Number(equipment.gold);
        });
        selectedPlayer.inventory.equipment.length = 0;
        profit = Math.floor(profit);
        selectedPlayer.gold.current += profit;
        selectedPlayer.gold.total += profit;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just sold what they found adventuring for ${profit} gold!`;
        const eventLog = `Made ${profit} gold selling what you found adventuring`;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    }),

    /**
     * Purchases item from town
     * @param {Hooks} discordHook
     * @param {Player} selectedPlayer
     * @param {Item} item
     * @param {InventoryManager} InventoryManager
     * @returns {Player} updatedPlayer
     */
    item: (discordHook, Database, Helper, selectedPlayer, item, InventoryManager) => new Promise(async (resolve) => {
      const itemCost = Math.round(item.gold);

      if (selectedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
        return resolve(selectedPlayer);
      }

      if (item.position !== enumHelper.inventory.position) {
        selectedPlayer.equipment[item.position].position = enumHelper.equipment.types[item.position].position;
        const oldItemRating = await Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
        const newItemRating = await Helper.calculateItemRating(selectedPlayer, item);
        if (oldItemRating > newItemRating) {
          return resolve(selectedPlayer);
        }
        selectedPlayer.gold.current -= itemCost;
        selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
      } else if (selectedPlayer.inventory.items.length >= enumHelper.inventory.maxItemAmount) {
        return resolve(selectedPlayer);
      } else {
        selectedPlayer.gold.current -= itemCost;
        selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
      }

      const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just purchased \`${item.name}\` for ${itemCost} gold!`;
      const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;

      return Promise.all([
        Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
        Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
      ])
        .then(resolve(selectedPlayer));
    })
  },

  battle: {
    /**
     * Returns a random player in same map else returns empty object
     * @param {Player} selectedPlayer
     * @param {PlayerList} mappedPlayers
     * @param {PlayerList} onlinePlayers
     * @returns {Player} randomPlayer
     */
    pvpPreperation: (Helper, selectedPlayer, mappedPlayers, onlinePlayers) => new Promise((resolve) => {
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

    /**
     * Sends battle result messages and updates player objects
     * @param {hooks} discordHook
     * @param { attacker, defender, attackerDamage, defenderDamage } battleResults
     * @returns { result, updatedAttacker, updatedDefender } updatedBattleResults
     */
    pvpResults: (discordHook, Database, Helper, { attacker, defender, attackerDamage, defenderDamage }) => new Promise((resolve) => {
      const defenderMaxHealth = 100 + (defender.level * 5);
      const playerMaxHealth = 100 + (attacker.level * 5);

      let battleResult = `Battle Results:
  ${attacker.name}'s ${attacker.equipment.weapon.name} did ${attackerDamage} damage.
  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.
  ${defender.name}'s ${defender.equipment.weapon.name} did ${defenderDamage} damage.
  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`;

      if (attacker.health <= 0) {
        battleResult = battleResult.replace(`  ${attacker.name} has ${attacker.health}/${playerMaxHealth} HP left.`, '');
        const eventMsg = `[\`${attacker.map.name}\`] ${Helper.generatePlayerName(defender, true)} just killed ${Helper.generatePlayerName(attacker, true)} with ${Helper.generateGenderString(defender, 'his')} \`${defender.equipment.weapon.name}\`!
  ${Helper.generatePlayerName(attacker, true)} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [${Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;

        const expGain = Math.floor(attackerDamage / 8);
        const eventLog = `Died to ${defender.name} in ${attacker.map.name}.`;
        const otherPlayerLog = `Killed ${attacker.name} in ${attacker.map.name}. [${expGain} exp]`;

        attacker.battles.lost++;
        defender.battles.won++;
        defender.experience.current += expGain;
        defender.experience.total += expGain;

        return Promise.all([
          Helper.sendMessage(discordHook, attacker, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, attacker, '```'.concat(battleResult).concat('```').concat(eventLog), true),
          Helper.sendPrivateMessage(discordHook, defender, '```'.concat(battleResult).concat('```').concat(otherPlayerLog), true),
          Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.action),
          Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.action),
          Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.pvp),
          Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.pvp)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.lost,
            updatedAttacker: attacker,
            updatedDefender: defender
          }));
      }

      if (defender.health > 0 && attacker.health > 0) {
        const eventMsg = attackerDamage > defenderDamage
          ? `[\`${attacker.map.name}\`] ${Helper.generatePlayerName(attacker, true)} attacked ${Helper.generatePlayerName(defender, true)} with ${Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${Helper.generateGenderString(defender, 'he')} managed to get away!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`
          : `[\`${attacker.map.name}\`] ${Helper.generatePlayerName(attacker, true)} attacked ${Helper.generatePlayerName(defender, true)} with ${Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\` but ${Helper.generatePlayerName(defender, true)} was too strong!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;

        const expGainAttacker = Math.floor(defenderDamage / 8);
        const expGainDefender = Math.floor(attackerDamage / 8);
        const eventLog = `Attacked ${defender.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and dealt ${attackerDamage} damage! [${expGainAttacker} exp]`;
        const otherPlayerLog = `Attacked by ${attacker.name} in ${attacker.map.name} with ${attacker.equipment.weapon.name} and received ${attackerDamage} damage! [${expGainDefender} exp]`;

        attacker.experience.current += expGainAttacker;
        attacker.experience.total += expGainAttacker;
        defender.experience.current += expGainDefender;
        defender.experience.total += expGainDefender;

        return Promise.all([
          Helper.sendMessage(discordHook, attacker, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, attacker, '```'.concat(battleResult).concat('```').concat(eventLog), true),
          Helper.sendPrivateMessage(discordHook, defender, '```'.concat(battleResult).concat('```').concat(otherPlayerLog), true),
          Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.action),
          Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.action),
          Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.pvp),
          Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.pvp)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.fled,
            updatedAttacker: attacker,
            updatedDefender: defender
          }));
      }

      battleResult = battleResult.replace(`  ${defender.name} has ${defender.health}/${defenderMaxHealth} HP left.`, '');
      const expGain = Math.floor(defenderDamage / 8);
      const eventMsg = `[\`${attacker.map.name}\`] ${Helper.generatePlayerName(attacker, true)} just killed \`${defender.name}\` with ${Helper.generateGenderString(attacker, 'his')} \`${attacker.equipment.weapon.name}\`!
  ${Helper.capitalizeFirstLetter(Helper.generateGenderString(attacker, 'he'))} dealt \`${attackerDamage}\` dmg, received \`${defenderDamage}\` dmg! [HP:${attacker.health}/${playerMaxHealth}]-[${Helper.generatePlayerName(defender, true)} HP:${defender.health}/${defenderMaxHealth}]`;
      const eventLog = `Killed ${defender.name} in ${attacker.map.name}. [${expGain} exp]`;
      const otherPlayerLog = `Died to ${attacker.name} in ${attacker.map.name}.`;

      attacker.battles.won++;
      defender.battles.lost++;
      attacker.experience.current += expGain;
      attacker.experience.total += expGain;

      return Promise.all([
        Helper.sendMessage(discordHook, attacker, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, attacker, '```'.concat(battleResult).concat('```').concat(eventLog), true),
        Helper.sendPrivateMessage(discordHook, defender, '```'.concat(battleResult).concat('```').concat(otherPlayerLog), true),
        Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.action),
        Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.action),
        Helper.logEvent(attacker, Database, eventLog, enumHelper.logTypes.pvp),
        Helper.logEvent(defender, Database, otherPlayerLog, enumHelper.logTypes.pvp)
      ])
        .then(resolve({
          result: enumHelper.battle.outcomes.win,
          updatedAttacker: attacker,
          updatedDefender: defender
        }));
    }),

    /**
     * Sends battle result messages and updates player object
     * @param {hooks} discordHook
     * @param {MapClass} MapClass
     * @param {battleResults} results
     * @param {Number} multiplier
     * @returns { result, updatedAttacker, updatedDefender } updatedBattleResults
     */
    pveResults: (discordHook, Database, Helper, MapClass, results, multiplier) => new Promise((resolve) => {
      const playerMaxHealth = 100 + (results.attacker.level * 5);
      const {
        selectedPlayer,
        expGain,
        goldGain,
        questExpGain,
        questGoldGain,
        eventMsg,
        eventLog,
        pmMsg,
        isQuestCompleted
      } = pveMessageFormat(Helper, results, results.attacker, playerMaxHealth, multiplier);

      if (selectedPlayer.health <= 0) {
        selectedPlayer.battles.lost++;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, pmMsg, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.lost,
            updatedPlayer: selectedPlayer,
            updatedMob: results.defender
          }));
      }

      if (results.defender.filter(mob => mob.health > 0).length > 0 && selectedPlayer.health > 0) {
        selectedPlayer.experience.current += expGain;
        selectedPlayer.experience.total += expGain;
        selectedPlayer.gold.current += goldGain + questGoldGain;
        selectedPlayer.gold.total += goldGain + questGoldGain;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, pmMsg, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve({
            result: enumHelper.battle.outcomes.fled,
            updatedPlayer: selectedPlayer,
            updatedMob: results.defender
          }));
      }

      selectedPlayer.experience.current += expGain + questExpGain;
      selectedPlayer.experience.total += expGain + questExpGain;
      selectedPlayer.gold.current += goldGain + questGoldGain;
      selectedPlayer.gold.total += goldGain + questGoldGain;
      selectedPlayer.kills.mob++;
      selectedPlayer.battles.won++;

      return Promise.all([
        Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, pmMsg, true),
        Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action),
        isQuestCompleted ? Helper.sendMessage(discordHook, selectedPlayer, false, `${Helper.generatePlayerName(selectedPlayer, true)} finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`) : '',
        isQuestCompleted ? Helper.sendPrivateMessage(discordHook, selectedPlayer, 'test', true) : `Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`,
        isQuestCompleted ? Helper.logEvent(discordHook, Database, `Finished a quest and gained an extra ${questExpGain} exp and ${questGoldGain} gold!`, enumHelper.logTypes.action) : ''
      ])
        .then(resolve({
          result: enumHelper.battle.outcomes.win,
          updatedPlayer: selectedPlayer,
          updatedMob: results.defender
        }));
    }),

    steal: (discordHook, Database, Helper, stealingPlayer, victimPlayer, InventoryManager) => new Promise(async (resolve) => {
      const luckStealChance = Helper.randomBetween(0, 100);
      const chance = Math.floor((victimPlayer.currentBounty * Math.log(1.2)) / 100);
      const canSteal = !Number.isFinite(chance) ? 0 : chance;
      let eventMsg = '';
      let eventLog = '';
      let otherPlayerLog = '';

      if (luckStealChance > (90 - canSteal)) {
        const luckItem = Helper.randomBetween(0, 2);
        const itemKeys = [enumHelper.equipment.types.helmet.position, enumHelper.equipment.types.armor.position, enumHelper.equipment.types.weapon.position];

        if (![enumHelper.equipment.empty.armor.name, enumHelper.equipment.empty.weapon.name].includes(victimPlayer.equipment[itemKeys[luckItem]].name)) {
          let stolenEquip;
          if (victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length > 0) {
            const lastOwnerInList = victimPlayer.equipment[itemKeys[luckItem]].previousOwners[victimPlayer.equipment[itemKeys[luckItem]].previousOwners.length - 1];
            const removePreviousOwnerName = victimPlayer.equipment[itemKeys[luckItem]].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = removePreviousOwnerName;

            eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
            eventLog = `Stole ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
          } else {
            stolenEquip = victimPlayer.equipment[itemKeys[luckItem]];
            stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKeys[luckItem]].name}`;
            eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
            eventLog = `Stole ${stolenEquip.name}`;
            otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKeys[luckItem]].name} from you`;
          }
          victimPlayer.stolen++;
          stealingPlayer.stole++;
          if (victimPlayer.equipment[itemKeys[luckItem]].name !== enumHelper.equipment.empty[itemKeys[luckItem]].name) {
            const oldItemRating = await Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKeys[luckItem]]);
            const newItemRating = await Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKeys[luckItem]]);
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
                .sort((item1, item2) => item2.power - item1.power)[0];
              victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, equipFromInventory);
            } else {
              victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKeys[luckItem]].position, enumHelper.equipment.empty[itemKeys[luckItem]]);
            }
          }
        }

        return Promise.all([
          Helper.sendMessage(discordHook, stealingPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true),
          Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true),
          Helper.logEvent(stealingPlayer, Database, eventLog, enumHelper.logTypes.action),
          Helper.logEvent(victimPlayer, Database, otherPlayerLog, enumHelper.logTypes.action),
          Helper.logEvent(stealingPlayer, Database, eventLog, enumHelper.logTypes.pvp),
          Helper.logEvent(victimPlayer, Database, otherPlayerLog, enumHelper.logTypes.pvp)
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

          return Promise.all([
            Helper.sendMessage(discordHook, stealingPlayer, false, eventMsg),
            Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true),
            Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true),
            Helper.logEvent(stealingPlayer, Database, eventLog, enumHelper.logTypes.action),
            Helper.logEvent(victimPlayer, Database, otherPlayerLog, enumHelper.logTypes.action),
            Helper.logEvent(stealingPlayer, Database, eventLog, enumHelper.logTypes.pvp),
            Helper.logEvent(victimPlayer, Database, otherPlayerLog, enumHelper.logTypes.pvp)
          ])
            .then(resolve({ stealingPlayer, victimPlayer }));
        }
      }

      return resolve({ stealingPlayer, victimPlayer });
    }),

    quest: (discordHook, Database, Helper, selectedPlayer, mob) => new Promise((resolve) => {
      if (!selectedPlayer.quest.questMob.includes('None')) {
        return resolve(selectedPlayer);
      }

      selectedPlayer.quest.questMob = mob;
      selectedPlayer.quest.count = Helper.randomBetween(1, 15);
      selectedPlayer.quest.killCount = 0;
      const eventMsg = `[\`${selectedPlayer.map.name}\`] Quest Master has asked ${Helper.generatePlayerName(selectedPlayer, true)} to kill ${selectedPlayer.quest.count === 1 ? 'a' : selectedPlayer.quest.count} ${mob}!`;
      const eventLog = `Quest Master in ${selectedPlayer.map.name} asked you to kill ${selectedPlayer.quest.count === 1 ? 'a' : selectedPlayer.quest.count} ${mob}.`;

      return Promise.all([
        Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
        Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
      ])
        .then(resolve(selectedPlayer));
    }),

    dropItem: (discordHook, Database, Helper, selectedPlayer, mob, ItemManager, InventoryManager) => new Promise((resolve) => {
      const dropitemChance = Helper.randomBetween(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 4)) {
        return ItemManager.generateItem(selectedPlayer, mob.find(obj => obj.health <= 0))
          .then(async (item) => {
            if (item.position !== enumHelper.inventory.position) {
              const oldItemRating = await Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
              const newItemRating = await Helper.calculateItemRating(selectedPlayer, item);
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
              eventMsg = `${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\``;
            } else {
              eventMsg = `**${Helper.generatePlayerName(selectedPlayer, true)} received \`${item.name}\` from \`${mob.find(obj => obj.health <= 0).name}!\`**`;
            }
            const eventLog = `Received ${item.name} from ${mob[0].name}`;

            return Promise.all([
              Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
              Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
              Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
            ])
              .then(resolve(selectedPlayer));
          });
      }

      return resolve(selectedPlayer);
    })
  },

  luck: {
    item: {
      spell: (discordHook, Database, Helper, selectedPlayer, spell) => new Promise((resolve) => {
        const { eventMsg, eventLog } = Helper.randomItemEventMessage(selectedPlayer, spell);
        if (selectedPlayer.spells.length > 0) {
          let shouldAddToList = false;
          selectedPlayer.spells.forEach((ownedSpell, index) => {
            const spellName = ownedSpell.name.split(/ (.+)/)[1];
            if (spell.power > ownedSpell.power) {
              if (spell.name.includes(spellName)) {
                selectedPlayer.spells.splice(index, 1);
                shouldAddToList = true;
              } else {
                shouldAddToList = true;
              }
            }
          });

          if (shouldAddToList) {
            selectedPlayer.spells.push(spell);

            return Promise.all([
              Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
              Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
              Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
            ])
              .then(resolve(selectedPlayer));
          }
        } else {
          selectedPlayer.spells.push(spell);

          return Promise.all([
            Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
            Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
          ])
            .then(resolve(selectedPlayer));
        }

        return resolve(selectedPlayer);
      }),

      item: (discordHook, Database, Helper, selectedPlayer, item, InventoryManager) => new Promise(async (resolve) => {
        const { eventMsg, eventLog } = Helper.randomItemEventMessage(selectedPlayer, item);
        if (item.position !== enumHelper.inventory.position) {
          const oldItemRating = await Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
          const newItemRating = await Helper.calculateItemRating(selectedPlayer, item);
          if (oldItemRating > newItemRating) {
            selectedPlayer = InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
          } else {
            selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, item.position, item);
          }
        } else {
          selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
        }

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      })
    },

    gold: (discordHook, Database, Helper, selectedPlayer, multiplier) => new Promise((resolve) => {
      const luckGoldChance = Helper.randomBetween(0, 100);
      if (luckGoldChance >= 75) {
        const luckGoldDice = Helper.randomBetween(5, 100);
        const goldAmount = Math.round((luckGoldDice * selectedPlayer.stats.luk) / 2) * multiplier;
        selectedPlayer.gold.current += goldAmount;
        selectedPlayer.gold.total += goldAmount;

        const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} found ${goldAmount} gold!`;
        const eventLog = `Found ${goldAmount} gold in ${selectedPlayer.map.name}`;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    }),

    gambling: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
      if (selectedPlayer.gold.current < 10) {
        return resolve(selectedPlayer);
      }

      const luckGambleChance = Helper.randomBetween(0, 100);
      const luckGambleGold = Math.round(Helper.randomBetween(selectedPlayer.gold.current / 10, selectedPlayer.gold.current / 3));
      selectedPlayer.gambles++;

      if (luckGambleChance <= 50 - (selectedPlayer.stats.luk / 4)) {
        const { eventMsg, eventLog } = Helper.randomGambleEventMessage(selectedPlayer, luckGambleGold, false);
        selectedPlayer.gold.current -= luckGambleGold;
        selectedPlayer.gold.gambles.lost += luckGambleGold;
        if (selectedPlayer.gold.current <= 0) {
          selectedPlayer.gold.current = 0;
        }

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }
      const { eventMsg, eventLog } = Helper.randomGambleEventMessage(selectedPlayer, luckGambleGold, true);
      selectedPlayer.gold.current += luckGambleGold;
      selectedPlayer.gold.total += luckGambleGold;
      selectedPlayer.gold.gambles.won += luckGambleGold;

      return Promise.all([
        Helper.sendMessage(discordHook, selectedPlayer, false, eventMsg),
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
        Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
      ])
        .then(resolve(selectedPlayer));
    }),

    gods: {
      hades: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        const luckExpAmount = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
        selectedPlayer.experience.current -= luckExpAmount;
        selectedPlayer.experience.lost += luckExpAmount;
        if (selectedPlayer.experience.current < 0) {
          selectedPlayer.experience.current = 0;
        }

        const eventMsgHades = `Hades unleashed his wrath upon ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} lose ${luckExpAmount} experience!`;
        const eventLogHades = `Hades unleashed his wrath upon you making you lose ${luckExpAmount} experience`;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgHades),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHades, true),
          Helper.logEvent(selectedPlayer, Database, eventLogHades, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }),

      zeus: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        const luckHealthAmount = Helper.randomBetween(5, 50 + (selectedPlayer.level * 2));
        selectedPlayer.health -= luckHealthAmount;

        const eventMsgZeus = `${Helper.generatePlayerName(selectedPlayer, true)} was struck down by a thunderbolt from Zeus and lost ${luckHealthAmount} health because of that!`;
        const eventLogZeus = `Zeus struck you down with his thunderbolt and you lost ${luckHealthAmount} health`;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgZeus),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogZeus, true),
          Helper.logEvent(selectedPlayer, Database, eventLogZeus, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }),

      aseco: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        const healthDeficit = (100 + (selectedPlayer.level * 5)) - selectedPlayer.health;
        let eventMsgAseco = '';
        let eventLogAseco = '';

        if (healthDeficit) {
          const healAmount = Math.round(healthDeficit / 3);
          eventMsgAseco = `Fortune smiles upon ${Helper.generatePlayerName(selectedPlayer, true)} as Aseco cured ${Helper.generateGenderString(selectedPlayer, 'his')} sickness and restored ${Helper.generateGenderString(selectedPlayer, 'him')} ${healAmount} health!`;
          eventLogAseco = `Aseco healed you for ${healAmount}`;

          selectedPlayer.health += healAmount;

          return Promise.all([
            Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgAseco),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, true),
            Helper.logEvent(selectedPlayer, Database, eventLogAseco, enumHelper.logTypes.action)
          ])
            .then(resolve(selectedPlayer));
        }

        eventMsgAseco = `Aseco gave ${Helper.generatePlayerName(selectedPlayer, true)} an elixir of life but it caused no effect on ${Helper.generateGenderString(selectedPlayer, 'him')}. Actually it tasted like wine!`;
        eventLogAseco = 'Aseco wanted to heal you, but you had full health';

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgAseco),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAseco, true),
          Helper.logEvent(selectedPlayer, Database, eventLogAseco, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }),

      hermes: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        let eventMsgHermes = '';
        let eventLogHermes = '';
        const goldTaken = Math.ceil(selectedPlayer.gold.current / 6);

        if (selectedPlayer.gold.current < goldTaken) {
          eventMsgHermes = `Hermes demanded some gold from ${Helper.generatePlayerName(selectedPlayer, true)} but as ${Helper.generateGenderString(selectedPlayer, 'he')} had no money, Hermes left him alone.`;
          eventLogHermes = 'Hermes demanded gold from you but you had nothing to give';

          return Promise.all([
            Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgHermes),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, true),
            Helper.logEvent(selectedPlayer, Database, eventLogHermes, enumHelper.logTypes.action)
          ])
            .then(resolve(selectedPlayer));
        }
        eventMsgHermes = `Hermes took ${goldTaken} gold from ${Helper.generatePlayerName(selectedPlayer, true)} by force. Probably he is just out of humor.`;
        eventLogHermes = `Hermes took ${goldTaken} gold from you. It will be spent in favor of Greek pantheon. He promises!`;

        selectedPlayer.gold.current -= goldTaken;
        if (selectedPlayer.gold.current < 0) {
          selectedPlayer.gold.current = 0;
        }

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgHermes),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogHermes, true),
          Helper.logEvent(selectedPlayer, Database, eventLogHermes, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }),

      athena: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        const luckExpAthena = Helper.randomBetween(5, 15 + (selectedPlayer.level * 2));
        selectedPlayer.experience.current += luckExpAthena;
        selectedPlayer.experience.total += luckExpAthena;

        const eventMsgAthena = `Athena shared her wisdom with ${Helper.generatePlayerName(selectedPlayer, true)} making ${Helper.generateGenderString(selectedPlayer, 'him')} gain ${luckExpAthena} experience!`;
        const eventLogAthena = `Athena shared her wisdom with you making you gain ${luckExpAthena} experience`;

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgAthena),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogAthena, true),
          Helper.logEvent(selectedPlayer, Database, eventLogAthena, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      }),

      eris: (discordHook, Database, Helper, selectedPlayer, spell) => new Promise((resolve) => {
        const eventMsgEris = `Eris has given ${Helper.generatePlayerName(selectedPlayer, true)} a scroll containing \`${spell.name}\` to add to ${Helper.generateGenderString(selectedPlayer, 'his')} spellbook!`;
        const eventLogEris = `Eris gave you a scroll of ${spell.name}`;
        if (selectedPlayer.spells.length > 0) {
          let shouldAddToList = false;
          selectedPlayer.spells.forEach((ownedSpell, index) => {
            const spellName = ownedSpell.name.split(/ (.+)/)[1];
            if (spell.power > ownedSpell.power) {
              if (spell.name.includes(spellName)) {
                selectedPlayer.spells.splice(index, 1);
                shouldAddToList = true;
              } else {
                shouldAddToList = true;
              }
            }
          });

          if (shouldAddToList) {
            selectedPlayer.spells.push(spell);

            return Promise.all([
              Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgEris),
              Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, true),
              Helper.logEvent(selectedPlayer, Database, eventLogEris, enumHelper.logTypes.action)
            ])
              .then(resolve(selectedPlayer));
          }
        } else {
          selectedPlayer.spells.push(spell);

          return Promise.all([
            Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgEris),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogEris, true),
            Helper.logEvent(selectedPlayer, Database, eventLogEris, enumHelper.logTypes.action)
          ])
            .then(resolve(selectedPlayer));
        }

        return resolve(selectedPlayer);
      }),

      dionysus: (discordHook, Database, Helper, selectedPlayer) => new Promise((resolve) => {
        // TODO: Remove this god after testing if has problem saving via setTimeout
        // Might overwrite his event if currently saving if he fired and event at the same time.
        const increaseMult = Helper.randomBetween(1, 3);
        const timeLimit = Helper.randomBetween(10000, 1800000);

        const eventMsgDionysus = `Dionysus has partied with ${Helper.generatePlayerName(selectedPlayer, true)} increasing ${Helper.generateGenderString(selectedPlayer, 'his')} multiplier by ${increaseMult} for ${Math.floor(timeLimit / 60000)} minutes!`;
        const eventLogDionysus = `Dionysus partied with you increasing your multiplier by ${increaseMult} for ${Math.floor(timeLimit / 60000)} minutes!`;
        selectedPlayer.personalMultiplier = increaseMult;
        setTimeout(() => {
          Database.loadPlayer(selectedPlayer.discordId)
            .then((loadedPlayer) => {
              loadedPlayer.personalMultiplier = 0;
              return loadedPlayer;
            })
            .then(updatedPlayer => Database.savePlayer(updatedPlayer));
        }, timeLimit);

        return Promise.all([
          Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgDionysus),
          Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogDionysus, true),
          Helper.logEvent(selectedPlayer, Database, eventLogDionysus, enumHelper.logTypes.action)
        ])
          .then(resolve(selectedPlayer));
      })
    }
  },

  special: {
    snowFlake: (discordHook, Database, Helper, selectedPlayer) => new Promise(async (resolve) => {
      const snowFlakeDice = Helper.randomBetween(0, 100);
      if (snowFlakeDice <= 5) {
        const snowFlake = this.ItemManager.generateSnowflake(selectedPlayer);
        const oldItemRating = await Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment.relic);
        const newItemRating = await Helper.calculateItemRating(selectedPlayer, snowFlake);
        if (oldItemRating < newItemRating) {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.relic.position, snowFlake);
          const eventMsgSnowflake = `<@!${selectedPlayer.discordId}> **just caught a strange looking snowflake within the blizzard!**`;
          const eventLogSnowflake = 'You caught a strange looking snowflake while travelling inside the blizzard.';
          return Promise.all([
            Helper.sendMessage(discordHook, selectedPlayer, false, eventMsgSnowflake),
            Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLogSnowflake, true),
            Helper.logEvent(selectedPlayer, Database, eventLog, enumHelper.logTypes.action)
          ])
            .then(resolve(selectedPlayer));
        }
      }

      return resolve(selectedPlayer);
    })
  }
};
module.exports = events;
