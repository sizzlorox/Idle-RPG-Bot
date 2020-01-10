const monsters = require('../data/monsters');
const BaseHelper = require('../../v2/Base/Helper');

class Monster extends BaseHelper {

  generateQuestMonster(selectedPlayer) {
    const randomRarityChance = Math.round(this.randomBetween(0, 99));
    const randomTypeChance = Math.round(this.randomBetween(0, 99));
    const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
    const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType && mobType.isSpawnable);
    const randomTypeIndex = this.randomBetween(0, monsterTypeList.length - 1);

    return monsterTypeList[randomTypeIndex].name;
  }

  generateMonster(selectedPlayer) {
    const randomRarityChance = Math.round(this.randomBetween(0, 99));
    const randomTypeChance = Math.round(this.randomBetween(0, 99));
    const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
    const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);

    const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
      && mobType.isSpawnable
      && mobType.spawnableBiomes.includes(selectedPlayer.map.biome.name));

    const playerBalance = selectedPlayer.level <= 5 ? 0 : (selectedPlayer.equipment.weapon.power + selectedPlayer.equipment.armor.power + selectedPlayer.equipment.helmet.power) / 2.5;
    const mobAmountChance = this.randomBetween(0, 99);
    const mobAmount = mobAmountChance >= 75 ? this.randomBetween(1, Math.floor((selectedPlayer.level * Math.log(1.2)) / 2) + 1) : 1;
    const mobList = [];
    for (let currentAmount = 0; currentAmount < mobAmount; currentAmount++) {
      const randomRarityIndex = this.randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = this.randomBetween(0, monsterTypeList.length - 1);
      const monsterObj = {
        name: `${monsterRarityList[randomRarityIndex].name} ${monsterTypeList[randomTypeIndex].name}`,
        health: monsterRarityList[randomRarityIndex].health + monsterTypeList[randomTypeIndex].health,
        maxHealth: monsterRarityList[randomRarityIndex].health + monsterTypeList[randomTypeIndex].health,
        stats: {
          str: selectedPlayer.level <= 5
            ? ((monsterRarityList[randomRarityIndex].stats.str
              * monsterTypeList[randomTypeIndex].stats.str) + (selectedPlayer.stats.str / 1.2)) / 2
            : (monsterRarityList[randomRarityIndex].stats.str
              * monsterTypeList[randomTypeIndex].stats.str) + (selectedPlayer.stats.str / 1.2),
          dex: selectedPlayer.level <= 5
            ? ((monsterRarityList[randomRarityIndex].stats.dex
              * monsterTypeList[randomTypeIndex].stats.dex) + (selectedPlayer.stats.dex / 1.2)) / 2
            : (monsterRarityList[randomRarityIndex].stats.dex
              * monsterTypeList[randomTypeIndex].stats.dex) + (selectedPlayer.stats.dex / 1.2),
          end: selectedPlayer.level <= 5
            ? ((monsterRarityList[randomRarityIndex].stats.end
              * monsterTypeList[randomTypeIndex].stats.end) + (selectedPlayer.stats.end / 1.2)) / 2
            : (monsterRarityList[randomRarityIndex].stats.end
              * monsterTypeList[randomTypeIndex].stats.end) + (selectedPlayer.stats.end / 1.2),
          int: selectedPlayer.level <= 5
            ? ((monsterRarityList[randomRarityIndex].stats.int
              * monsterTypeList[randomTypeIndex].stats.int) + (selectedPlayer.stats.int / 1.2)) / 2
            : (monsterRarityList[randomRarityIndex].stats.int
              * monsterTypeList[randomTypeIndex].stats.int) + (selectedPlayer.stats.int / 1.2),
          luk: (monsterRarityList[randomRarityIndex].stats.luk
            * monsterTypeList[randomTypeIndex].stats.luk)
        },
        dmgDealt: 0,
        dmgReceived: 0,
        power: (monsterRarityList[randomRarityIndex].power * monsterTypeList[randomTypeIndex].power) + playerBalance,
        equipment: monsterTypeList[randomTypeIndex].equipment,
        inventory: monsterTypeList[randomTypeIndex].inventory,
        spells: monsterTypeList[randomTypeIndex].spells,
        holiday: monsterTypeList[randomTypeIndex].holiday,
        experience: Math.ceil((monsterRarityList[randomRarityIndex].experience
          * monsterTypeList[randomTypeIndex].experience) / 2),
        gold: Math.round((monsterRarityList[randomRarityIndex].gold
          * monsterTypeList[randomTypeIndex].gold))
      };
      mobList.push(monsterObj);
    }

    return mobList;
  }

  // GETTER SETTERS
  get monsters() {
    return monsters.type;
  }

}
module.exports = Monster;
