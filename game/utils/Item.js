const Helper = require('../../utils/Helper');
const items = require('../data/items');

class Item {

  generateItem() {
    const randomRarityIndex = Helper.randomInt(0, items.rarity.length - 1);
    const randomMaterialIndex = Helper.randomInt(0, items.material.length - 1);
    const randomEquipmentIndex = Helper.randomInt(0, items.type.length - 1);
    const randomTypeIndex = Helper.randomInt(0, items.type[randomEquipmentIndex].length - 1);

    const itemStr = (items.rarity[randomRarityIndex].stats.str
      * (items.material[randomMaterialIndex].stats.str
        + items.type[randomEquipmentIndex][randomTypeIndex].stats.str)) / 4;

    const itemDex = (items.rarity[randomRarityIndex].stats.dex
      * (items.material[randomMaterialIndex].stats.dex
        + items.type[randomEquipmentIndex][randomTypeIndex].stats.dex)) / 4;

    const itemEnd = (items.rarity[randomRarityIndex].stats.end
      * (items.material[randomMaterialIndex].stats.end
        + items.type[randomEquipmentIndex][randomTypeIndex].stats.end)) / 4;

    const itemInt = (items.rarity[randomRarityIndex].stats.int
      * (items.material[randomMaterialIndex].stats.int
        + items.type[randomEquipmentIndex][randomTypeIndex].stats.int)) / 4;

    const itemObj = {
      name: `${items.rarity[randomRarityIndex].name} ${items.material[randomMaterialIndex].name} ${items.type[randomEquipmentIndex][randomTypeIndex].name}`,
      position: items.type[randomEquipmentIndex][randomTypeIndex].position,
      stats: {
        str: itemStr,
        dex: itemDex,
        end: itemEnd,
        int: itemInt
      },
      rating: itemStr + itemDex + itemEnd + itemInt,
      gold: Number((items.rarity[randomRarityIndex].gold
        * items.material[randomMaterialIndex].gold
        * items.type[randomEquipmentIndex][randomTypeIndex].gold).toFixed()) * rating
    };
    return itemObj;
  }

}
module.exports = new Item();
