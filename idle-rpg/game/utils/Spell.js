const BaseHelper = require('../../v2/Base/Helper');

const spells = require('../data/spells');

class Spell extends BaseHelper {

  generateSpell(selectedPlayer) {
    const randomRarityChance = Math.round(this.randomBetween(0, 99) - (selectedPlayer.level / 6));
    const randomSpellChance = Math.round(this.randomBetween(0, 99) - (selectedPlayer.level / 6));
    const randomStrength = this.randomChoice(spells.strength.filter(strength => strength.rarity >= randomRarityChance));
    const randomSpell = this.randomChoice(spells.spell.filter(spell => spell.rarity >= randomSpellChance));

    return {
      name: `${randomStrength.name} ${randomSpell.name}`,
      description: randomSpell.description,
      power: randomStrength.power + randomSpell.power,
      chance: randomSpell.chance,
      function: randomSpell.function,
      type: randomSpell.type
    };
  }

  // GETTER SETTERS
  get spells() {
    return spells;
  }

}
module.exports = Spell;
