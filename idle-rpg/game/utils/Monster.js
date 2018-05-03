const monsters = require('../data/monsters');

class Monster {

  constructor(Helper) {
    this.Helper = Helper;
  }

  generateMonster(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(this.Helper.randomBetween(0, 100));
      const randomTypeChance = Math.round(this.Helper.randomBetween(0, 100));
      const randomMonsterType = randomTypeChance + randomRarityChance > 100 ? 100 : randomTypeChance + randomRarityChance;
      const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);
      const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
        && mobType.isSpawnable
        && mobType.spawnableBiomes.includes(selectedPlayer.map.type.name));

      const randomRarityIndex = this.Helper.randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = this.Helper.randomBetween(0, monsterTypeList.length - 1);

      const monsterObj = {
        name: `${monsterRarityList[randomRarityIndex].name} ${monsterTypeList[randomTypeIndex].name}`,
        stats: {
          str: (monsterRarityList[randomRarityIndex].stats.str
            * monsterTypeList[randomTypeIndex].stats.str),
          dex: (monsterRarityList[randomRarityIndex].stats.dex
            * monsterTypeList[randomTypeIndex].stats.dex),
          end: (monsterRarityList[randomRarityIndex].stats.end
            * monsterTypeList[randomTypeIndex].stats.end)
        },
        isXmasEvent: monsterTypeList[randomTypeIndex].isXmasEvent,
        experience: Number((monsterRarityList[randomRarityIndex].experience
          * monsterTypeList[randomTypeIndex].experience) / 2).toFixed(),
        gold: Number((monsterRarityList[randomRarityIndex].gold
          * monsterTypeList[randomTypeIndex].gold)).toFixed()
      };
      return resolve(monsterObj);
    });
  }

  generateNewMonster(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(this.Helper.randomBetween(0, 100));
      const randomTypeChance = Math.round(this.Helper.randomBetween(0, 100));
      const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
      const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);

      const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
        && mobType.isSpawnable
        && mobType.spawnableBiomes.includes('Land'));

      const randomRarityIndex = this.Helper.randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = this.Helper.randomBetween(0, monsterTypeList.length - 1);
      const playerBalance = selectedPlayer.level <= 5 ? 0 : (selectedPlayer.equipment.weapon.power + selectedPlayer.equipment.armor.power + selectedPlayer.equipment.helmet.power) / 4;
      const mobAmountChance = this.Helper.randomBetween(0, 100);
      const mobAmount = mobAmountChance >= 75 ? this.Helper.randomBetween(1, Math.floor((selectedPlayer.level * Math.log(1.2)) / 2) + 1) : 1;
      const mobList = [];
      for (let currentAmount = 0; currentAmount <= mobAmount; currentAmount++) {
        const monsterObj = {
          name: `${monsterRarityList[randomRarityIndex].name} ${monsterTypeList[randomTypeIndex].name}`,
          health: monsterRarityList[randomRarityIndex].health + monsterTypeList[randomTypeIndex].health,
          maxHealth: monsterRarityList[randomRarityIndex].health + monsterTypeList[randomTypeIndex].health,
          stats: {
            str: selectedPlayer.level <= 5
              ? ((monsterRarityList[randomRarityIndex].stats.str
                * monsterTypeList[randomTypeIndex].stats.str) + (selectedPlayer.stats.str / 2)) / 2
              : (monsterRarityList[randomRarityIndex].stats.str
                * monsterTypeList[randomTypeIndex].stats.str) + (selectedPlayer.stats.str / 2),
            dex: selectedPlayer.level <= 5
              ? ((monsterRarityList[randomRarityIndex].stats.dex
                * monsterTypeList[randomTypeIndex].stats.dex) + (selectedPlayer.stats.dex / 2)) / 2
              : (monsterRarityList[randomRarityIndex].stats.dex
                * monsterTypeList[randomTypeIndex].stats.dex) + (selectedPlayer.stats.dex / 2),
            end: selectedPlayer.level <= 5
              ? ((monsterRarityList[randomRarityIndex].stats.end
                * monsterTypeList[randomTypeIndex].stats.end) + (selectedPlayer.stats.end / 2)) / 2
              : (monsterRarityList[randomRarityIndex].stats.end
                * monsterTypeList[randomTypeIndex].stats.end) + (selectedPlayer.stats.end / 2),
            int: selectedPlayer.level <= 5
              ? ((monsterRarityList[randomRarityIndex].stats.int
                * monsterTypeList[randomTypeIndex].stats.int) + (selectedPlayer.stats.int / 2)) / 2
              : (monsterRarityList[randomRarityIndex].stats.int
                * monsterTypeList[randomTypeIndex].stats.int) + (selectedPlayer.stats.int / 2),
            luk: (monsterRarityList[randomRarityIndex].stats.luk
              * monsterTypeList[randomTypeIndex].stats.luk)
          },
          power: monsterRarityList[randomRarityIndex].power + monsterTypeList[randomTypeIndex].power + playerBalance,
          equipment: monsterTypeList[randomTypeIndex].equipment,
          inventory: monsterTypeList[randomTypeIndex].inventory,
          spells: monsterTypeList[randomTypeIndex].spells,
          isXmasEvent: monsterTypeList[randomTypeIndex].isXmasEvent,
          experience: Math.ceil((monsterRarityList[randomRarityIndex].experience
            * monsterTypeList[randomTypeIndex].experience) / 2),
          gold: Math.round((monsterRarityList[randomRarityIndex].gold
            * monsterTypeList[randomTypeIndex].gold))
        };
        mobList.push(monsterObj);
      }

      return resolve(mobList);
    });
  }

  // GETTER SETTERS
  get monsters() {
    return monsters.type;
  }

}
module.exports = Monster;
