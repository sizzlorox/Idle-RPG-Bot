
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
      rarity: 75
    },
    fireball = {
      name: 'Fireball',
      description: 'Shoots a fireball at the target',
      type: 'target',
      power: 1,
      chance: 50,
      rarity: 100
    },
  ]
};
module.exports = spells;
