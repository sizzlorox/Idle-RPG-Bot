const helper = require('../../utils/helper');
const items = require('../data/items');

class Item {
  generateItem(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.ceil(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const randomMaterialChance = Math.ceil(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
      const itemMaterialList = items.material.filter(materialRarity => materialRarity.rarity >= randomMaterialChance);

      const randomRarityIndex = helper.randomBetween(0, itemRarityList.length - 1);
      const randomMaterialIndex = helper.randomBetween(0, itemMaterialList.length - 1);
      const randomEquipmentIndex = helper.randomBetween(0, items.type.length - 1);
      const randomTypeIndex = helper.randomBetween(0, items.type[randomEquipmentIndex].length - 1);

      const itemStr = (itemRarityList[randomRarityIndex].stats.str
        * (itemMaterialList[randomMaterialIndex].stats.str
          + items.type[randomEquipmentIndex][randomTypeIndex].stats.str)) / 4;
      if (itemStr < 0){
        itemStr === 0;
      };

      const itemDex = (itemRarityList[randomRarityIndex].stats.dex
        * (itemMaterialList[randomMaterialIndex].stats.dex
          + items.type[randomEquipmentIndex][randomTypeIndex].stats.dex)) / 4;
      if (itemDex < 0){
          itemDex === 0;
      };

      const itemEnd = (itemRarityList[randomRarityIndex].stats.end
        * (itemMaterialList[randomMaterialIndex].stats.end
          + items.type[randomEquipmentIndex][randomTypeIndex].stats.end)) / 4;
      if (itemEnd < 0){
            itemEnd === 0;
      };      
      const itemInt = (itemRarityList[randomRarityIndex].stats.int
        * (itemMaterialList[randomMaterialIndex].stats.int
          + items.type[randomEquipmentIndex][randomTypeIndex].stats.int)) / 4;
        if (itemInt < 0){
            itemInt === 0;
        };
      const itemRating = itemStr + itemDex + itemEnd + itemInt;

      const itemObj = {
        name: `${itemRarityList[randomRarityIndex].name} ${itemMaterialList[randomMaterialIndex].name} ${items.type[randomEquipmentIndex][randomTypeIndex].name}`,
        position: items.type[randomEquipmentIndex][randomTypeIndex].position,
        stats: {
          str: itemStr,
          dex: itemDex,
          end: itemEnd,
          int: itemInt
        },
        rating: itemRating,
        gold: Number((itemRarityList[randomRarityIndex].gold
          * itemMaterialList[randomMaterialIndex].gold
          * items.type[randomEquipmentIndex][randomTypeIndex].gold).toFixed()) * itemRating
      };
      return resolve(itemObj);
    });
  }
}
module.exports = new Item();
