const helper = require('../../utils/helper');
const monsters = require('../data/monsters');

class Monster {

  generateMonster() {
    const randomRarityIndex = helper.randomInt(0, monsters.rarity.length - 1);
    const randomTypeIndex = helper.randomInt(0, monsters.type.length - 1);

    const monsterObj = {
      name: `${monsters.rarity[randomRarityIndex].name} ${monsters.type[randomTypeIndex].name}`,
      stats: {
        str: (monsters.rarity[randomRarityIndex].stats.str
          * monsters.type[randomTypeIndex].stats.str) / 2,
        dex: (monsters.rarity[randomRarityIndex].stats.dex
          * monsters.type[randomTypeIndex].stats.dex) / 2,
        end: (monsters.rarity[randomRarityIndex].stats.end
          * monsters.type[randomTypeIndex].stats.end) / 2
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
