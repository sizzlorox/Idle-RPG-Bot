const spells = require('../data/spells');
const Helper = require('../../utils/Helper');

class Spell {

  generateSpell(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(Helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const randomSpellChance = Math.round(Helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
      const spellRarityList = spells.strength.filter(spellRarity => spellRarity.rarity >= randomRarityChance);
      const spellSpellList = spells.spell.filter(spell => spell.rarity >= randomSpellChance);
      const randomRarityIndex = Helper.randomBetween(0, spellRarityList.length - 1);

      let spellType;
      let randomSpellIndex;
      do {
        console.log('generating spell');
        randomSpellIndex = Helper.randomBetween(0, spellSpellList.length - 1);
        spellType = spellSpellList[randomSpellIndex];
      } while (spellType === undefined);

      const spellObj = {
        name: `${spellRarityList[randomRarityIndex].name} ${spellType.name}`,
        description: spellType.description,
        power: spellRarityList[randomRarityIndex].power + spellType.power,
        chance: spellType.chance,
        function: spellType.function,
        type: spellType.type
      };
      return resolve(spellObj);
    });
  }

  // GETTER SETTERS
  get spells() {
    return spells;
  }

}
module.exports = Spell;
