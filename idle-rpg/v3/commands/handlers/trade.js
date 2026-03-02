const enumHelper = require('../../../utils/enumHelper');
const { calculateItemRating } = require('../../utils/battleHelpers');

module.exports = [
  {
    aliases: ['!equips'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const index = parseInt(args[1]);
      if (isNaN(index)) return author.send('Please specify an item index. Usage: `!equips <number>`');
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      if (!player.inventory.equipment.length) return author.send('Your equipment inventory is empty!');
      const item = player.inventory.equipment[index - 1];
      if (!item) return author.send(`No item found at index ${index}. You have ${player.inventory.equipment.length} item(s).`);
      const oldItemRating = calculateItemRating(player, player.equipment[item.position]);
      const newItemRating = calculateItemRating(player, item);
      const oldItem = Object.assign({}, player.equipment[item.position]);
      player.equipment[item.position].name = item.name;
      player.equipment[item.position].power = item.power;
      if (item.attackType) player.equipment[item.position].attackType = item.attackType;
      player.equipment[item.position].previousOwners = item.previousOwners || [];
      player.inventory.equipment.splice(index - 1, 1);
      if (oldItem.name !== enumHelper.equipment.empty[item.position] && oldItem.name !== enumHelper.equipment.empty.weapon.name && oldItem.name !== enumHelper.equipment.empty.armor.name) {
        player.inventory.equipment.push(oldItem);
      }
      await game.db.savePlayer(player);
      return author.send(`Equipped \`${item.name}\`. Previous item moved to inventory.`);
    }
  },
  {
    aliases: ['!unequips'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const slotArg = args[1] ? args[1].toLowerCase() : null;
      if (!slotArg) return author.send('Please specify a slot: `!unequips <helmet|armor|weapon>`');
      const slotMap = { helmet: 'helmet', armor: 'armor', weapon: 'weapon' };
      const slot = slotMap[slotArg];
      if (!slot) return author.send('Invalid slot. Use: helmet, armor, or weapon');
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      const currentItem = player.equipment[slot];
      if (currentItem.name === enumHelper.equipment.empty[slot].name) return author.send(`Your ${slot} slot is already empty.`);
      if (player.inventory.equipment.length >= enumHelper.inventory.maxEquipmentAmount) return author.send('Your equipment inventory is full!');
      player.inventory.equipment.push(Object.assign({}, currentItem));
      player.equipment[slot] = Object.assign({}, enumHelper.equipment.empty[slot]);
      await game.db.savePlayer(player);
      return author.send(`Unequipped \`${currentItem.name}\` to inventory.`);
    }
  },
  {
    aliases: ['!sells'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      if (!player.inventory.equipment.length && !player.inventory.items.length) return author.send('Your inventory is empty!');
      let profit = 0;
      player.inventory.equipment.forEach(equip => { profit += Number(equip.gold) || 0; });
      player.inventory.items.forEach(item => { profit += Number(item.gold) || 0; });
      player.inventory.equipment = [];
      player.inventory.items = [];
      profit = Math.floor(profit);
      player.gold.current += profit;
      player.gold.total += profit;
      await game.db.savePlayer(player);
      return author.send(`Sold all inventory items for ${profit} gold!`);
    }
  },
  {
    aliases: ['!buys'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      const item = await game.itemGen.generateItem(player);
      const itemCost = Math.round(item.gold);
      if (player.gold.current < itemCost) return author.send(`You need ${itemCost} gold to buy this item, but you only have ${player.gold.current} gold.`);
      if (item.name.startsWith('Cracked')) return author.send('No good items available right now. Try again later!');
      if (item.position !== enumHelper.inventory.position) {
        const oldItemRating = calculateItemRating(player, player.equipment[item.position]);
        const newItemRating = calculateItemRating(player, item);
        if (newItemRating > oldItemRating) {
          player.gold.current -= itemCost;
          player.equipment[item.position] = item;
        } else {
          if (player.inventory.equipment.length < enumHelper.inventory.maxEquipmentAmount) {
            player.gold.current -= itemCost;
            player.inventory.equipment.push(item);
          } else {
            return author.send(`No better item found in stock. Try again later!`);
          }
        }
      } else {
        if (player.inventory.items.length >= enumHelper.inventory.maxItemAmount) return author.send('Your item inventory is full!');
        player.gold.current -= itemCost;
        player.inventory.items.push(item);
      }
      await game.db.savePlayer(player);
      return author.send(`Purchased \`${item.name}\` for ${itemCost} gold!`);
    }
  }
];
