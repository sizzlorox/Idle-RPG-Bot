const spells = require('../../../game/data/spells');
const { randomBetween, randomChoice } = require('../../utils/helpers');

class SpellGen {

  generateSpell(selectedPlayer) {
    const randomRarityChance = Math.round(randomBetween(0, 99) - (selectedPlayer.level / 6));
    const randomSpellChance = Math.round(randomBetween(0, 99) - (selectedPlayer.level / 6));
    const randomStrength = randomChoice(spells.strength.filter(strength => strength.rarity >= randomRarityChance));
    const randomSpell = randomChoice(spells.spell.filter(spell => spell.rarity >= randomSpellChance));

    return {
      name: `${randomStrength.name} ${randomSpell.name}`,
      description: randomSpell.description,
      power: randomStrength.power + randomSpell.power,
      chance: randomSpell.chance,
      function: randomSpell.function,
      type: randomSpell.type
    };
  }

  get spells() {
    return spells;
  }

}

module.exports = SpellGen;
