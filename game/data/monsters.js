const monsters = {
  rarity: [
    normal = {
      name: 'Normal',
      stats: {
        str: 1,
        dex: 1,
        end: 1
      },
      experience: 1,
      gold: 1
    },
    veteran = {
      name: 'Veteran',
      stats: {
        str: 2,
        dex: 2,
        end: 2
      },
      experience: 2,
      gold: 2
    },
    elite = {
      name: 'Elite',
      stats: {
        str: 3,
        dex: 3,
        end: 3
      },
      experience: 3,
      gold: 3
    },
    champion = {
      name: 'Champion',
      stats: {
        str: 4,
        dex: 4,
        end: 4
      },
      experience: 4,
      gold: 4
    },
    legendary = {
      name: 'Legendary',
      stats: {
        str: 5,
        dex: 5,
        end: 5
      },
      experience: 5,
      gold: 5
    },
    omega = {
      name: 'Omega',
      stats: {
        str: 6,
        dex: 6,
        end: 6
      },
      experience: 6,
      gold: 6
    }
  ],

  type: [
    crab = {
      name: 'Crab',
      stats: {
        str: 1,
        dex: 1,
        end: 1,
      },
      experience: 1,
      gold: 1
    },
    goblin = {
      name: 'Goblin',
      stats: {
        str: 2,
        dex: 1,
        end: 2,
      },
      experience: 5,
      gold: 2
    },
    bandit = {
      name: 'Bandit',
      stats: {
        str: 5,
        dex: 2,
        end: 5,
      },
      experience: 10,
      gold: 3
    },
    bat = {
      name: 'Bat',
      stats: {
        str: 2,
        dex: 5,
        end: 1,
      },
      experience: 3,
      gold: 4
    },
    dragon = {
      name: 'Dragon',
      stats: {
        str: 10,
        dex: 7,
        end: 10,
      },
      experience: 35,
      gold: 5
    },
    knight = {
      name: 'Knight',
      stats: {
        str: 7,
        dex: 3,
        end: 17,
      },
      experience: 25,
      gold: 6
    },
    necromancer = {
      name: 'Necromancer',
      stats: {
        str: 19,
        dex: 2,
        end: 4,
      },
      experience: 30,
      gold: 7
    },
    zombie = {
      name: 'Zombie',
      stats: {
        str: 4,
        dex: 1,
        end: 12,
      },
      experience: 15,
      gold: 3
    },
    orc = {
      name: 'Orc',
      stats: {
        str: 27,
        dex: 1,
        end: 7,
      },
      experience: 20,
      gold: 8
    },
    elf = {
      name: 'Elf',
      stats: {
        str: 4,
        dex: 29,
        end: 3,
      },
      experience: 20,
      gold: 9
    }
  ]
};
module.exports = monsters;
