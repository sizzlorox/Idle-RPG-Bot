const Helper = require('../../utils/Helper');

const events = {
  utils: {
    stealEquip: (discordHook, stealingPlayer, victimPlayer, itemKey) => {
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
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
        Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true);
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog);
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog);
      } else {
        stolenEquip = victimPlayer.equipment[itemKey];
        stolenEquip.name = `${victimPlayer.name}'s ${victimPlayer.equipment[itemKey].name}`;
        const eventMsg = Helper.setImportantMessage(`${stealingPlayer.name} just stole ${stolenEquip.name}!`);
        const eventLog = `Stole ${stolenEquip.name}`;
        const otherPlayerLog = `${stealingPlayer.name} stole ${victimPlayer.equipment[itemKey].name} from you`;

        Helper.sendMessage(discordHook, 'twitch', stealingPlayer, false, eventMsg);
        Helper.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
        Helper.sendPrivateMessage(discordHook, victimPlayer, otherPlayerLog, true);
        stealingPlayer = Helper.logEvent(stealingPlayer, eventLog);
        victimPlayer = Helper.logEvent(victimPlayer, otherPlayerLog);
      }
      victimPlayer.stolen++;
      stealingPlayer.stole++;
      if (victimPlayer.equipment[itemKey].name !== enumHelper.equipment.empty[itemKey].name) {
        if (Helper.calculateItemRating(stealingPlayer, stealingPlayer.equipment[itemKey].power) < Helper.calculateItemRating(victimPlayer, victimPlayer.equipment[itemKey].power)) {
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
          stealingPlayer = this.InventoryManager.addEquipmentIntoInventory(stealingPlayer, stolenEquip);
        }
      }
    }
  }
};

module.exports = events;