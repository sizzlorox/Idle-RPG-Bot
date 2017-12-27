
const spells = {
  strength: [
    normal = {
      name: 'Normal',
      power: 1,
      rarity: 100,
    },
    channeled = {
      name: 'Channeled',
      power: 2,
      rarity: 25
    },
    empowered = {
      name: 'Empowered',
      power: 3,
      rarity: 5,
    }
  ],

  spell: [
    heal = {
      name: 'Heal',
      description: 'Heals player',
      type: 'self',
      power: 1,
      chance: 50,
      rarity: 75,
      function: (self, totalPower) => {
        self.health += totalPower * 2;
        console.log(`${selft.name} healed for ${totalPower * 2}`);
        if (self.health >= 100 + (player.level * 5)) {
          selft.health = 100 + (player.level * 5);
        }
      }
    },
    fireball = {
      name: 'Fireball',
      description: 'Shoots a fireball at the target',
      type: 'target',
      power: 1,
      chance: 50,
      rarity: 100,
      function: (target, totalPower, magicDefense) => {
        let spellDamage = Math.ceil((totalPower * 2) - magicDefense);
        if (spellDamage < 0) {
          spellDamage = 0;
        }
        target.health -= spellDamage;
        console.log(`${target.name} took a fireball to the face for ${spellDamage} damage`);
        return spellDamage;
      }
    },
  ]
};
module.exports = spells;
