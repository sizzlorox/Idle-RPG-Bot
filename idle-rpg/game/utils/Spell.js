const spells = require('../data/spells');

class Spell {

  constructor(Helper) {
    this.Helper = Helper;
  }

  generateSpell(selectedPlayer) {
    const randomRarityChance = Math.round(this.Helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
    const randomSpellChance = Math.round(this.Helper.randomBetween(0, 100) - (selectedPlayer.level / 6));
    const spellRarityList = spells.strength.filter(spellRarity => spellRarity.rarity >= randomRarityChance);
    const spellSpellList = spells.spell.filter(spell => spell.rarity >= randomSpellChance);
    const randomRarityIndex = this.Helper.randomBetween(0, spellRarityList.length - 1);

    let spellType;
    let randomSpellIndex;
    do {
      randomSpellIndex = this.Helper.randomBetween(0, spellSpellList.length - 1);
      spellType = spellSpellList[randomSpellIndex];
    } while (spellType === undefined);

    return {
      name: `${spellRarityList[randomRarityIndex].name} ${spellType.name}`,
      description: spellType.description,
      power: spellRarityList[randomRarityIndex].power + spellType.power,
      chance: spellType.chance,
      function: spellType.function,
      type: spellType.type
    };
  }

  // GETTER SETTERS
  get spells() {
    return spells;
  }

}
module.exports = Spell;
