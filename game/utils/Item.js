const helper = require('../../utils/helper');
const items = require('../data/items');

class Item {

  generateItem() {
    const randomRarityIndex = helper.randomInt(0, items.rarity.length - 1);
    const randomMaterialIndex = helper.randomInt(0, items.material.length - 1);
    const randomEquipmentIndex = helper.randomInt(0, items.type.length - 1);
    const randomTypeIndex = helper.randomInt(0, items.type[randomEquipmentIndex].length - 1);

    const itemObj = {
      name: `${items.rarity[randomRarityIndex].name} ${items.material[randomMaterialIndex].name} ${items.type[randomEquipmentIndex][randomTypeIndex].name}`,
      position: items.type[randomEquipmentIndex][randomTypeIndex].position,
      stats: {
        str: (items.rarity[randomRarityIndex].stats.str
          * (items.material[randomMaterialIndex].stats.str
            + items.type[randomEquipmentIndex][randomTypeIndex].stats.str)) / 2,
        dex: (items.rarity[randomRarityIndex].stats.dex
          * (items.material[randomMaterialIndex].stats.dex
            + items.type[randomEquipmentIndex][randomTypeIndex].stats.dex)) / 2,
        end: (items.rarity[randomRarityIndex].stats.end
          * (items.material[randomMaterialIndex].stats.end
            + items.type[randomEquipmentIndex][randomTypeIndex].stats.end)) / 2,
        int: (items.rarity[randomRarityIndex].stats.int
          * (items.material[randomMaterialIndex].stats.int
            + items.type[randomEquipmentIndex][randomTypeIndex].stats.int)) / 2
      },
      gold: Number((items.rarity[randomRarityIndex].gold
        * items.material[randomMaterialIndex].gold
        * items.type[randomEquipmentIndex][randomTypeIndex].gold).toFixed())
    };
    return itemObj;
  }

}
module.exports = new Item();
