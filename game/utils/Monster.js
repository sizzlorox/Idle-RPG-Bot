const Helper = require('../../utils/Helper');
const monsters = require('../data/monsters');

class Monster {
  generateMonster(selectedPlayer) {
    const randomRarityChance = Math.ceil(Helper.randomInt(0, 100) - (selectedPlayer.level / 6));
    const randomTypeChance = Math.ceil(Helper.randomInt(0, 100) - (selectedPlayer.level / 6));
    const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);
    const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomTypeChance);
    
    const randomRarityIndex = Helper.randomInt(0, monsterRarityList.length - 1);
    const randomTypeIndex = Helper.randomInt(0, monsterTypeList.length - 1);

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
      experience: (monsterRarityList[randomRarityIndex].experience
        * monsterTypeList[randomTypeIndex].experience) / 2,
      gold: Number((monsterRarityList[randomRarityIndex].gold
        * monsterTypeList[randomTypeIndex].gold).toFixed())
    };
    return monsterObj;
  }
}
module.exports = new Monster();
