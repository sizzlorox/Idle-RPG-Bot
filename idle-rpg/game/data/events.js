const Helper = require('../../utils/Helper');
const enumHelper = require('../../utils/enumHelper');
const messages = require('../data/messages');

const events = {
  messages: {
    randomCampEventMessage: (selectedPlayer) => {
      const randomEventInt = Helper.randomBetween(0, messages.event.camp.length - 1);
      let { eventMsg, eventLog } = messages.event.camp[randomEventInt];
      // TODO: clean up this mess
      const updatedMessages = Helper.generateMessageWithNames(eventMsg, eventLog, selectedPlayer);
      eventMsg = updatedMessages.eventMsg;
      eventLog = updatedMessages.eventLog;

      return { eventMsg, eventLog };
    },

    randomItemEventMessage: (selectedPlayer, item) => {
      const randomEventInt = Helper.randomBetween(0, messages.event.item.length - 1);
      let { eventMsg, eventLog } = messages.event.item[randomEventInt];
      // TODO: clean up this mess
      const updatedMessages = Helper.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, item);
      eventMsg = updatedMessages.eventMsg;
      eventLog = updatedMessages.eventLog;

      return { eventMsg, eventLog };
    },

    randomGambleEventMessage: (selectedPlayer, luckGambleGold, isWin) => {
      if (isWin) {
        const randomEventInt = Helper.randomBetween(0, messages.event.gamble.win.length - 1);
        let { eventMsg, eventLog } = messages.event.gamble.win[randomEventInt];
        // TODO: clean up this mess
        const updatedMessages = Helper.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
        eventMsg = updatedMessages.eventMsg;
        eventLog = updatedMessages.eventLog;

        return { eventMsg, eventLog };
      }

      const randomEventInt = Helper.randomBetween(0, messages.event.gamble.lose.length - 1);
      let { eventMsg, eventLog } = messages.event.gamble.lose[randomEventInt];
      // TODO: clean up this mess
      const updatedMessages = Helper.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
      eventMsg = updatedMessages.eventMsg;
      eventLog = updatedMessages.eventLog;

      return { eventMsg, eventLog };
    }
  },

  utils: {
    dropItem: (InventoryManager, selectedPlayer, item) => {
      if (item.position !== enumHelper.inventory.position) {
        selectedPlayer.equipment[item.position].position = item.position;
        if (Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]) > Helper.calculateItemRating(selectedPlayer, item)) {
          selectedPlayer = InventoryManager.addEquipmentIntoInventory(selectedPlayer, item);
        } else {
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
        }
      } else {
        selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
      }
    },

    townItem: (InventoryManager, discordHook, selectedPlayer, item, itemCost) => {
      const purchasedItem = false;
      if (item.position === enumHelper.inventory.position || Helper.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]) > Helper.calculateItemRating(selectedPlayer, item)) {
        if (item.position !== enumHelper.inventory.position) {
          selectedPlayer.gold -= itemCost;
          selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
        } else if (selectedPlayer.inventory.items.length < enumHelper.inventory.maxItemAmount) {
          selectedPlayer.gold -= itemCost;
          selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
        }

        if (purchasedItem) {
          const eventMsg = `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer, true)} just purchased \`${item.name}\` for ${itemCost} gold!`;
          const eventLog = `Purchased ${item.name} from Town for ${itemCost} Gold`;

          Helper.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg)
            .then(() => Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true));
          selectedPlayer = Helper.logEvent(selectedPlayer, eventLog, 'pastEvents');
        }
      }
    },

    stealEquip: (InventoryManager, discordHook, stealingPlayer, victimPlayer, itemKey) => {
      let stolenEquip;
      if (victimPlayer.equipment[itemKey].previousOwners.length > 0) {
        const lastOwnerInList = victimPlayer.equipment[itemKey].previousOwners[victimPlayer.equipment[itemKey].previousOwners.length - 1];
        const removePreviousOwnerName = victimPlayer.equipment[itemKey].name.replace(`${lastOwnerInList}`, `${victimPlayer.name}`);
        stolenEquip = victimPlayer.equipment[itemKey];
        stolenEquip.name = removePreviousOwnerName;

        const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
        const eventLog = `Stole ${victimPlayer.equipment[itemKey].name}`;
        const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKey].name} from you`;

        Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg)
          .then(() => Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true))
          .then(() => Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true));
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
      } else {
        stolenEquip = victimPlayer.equipment[itemKey];
        stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKey].name}`;
        const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
        const eventLog = `Stole ${stolenEquip.name}`;
        const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKey].name} from you`;

        Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg)
          .then(() => Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true))
          .then(() => Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true));
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
      }
      victimPlayer.stolen++;
      stealingPlayer.stole++;
      if (victimPlayer.equipment[itemKey].name !== enumHelper.equipment.empty[itemKey].name) {
        stealingPlayer.equipment[itemKey].position = itemKey;
        victimPlayer.equipment[itemKey].position = itemKey;
        if (Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKey]) < Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKey])) {
          stealingPlayer = Helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKey].position, stolenEquip);
          if (victimPlayer.equipment[itemKey].previousOwners.length > 0) {
            stealingPlayer.equipment[itemKey].previousOwners = victimPlayer.equipment[itemKey].previousOwners;
            stealingPlayer.equipment[itemKey].previousOwners.push(victimPlayer.name);
          } else {
            stealingPlayer.equipment[itemKey].previousOwners = [`${victimPlayer.name}`];
          }
        } else {
          stealingPlayer = InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
        }
        if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find(equip => equip.position === enumHelper.equipment.types[itemKey].position) !== undefined) {
          const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKey].position)
            .sort((item1, item2) => {
              return item1.power - item2.power;
            })[0];
          victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKey].position, equipFromInventory);
        } else {
          victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKey].position, enumHelper.equipment.empty[itemKey]);
        }
      }
    }
  }
};

module.exports = events;