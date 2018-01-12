const { inventory } = require('../../utils/enumHelper');

class Inventory {

  addEquipmentIntoInventory(selectedPlayer, equipment) {
    if (selectedPlayer.inventory.equipment.length < inventory.maxEquipmentAmount) {
      selectedPlayer.inventory.equipment.push(equipment);
    }

    return selectedPlayer;
  }

  addItemIntoInventory(selectedPlayer, item) {
    if (selectedPlayer.inventory.items.length < inventory.maxItemAmount) {
      selectedPlayer.inventory.items.push(item);
    }

    return selectedPlayer;
  }

}
module.exports = Inventory;
