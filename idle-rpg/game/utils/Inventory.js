const { inventory } = require('../../utils/enumHelper');

class Inventory {

  addEquipmentIntoInventory(selectedPlayer, equipment) {
    if (selectedPlayer.inventory.equipment.length < inventory.maxEquipmentAmount) {
      selectedPlayer.inventory.equipment.push(equipment);
    }

    return selectedPlayer;
  }

}
module.exports = Inventory;
