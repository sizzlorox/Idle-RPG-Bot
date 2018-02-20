const Helper = require('../../utils/Helper');
const enumHelper = require('../../utils/enumHelper');

const events = {
  utils: {
    randomItemEventMessage: (randomEventInt, selectedPlayer, item) => {
      switch (randomEventInt) {
        case 0:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} found a chest containing \`${item.name}\`!`,
            eventLog: `Found a chest containing ${item.name} in ${selectedPlayer.map.name}`
          };

        case 1:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} found \`${item.name}\` on the ground!`,
            eventLog: `Found ${item.name} on the ground in ${selectedPlayer.map.name}`
          };

        case 2:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} explored an abandoned hut which had \`${item.name}\` inside!`,
            eventLog: `Explored an abandoned hut in ${selectedPlayer.map.name} which had ${item.name} inside`
          };

        case 3:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} a bird just dropped \`${item.name}\` infront of ${Helper.generateGenderString(selectedPlayer, 'him')}!`,
            eventLog: `A bird just dropped ${item.name} infront of you in ${selectedPlayer.map.name}`
          };

        case 4:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} stumbles upon a grizzly scene. One of the corpses has \`${item.name}\` next to it! Seems like it is in good enough condition to use.`,
            eventLog: `You found ${item.name} on a corpse in ${selectedPlayer.map.name}`
          };
        case 5:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} found an altar. \`${item.name}\` is sitting on the center, ready to be used!`,
            eventLog: `On an altar in ${selectedPlayer.map.name} you found ${item.name}`
          };

        case 6:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} catches a glint out of the corner of ${Helper.generateGenderString(selectedPlayer, 'his')} eye. Brushing aside some leaves ${Helper.generatePlayerName(selectedPlayer)} finds \`${item.name}\` left here by the last person to camp at this spot.`,
            eventLog: `Near your camp in ${selectedPlayer.map.name} there was ${item.name}`
          };
        case 7:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} notices something reflecting inside a nearby cave. Exploring it further ${Helper.generateGenderString(selectedPlayer, 'he')} find \`${item.name}\` resting against a wall.`,
            eventLog: `While exploring a cave in ${selectedPlayer.map.name} you found ${item.name}`
          };

        case 8:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} finds a grave with \`${item.name}\` sitting on it. The dead do not need equipment so it's yours for the taking`,
            eventLog: `You stole ${item.name} from a grave in ${selectedPlayer.map.name}`
          };

        case 9:
          return {
            eventMsg: `[\`${selectedPlayer.map.name}\`] ${Helper.generatePlayerName(selectedPlayer)} looks around a derlict building and finds \`${item.name}\` in one of the corners.`,
            eventLog: `Found ${item.name} while looking around a derlict building in ${selectedPlayer.map.name}`
          };
      }
    },

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

    townItem: (InventoryManager, selectedPlayer, item, itemCost) => {
      selectedPlayer.gold -= itemCost;
      if (item.position !== enumHelper.inventory.position) {
        selectedPlayer = Helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types[item.position].position, item);
      } else {
        selectedPlayer = InventoryManager.addItemIntoInventory(selectedPlayer, item);
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

        Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg);
        Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true);
        Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true);
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

        Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg);
        Helper.sendPrivateMessage(discordHook, stealingPlayer, eventLog, true);
        Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true);
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastEvents');
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog, 'pastPvpEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastEvents');
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog, 'pastPvpEvents');
      }
      victimPlayer.stolen++;
      stealingPlayer.stole++;
      if (victimPlayer.equipment[itemKey].name !== enumHelper.equipment.empty[itemKey].name) {
        selectedPlayer.equipment[itemKey].position = itemKey;
        if (Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKey]) < Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKey])) {
          stealingPlayer = Helper.setPlayerEquipment(stealingPlayer, enumHelper.equipment.types[itemKey].position, stolenEquip);
          if (!victimPlayer.equipment[itemKey].previousOwners) {
            stealingPlayer.equipment[itemKey].previousOwners = [`${victimPlayer.name}`];
          } else {
            stealingPlayer.equipment[itemKey].previousOwners = victimPlayer.equipment[itemKey].previousOwners;
            stealingPlayer.equipment[itemKey].previousOwners.push(victimPlayer.name);
          }
          if (victimPlayer.inventory.equipment.length > 0 && victimPlayer.inventory.equipment.find('position', enumHelper.equipment.types[itemKey].position)) {
            const equipFromInventory = victimPlayer.inventory.equipment.filter(equipment => equipment.position === enumHelper.equipment.types[itemKey].position)
              .sort((item1, item2) => {
                return item1.power - item2.power;
              })[0];
            victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKey].position, equipFromInventory);
          } else {
            victimPlayer = Helper.setPlayerEquipment(victimPlayer, enumHelper.equipment.types[itemKey].position, enumHelper.equipment.empty[itemKey]);
          }
        } else {
          stealingPlayer = InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
        }
      }
    }
  }
};

module.exports = events;