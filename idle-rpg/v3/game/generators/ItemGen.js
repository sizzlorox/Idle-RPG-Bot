const items = require('../../../game/data/items');
const enumHelper = require('../../../utils/enumHelper');
const { randomBetween } = require('../../utils/helpers');

const snowflakeTemplate = items.type[3].find(item => item.name === 'Snowflake');

const ENCHANT_SUFFIXES = [
  { name: 'of Might', stat: 'str' },
  { name: 'of Swiftness', stat: 'dex' },
  { name: 'of Fortitude', stat: 'end' },
  { name: 'of Wisdom', stat: 'int' },
  { name: 'of Fortune', stat: 'luk' }
];

class ItemGen {

  async generateItem(updatedPlayer, mob) {
    const randomRarityChance = Math.round(randomBetween(0, 99) - (updatedPlayer.level / 6));
    const randomMaterialChance = Math.round(randomBetween(0, 99) - (updatedPlayer.level / 6));
    const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
    const itemMaterialList = items.material.filter(materialRarity => materialRarity.rarity >= randomMaterialChance);

    const randomRarityIndex = randomBetween(0, itemRarityList.length - 1);
    const randomMaterialIndex = randomBetween(0, itemMaterialList.length - 1);
    const levelBonus = Math.floor(updatedPlayer.level / 10);

    const mobName = mob ? mob.name.replace(' ', '_').split('_')[1] : undefined;
    let itemType;
    let randomEquipmentIndex;
    let randomTypeIndex;
    if (mob && mob.holiday) {
      do {
        randomTypeIndex = randomBetween(0, items.type[3].length - 1);
        if (items.type[3][randomTypeIndex].droppedBy.includes(mobName) && items.type[3][randomTypeIndex].isDroppable) {
          itemType = items.type[3][randomTypeIndex];
        }
      } while (itemType === undefined);
    } else {
      do {
        randomEquipmentIndex = randomBetween(0, items.type.length - 1);
        randomTypeIndex = randomBetween(0, items.type[randomEquipmentIndex].length - 1);
        if (items.type[randomEquipmentIndex][randomTypeIndex].position !== enumHelper.equipment.types.relic.position) {
          itemType = items.type[randomEquipmentIndex][randomTypeIndex];
        }
      } while (itemType === undefined);
    }

    let itemObj;
    if (itemType.position === enumHelper.equipment.types.relic.position) {
      const itemStr = itemType.stats.str;
      const itemDex = itemType.stats.dex;
      const itemEnd = itemType.stats.end;
      const itemInt = itemType.stats.int;
      const itemLuk = itemType.stats.luk;
      const itemRating = Math.round(itemStr + itemDex + itemEnd + itemInt + itemLuk);
      itemObj = {
        name: `${itemRarityList[randomRarityIndex].name} ${itemType.name}`,
        position: itemType.position,
        str: itemStr, dex: itemDex, end: itemEnd, int: itemInt, luk: itemLuk,
        holiday: itemType.holiday,
        rating: itemRating,
        gold: Number((itemRarityList[randomRarityIndex].gold * itemType.gold).toFixed()) * itemType.power
      };
    } else if (itemType.position === enumHelper.inventory.position) {
      itemObj = {
        name: `${itemRarityList[randomRarityIndex].name} ${itemType.name}`,
        position: itemType.position,
        holiday: itemType.holiday,
        power: itemRarityList[randomRarityIndex].power + itemType.power,
        gold: Number((itemRarityList[randomRarityIndex].gold * itemMaterialList[randomMaterialIndex].gold * itemType.gold).toFixed()) * itemType.power
      };
    } else {
      const basePower = itemRarityList[randomRarityIndex].power + itemMaterialList[randomMaterialIndex].power + itemType.power + levelBonus;
      itemObj = {
        name: `${itemRarityList[randomRarityIndex].name} ${itemMaterialList[randomMaterialIndex].name} ${itemType.name}`,
        position: itemType.position,
        holiday: itemType.holiday,
        power: basePower,
        attackType: itemType.attackType,
        gold: Number((itemRarityList[randomRarityIndex].gold * itemMaterialList[randomMaterialIndex].gold * itemType.gold).toFixed()) * itemType.power
      };
      // 40% chance to add an enchant suffix
      if (randomBetween(0, 99) < 40) {
        const suffix = ENCHANT_SUFFIXES[randomBetween(0, ENCHANT_SUFFIXES.length - 1)];
        const bonus = Math.max(1, Math.round(itemRarityList[randomRarityIndex].power * 0.75));
        itemObj.name += ` ${suffix.name}`;
        itemObj.enchant = { stat: suffix.stat, bonus };
      }
    }

    return itemObj;
  }

  generateInvasionRelic(updatedPlayer, invasionMobType) {
    const randomRarityChance = Math.round(randomBetween(0, 99) - (updatedPlayer.level / 6));
    const itemRarityList = items.rarity.filter(r => r.rarity >= randomRarityChance);
    const randomRarityIndex = randomBetween(0, itemRarityList.length - 1);
    const rarity = itemRarityList[randomRarityIndex];
    const base = Math.ceil(rarity.power);
    const jitter = () => Math.max(0, base + randomBetween(-1, 1));
    const str = jitter();
    const dex = jitter();
    const end = jitter();
    const int = jitter();
    const luk = jitter();
    const rating = str + dex + end + int + luk;
    return {
      name: `${rarity.name} War Relic of the ${invasionMobType}`,
      position: 'relic',
      str, dex, end, int, luk,
      rating,
      gold: Number((rarity.gold * 3).toFixed()) * Math.max(1, rating)
    };
  }

  generateSnowflake(updatedPlayer) {
    const snowFlake = snowflakeTemplate;
    const randomRarityChance = Math.round(randomBetween(0, 99) - (updatedPlayer.level / 6));
    const itemRarityList = items.rarity.filter(itemRarity => itemRarity.rarity >= randomRarityChance);
    const randomRarityIndex = randomBetween(0, itemRarityList.length - 1);

    const itemStr = Math.round((itemRarityList[randomRarityIndex].power + snowFlake.stats.str) / 4);
    const itemDex = Math.round((itemRarityList[randomRarityIndex].power + snowFlake.stats.dex) / 4);
    const itemEnd = Math.round((itemRarityList[randomRarityIndex].power + snowFlake.stats.end) / 4);
    const itemInt = Math.round((itemRarityList[randomRarityIndex].power + snowFlake.stats.int) / 4);
    const itemLuk = Math.round((itemRarityList[randomRarityIndex].power + snowFlake.stats.luk) / 5);
    const itemRating = Math.round(itemStr + itemDex + itemEnd + itemInt + itemLuk);

    return {
      name: `${itemRarityList[randomRarityIndex].name} ${snowFlake.name}`,
      position: snowFlake.position,
      str: itemStr, dex: itemDex, end: itemEnd, int: itemInt, luk: itemLuk,
      holiday: snowFlake.holiday,
      rating: itemRating,
      gold: Number((itemRarityList[randomRarityIndex].gold * snowFlake.gold).toFixed()) * itemRating
    };
  }

  get items() {
    return items.type;
  }

}

module.exports = ItemGen;
