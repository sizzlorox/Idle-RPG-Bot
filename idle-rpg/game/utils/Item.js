const helper = require('../../utils/helper');
const items = require('../data/items');

class Item {

  generateItem(selectedPlayer, mob) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.ceil(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const randomMaterialChance = Math.ceil(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
      const itemMaterialList = items.material.filter(materialRarity => materialRarity.rarity >= randomMaterialChance);

      const randomRarityIndex = helper.randomBetween(0, itemRarityList.length - 1);
      const randomMaterialIndex = helper.randomBetween(0, itemMaterialList.length - 1);

      const mobName = mob.name.replace(' ', '_').split('_')[1];
      let itemType;
      let randomEquipmentIndex;
      let randomTypeIndex;
      if (mob.isXmasEvent) {
        do {
          console.log('generating relic item');
          randomTypeIndex = helper.randomBetween(0, items.type[3].length - 1);
          if (items.type[3][randomTypeIndex].droppedBy.includes(mobName)
            && items.type[3][randomTypeIndex].isDroppable
          ) {
            itemType = items.type[3][randomTypeIndex];
          }
        } while (itemType === undefined);
      } else {
        do {
          console.log('generating non relic item');
          randomEquipmentIndex = helper.randomBetween(0, items.type.length - 1);
          randomTypeIndex = helper.randomBetween(0, items.type[randomEquipmentIndex].length - 1);

          if (items.type[randomEquipmentIndex][randomTypeIndex].position !== 'relic') {
            itemType = items.type[randomEquipmentIndex][randomTypeIndex];
          }
        } while (itemType === undefined);
      }

      let itemObj;
      let itemStr;
      let itemDex;
      let itemEnd;
      let itemInt;
      let itemLuk;
      let itemRating;

      if (itemType.position === 'relic') {
        itemStr = (itemRarityList[randomRarityIndex].stats.str
          * (itemMaterialList[randomMaterialIndex].stats.str
            + itemType.stats.str)) / 4;

        itemDex = (itemRarityList[randomRarityIndex].stats.dex
          * (itemMaterialList[randomMaterialIndex].stats.dex
            + itemType.stats.dex)) / 4;

        itemEnd = (itemRarityList[randomRarityIndex].stats.end
          * (itemMaterialList[randomMaterialIndex].stats.end
            + itemType.stats.end)) / 4;

        itemInt = (itemRarityList[randomRarityIndex].stats.int
          * (itemMaterialList[randomMaterialIndex].stats.int
            + itemType.stats.int)) / 4;

        itemLuk = itemType.stats.luk !== undefined ? itemType.stats.luk : 0;

        itemRating = itemStr + itemDex + itemEnd + itemInt + itemLuk;

        itemObj = {
          name: `${itemRarityList[randomRarityIndex].name} ${itemType.name}`,
          position: itemType.position,
          stats: {
            str: itemStr,
            dex: itemDex,
            end: itemEnd,
            int: itemInt,
            luk: itemLuk
          },
          isXmasEvent: itemType.isXmasEvent,
          rating: itemRating,
          gold: Number((itemRarityList[randomRarityIndex].gold
            * itemMaterialList[randomMaterialIndex].gold
            * itemType.gold).toFixed()) * itemRating
        };
      } else {
        itemStr = (itemRarityList[randomRarityIndex].stats.str
          * (itemMaterialList[randomMaterialIndex].stats.str
            + itemType.stats.str)) / 4;

        itemDex = (itemRarityList[randomRarityIndex].stats.dex
          * (itemMaterialList[randomMaterialIndex].stats.dex
            + itemType.stats.dex)) / 4;

        itemEnd = (itemRarityList[randomRarityIndex].stats.end
          * (itemMaterialList[randomMaterialIndex].stats.end
            + itemType.stats.end)) / 4;

        itemInt = (itemRarityList[randomRarityIndex].stats.int
          * (itemMaterialList[randomMaterialIndex].stats.int
            + itemType.stats.int)) / 4;

        itemRating = itemStr + itemDex + itemEnd + itemInt;

        itemObj = {
          name: `${itemRarityList[randomRarityIndex].name} ${itemMaterialList[randomMaterialIndex].name} ${itemType.name}`,
          position: itemType.position,
          stats: {
            str: itemStr,
            dex: itemDex,
            end: itemEnd,
            int: itemInt
          },
          isXmasEvent: itemType.isXmasEvent,
          rating: itemRating,
          gold: Number((itemRarityList[randomRarityIndex].gold
            * itemMaterialList[randomMaterialIndex].gold
            * itemType.gold).toFixed()) * itemRating
        };
      }
      return resolve(itemObj);
    });
  }

  // GETTER SETTERS
  get items() {
    return items.type;
  }

}
module.exports = Item;
