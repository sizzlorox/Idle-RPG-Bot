const items = require('../data/items');
const enumHelper = require('../../utils/enumHelper');
const BaseHelper = require('../../v2/Base/Helper');

class Item extends BaseHelper {

  generateItem(updatedPlayer, mob) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(this.randomBetween(0, 100) - (updatedPlayer.level / 6));
      const randomMaterialChance = Math.round(this.randomBetween(0, 100) - (updatedPlayer.level / 6));
      const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
      const itemMaterialList = items.material.filter(materialRarity => materialRarity.rarity >= randomMaterialChance);

      const randomRarityIndex = this.randomBetween(0, itemRarityList.length - 1);
      const randomMaterialIndex = this.randomBetween(0, itemMaterialList.length - 1);

      const mobName = mob ? mob.name.replace(' ', '_').split('_')[1] : undefined;
      let itemType;
      let randomEquipmentIndex;
      let randomTypeIndex;
      if (mob && mob.holiday) {
        do {
          // console.log('generating relic item');
          randomTypeIndex = this.randomBetween(0, items.type[3].length - 1);
          if (items.type[3][randomTypeIndex].droppedBy.includes(mobName)
            && items.type[3][randomTypeIndex].isDroppable
          ) {
            itemType = items.type[3][randomTypeIndex];
          }
        } while (itemType === undefined);
      } else {
        do {
          // console.log('generating non relic item');
          randomEquipmentIndex = this.randomBetween(0, items.type.length - 1);
          randomTypeIndex = this.randomBetween(0, items.type[randomEquipmentIndex].length - 1);

          if (items.type[randomEquipmentIndex][randomTypeIndex].position !== enumHelper.equipment.types.relic.position) {
            itemType = items.type[randomEquipmentIndex][randomTypeIndex];
          }
        } while (itemType === undefined);
      }

      let itemObj;

      if (itemType.position === enumHelper.equipment.types.relic.position) {
        const itemStr = Math.round((itemRarityList[randomRarityIndex].stats.str
          + itemType.stats.str) / 4);

        const itemDex = Math.round((itemRarityList[randomRarityIndex].stats.dex
          + itemType.stats.dex) / 4);

        const itemEnd = Math.round((itemRarityList[randomRarityIndex].stats.end
          + itemType.stats.end) / 4);

        const itemInt = Math.round((itemRarityList[randomRarityIndex].stats.int
          + itemType.stats.int) / 4);

        const itemLuk = itemType.stats.luk;

        itemRating = Math.round(itemStr + itemDex + itemEnd + itemInt + itemLuk);

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
          holiday: itemType.holiday,
          rating: itemRating,
          gold: Number((itemRarityList[randomRarityIndex].gold
            * itemType.gold).toFixed()) * itemType.power
        };
      } else if (itemType.position === enumHelper.inventory.position) {
        itemObj = {
          name: `${itemRarityList[randomRarityIndex].name} ${itemType.name}`,
          position: itemType.position,
          holiday: itemType.holiday,
          power: itemRarityList[randomRarityIndex].power + itemType.power,
          gold: Number((itemRarityList[randomRarityIndex].gold
            * itemMaterialList[randomMaterialIndex].gold
            * itemType.gold).toFixed()) * itemType.power
        };
      } else {
        itemObj = {
          name: `${itemRarityList[randomRarityIndex].name} ${itemMaterialList[randomMaterialIndex].name} ${itemType.name}`,
          position: itemType.position,
          holiday: itemType.holiday,
          power: itemRarityList[randomRarityIndex].power + itemMaterialList[randomMaterialIndex].power + itemType.power,
          attackType: itemType.attackType,
          gold: Number((itemRarityList[randomRarityIndex].gold
            * itemMaterialList[randomMaterialIndex].gold
            * itemType.gold).toFixed()) * itemType.power
        };
      }

      return resolve(itemObj);
    });
  }

  // EVENT ITEM
  generateSnowflake(updatedPlayer) {
    const snowFlake = items.type[3].find(item => item.name === 'Snowflake');
    const randomRarityChance = Math.round(this.randomBetween(0, 100) - (updatedPlayer.level / 6));
    const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
    const randomRarityIndex = this.randomBetween(0, itemRarityList.length - 1);

    const itemStr = Math.round((itemRarityList[randomRarityIndex].power
      + snowFlake.stats.str) / 4);
    const itemDex = Math.round((itemRarityList[randomRarityIndex].power
      + snowFlake.stats.dex) / 4);
    const itemEnd = Math.round((itemRarityList[randomRarityIndex].power
      + snowFlake.stats.end) / 4);
    const itemInt = Math.round((itemRarityList[randomRarityIndex].power
      + snowFlake.stats.int) / 4);
    const itemLuk = Math.round((randomRarityIndex + snowFlake.stats.luk) / 5);

    const itemRating = Math.round(itemStr + itemDex + itemEnd + itemInt + itemLuk);

    return {
      name: `${itemRarityList[randomRarityIndex].name} ${snowFlake.name}`,
      position: snowFlake.position,
      stats: {
        str: itemStr,
        dex: itemDex,
        end: itemEnd,
        int: itemInt,
        luk: itemLuk
      },
      holiday: snowFlake.holiday,
      rating: itemRating,
      gold: Number((itemRarityList[randomRarityIndex].gold
        * snowFlake.gold).toFixed()) * itemRating
    };
  }

  // GETTER SETTERS
  get items() {
    return items.type;
  }

}
module.exports = Item;
