const Helper = require('../../utils/Helper');
const monsters = require('../data/monsters');

class Monster {

  generateMonster() {
    const randomRarityIndex = Helper.randomInt(0, monsters.rarity.length - 1);
    const randomTypeIndex = Helper.randomInt(0, monsters.type.length - 1);

    const monsterObj = {
      name: `${monsters.rarity[randomRarityIndex].name} ${monsters.type[randomTypeIndex].name}`,
      stats: {
        str: (monsters.rarity[randomRarityIndex].stats.str
          * monsters.type[randomTypeIndex].stats.str),
        dex: (monsters.rarity[randomRarityIndex].stats.dex
          * monsters.type[randomTypeIndex].stats.dex),
        end: (monsters.rarity[randomRarityIndex].stats.end
          * monsters.type[randomTypeIndex].stats.end)
      },
      experience: (monsters.rarity[randomRarityIndex].experience
        * monsters.type[randomTypeIndex].experience) / 2,
      gold: Number((monsters.rarity[randomRarityIndex].gold
        * monsters.type[randomTypeIndex].gold).toFixed())
    };
    return monsterObj;
  }

}
module.exports = new Monster();
