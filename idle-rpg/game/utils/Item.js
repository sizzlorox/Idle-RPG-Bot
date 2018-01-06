const helper = require('../../utils/helper');
const items = require('../data/items');
const enumHelper = require('../../utils/enumHelper');

class Item {

  regenerateItemByName(item, position) {
    const itemName = item.name;
    console.log(itemName);
    const splitItemName = itemName.split(' ');
    let rarity;
    let material;
    let type;
    if (itemName === 'Fists' || itemName === 'Fist') {
      item.str = 1;
      item.dex = 1;
      item.end = 1;
      item.int = 0;
      item.position = position;
      return item;
    } else if (itemName === 'Nothing') {
      item.str = 0;
      item.dex = 0;
      item.end = 0;
      item.int = 0;
      item.position = position;
      return item;
    }
    splitItemName.forEach((thing) => {
      if (!rarity) {
        rarity = items.rarity.find(obj => obj.name.includes(thing));
      }

      if (!material) {
        material = items.material.find(obj => obj.name.includes(thing));
      }

      if (!type) {
        switch (position) {
          case 'helmet':
            type = items.type[0].find(obj => obj.name.includes(thing));
            break;
          case 'armor':
            type = items.type[2].find(obj => obj.name.includes(thing));
            break;
          case 'weapon':
            type = items.type[1].find(obj => obj.name.includes(thing));
            break;
        }
      }
    });

    const itemStr = (rarity.stats.str
      * (material.stats.str
        + type.stats.str)) / 4;

    const itemDex = (rarity.stats.dex
      * (material.stats.dex
        + type.stats.dex)) / 4;

    const itemEnd = (rarity.stats.end
      * (material.stats.end
        + type.stats.end)) / 4;

    const itemInt = (rarity.stats.int
      * (material.stats.int
        + type.stats.int)) / 4;

    const itemPosition = position;

    item.str = itemStr;
    item.dex = itemDex;
    item.end = itemEnd;
    item.int = itemInt;
    item.position = itemPosition;
    return item;
  }

  generateItem(selectedPlayer, mob) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.floor(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const randomMaterialChance = Math.floor(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
      const itemMaterialList = items.material.filter(materialRarity => materialRarity.rarity >= randomMaterialChance);

      const randomRarityIndex = helper.randomBetween(0, itemRarityList.length - 1);
      const randomMaterialIndex = helper.randomBetween(0, itemMaterialList.length - 1);

      const mobName = mob ? mob.name.replace(' ', '_').split('_')[1] : undefined;
      let itemType;
      let randomEquipmentIndex;
      let randomTypeIndex;
      if (mob && mob.isXmasEvent) {
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

          if (items.type[randomEquipmentIndex][randomTypeIndex].position !== enumHelper.equipment.types.relic.position) {
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
        itemStr = Math.floor((itemRarityList[randomRarityIndex].stats.str
          + itemType.stats.str) / 4);

        itemDex = Math.floor((itemRarityList[randomRarityIndex].stats.dex
          + itemType.stats.dex) / 4);

        itemEnd = Math.floor((itemRarityList[randomRarityIndex].stats.end
          + itemType.stats.end) / 4);

        itemInt = Math.floor((itemRarityList[randomRarityIndex].stats.int
          + itemType.stats.int) / 4);

        itemLuk = itemType.stats.luk;

        itemRating = Math.floor(itemStr + itemDex + itemEnd + itemInt + itemLuk);

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
            * itemType.gold).toFixed()) * itemRating
        };
      } else {
        itemStr = Math.floor((itemRarityList[randomRarityIndex].stats.str
          * (itemMaterialList[randomMaterialIndex].stats.str
            + itemType.stats.str)) / 4);

        itemDex = Math.floor((itemRarityList[randomRarityIndex].stats.dex
          * (itemMaterialList[randomMaterialIndex].stats.dex
            + itemType.stats.dex)) / 4);

        itemEnd = Math.floor((itemRarityList[randomRarityIndex].stats.end
          * (itemMaterialList[randomMaterialIndex].stats.end
            + itemType.stats.end)) / 4);

        itemInt = Math.floor((itemRarityList[randomRarityIndex].stats.int
          * (itemMaterialList[randomMaterialIndex].stats.int
            + itemType.stats.int)) / 4);

        itemRating = Math.floor(itemStr + itemDex + itemEnd + itemInt);

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

  // EVENT ITEM
  generateSnowflake(selectedPlayer) {
    const snowFlake = items.type[3].find(item => item.name === 'Snowflake');
    const randomRarityChance = Math.floor(helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
    const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
    const randomRarityIndex = helper.randomBetween(0, itemRarityList.length - 1);

    const itemStr = Math.floor((itemRarityList[randomRarityIndex].stats.str
      + snowFlake.stats.str) / 4);

    const itemDex = Math.floor((itemRarityList[randomRarityIndex].stats.dex
      + snowFlake.stats.dex) / 4);

    const itemEnd = Math.floor((itemRarityList[randomRarityIndex].stats.end
      + snowFlake.stats.end) / 4);

    const itemInt = Math.floor((itemRarityList[randomRarityIndex].stats.int
      + snowFlake.stats.int) / 4);

    const itemLuk = snowFlake.stats.luk;

    const itemRating = Math.floor(itemStr + itemDex + itemEnd + itemInt + itemLuk);

    const itemObj = {
      name: `${itemRarityList[randomRarityIndex].name} ${snowFlake.name}`,
      position: snowFlake.position,
      stats: {
        str: itemStr,
        dex: itemDex,
        end: itemEnd,
        int: itemInt,
        luk: itemLuk
      },
      isXmasEvent: snowFlake.isXmasEvent,
      rating: itemRating,
      gold: Number((itemRarityList[randomRarityIndex].gold
        * snowFlake.gold).toFixed()) * itemRating
    };

    return itemObj;
  }

  // GETTER SETTERS
  get items() {
    return items.type;
  }

}
module.exports = Item;
