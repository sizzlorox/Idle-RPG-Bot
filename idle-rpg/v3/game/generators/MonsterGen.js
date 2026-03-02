const monsters = require('../../../game/data/monsters');
const { randomBetween } = require('../../utils/helpers');

class MonsterGen {

  generateQuestMonster(selectedPlayer) {
    const randomRarityChance = Math.round(randomBetween(0, 99));
    const randomTypeChance = Math.round(randomBetween(0, 99));
    const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
    const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType && mobType.isSpawnable);
    const randomTypeIndex = randomBetween(0, monsterTypeList.length - 1);
    return monsterTypeList[randomTypeIndex].name;
  }

  generateMonster(selectedPlayer) {
    const randomRarityChance = Math.round(randomBetween(0, 99));
    const randomTypeChance = Math.round(randomBetween(0, 99));
    const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
    const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);

    const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
      && mobType.isSpawnable
      && mobType.spawnableBiomes.includes(selectedPlayer.map.biome.name));

    const isLowLevel = selectedPlayer.level <= 5;
    const playerBalance = isLowLevel ? 0 : (selectedPlayer.equipment.weapon.power + selectedPlayer.equipment.armor.power + selectedPlayer.equipment.helmet.power) / 2.5;
    const mobAmountChance = randomBetween(0, 99);
    const mobAmount = mobAmountChance >= 75 ? randomBetween(1, Math.floor((selectedPlayer.level * Math.log(1.2)) / 2) + 1) : 1;
    const mobList = [];
    for (let currentAmount = 0; currentAmount < mobAmount; currentAmount++) {
      const randomRarityIndex = randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = randomBetween(0, monsterTypeList.length - 1);
      const rarity = monsterRarityList[randomRarityIndex];
      const type = monsterTypeList[randomTypeIndex];
      const monsterObj = {
        name: `${rarity.name} ${type.name}`,
        health: rarity.health + type.health,
        maxHealth: rarity.health + type.health,
        stats: {
          str: isLowLevel ? ((rarity.stats.str * type.stats.str) + (selectedPlayer.stats.str / 1.2)) / 2 : (rarity.stats.str * type.stats.str) + (selectedPlayer.stats.str / 1.2),
          dex: isLowLevel ? ((rarity.stats.dex * type.stats.dex) + (selectedPlayer.stats.dex / 1.2)) / 2 : (rarity.stats.dex * type.stats.dex) + (selectedPlayer.stats.dex / 1.2),
          end: isLowLevel ? ((rarity.stats.end * type.stats.end) + (selectedPlayer.stats.end / 1.2)) / 2 : (rarity.stats.end * type.stats.end) + (selectedPlayer.stats.end / 1.2),
          int: isLowLevel ? ((rarity.stats.int * type.stats.int) + (selectedPlayer.stats.int / 1.2)) / 2 : (rarity.stats.int * type.stats.int) + (selectedPlayer.stats.int / 1.2),
          luk: rarity.stats.luk * type.stats.luk
        },
        dmgDealt: 0,
        dmgReceived: 0,
        power: (rarity.power * type.power) + playerBalance,
        equipment: type.equipment,
        inventory: type.inventory,
        spells: type.spells,
        holiday: type.holiday,
        experience: Math.ceil((rarity.experience * type.experience) / 2),
        gold: Math.round(rarity.gold * type.gold)
      };
      mobList.push(monsterObj);
    }
    return mobList;
  }

  get monsters() {
    return monsters.type;
  }

}

module.exports = MonsterGen;
