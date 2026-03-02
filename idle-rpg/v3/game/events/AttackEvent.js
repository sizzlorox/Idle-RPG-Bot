const { errorLog } = require('../../../utils/logger');
const enumHelper = require('../../../utils/enumHelper');
const { randomBetween } = require('../../utils/helpers');
const { generatePlayerName } = require('../../utils/formatters');
const { calculateItemRating } = require('../../utils/battleHelpers');

class AttackEvent {

  constructor({ db, itemGen, inventory, player }) {
    this.db = db;
    this.itemGen = itemGen;
    this.inventory = inventory;
    this.player = player;
  }

  async sell(playerObj) {
    const updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      if (updatedPlayer.inventory.equipment.length > 0) {
        let profit = 0;
        updatedPlayer.inventory.equipment.forEach((equipment) => { profit += Number(equipment.gold); });
        updatedPlayer.inventory.equipment.length = 0;
        profit = Math.floor(profit);
        updatedPlayer.gold.current += profit;
        updatedPlayer.gold.total += profit;
        eventMsg.push(`[\`${updatedPlayer.map.name}\`] ${generatePlayerName(updatedPlayer, true)} just sold what they found adventuring for ${profit} gold!`);
        eventLog.push(`Made ${profit} gold selling what you found adventuring`);
        await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
        return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
      }
      return { updatedPlayer };
    } catch (err) {
      errorLog.error(err);
    }
  }

  async generateItemEvent(playerObj) {
    let updatedPlayer = playerObj;
    const eventMsg = [];
    const eventLog = [];
    try {
      const item = await this.itemGen.generateItem(updatedPlayer);
      const itemCost = Math.round(item.gold);
      if (updatedPlayer.gold.current <= itemCost || item.name.startsWith('Cracked')) {
        return { updatedPlayer };
      }
      if (item.position !== enumHelper.inventory.position) {
        const oldItemRating = calculateItemRating(updatedPlayer, updatedPlayer.equipment[item.position]);
        const newItemRating = calculateItemRating(updatedPlayer, item);
        if (oldItemRating >= newItemRating) return { updatedPlayer };
        updatedPlayer.gold.current -= itemCost;
        updatedPlayer = this.player.setPlayerEquipment(updatedPlayer, enumHelper.equipment.types[item.position].position, item);
      } else if (updatedPlayer.inventory.items.length >= enumHelper.inventory.maxItemAmount) {
        return { updatedPlayer };
      } else {
        updatedPlayer.gold.current -= itemCost;
        updatedPlayer = this.inventory.addItemIntoInventory(updatedPlayer, item);
      }
      eventMsg.push(`[\`${updatedPlayer.map.name}\`] ${generatePlayerName(updatedPlayer, true)} just purchased \`${item.name}\` for ${itemCost} gold!`);
      eventLog.push(`Purchased ${item.name} from Town for ${itemCost} Gold`);
      await this.player.logEvent(updatedPlayer, eventLog[0], enumHelper.logTypes.action);
      return { type: 'actions', updatedPlayer, msg: eventMsg, pm: eventLog };
    } catch (err) {
      errorLog.error(err);
    }
  }

}

module.exports = AttackEvent;
