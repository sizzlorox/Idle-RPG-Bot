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
      gold: 1,
      rarity: 100
    },
    veteran = {
      name: 'Veteran',
      stats: {
        str: 2,
        dex: 2,
        end: 2
      },
      experience: 2,
      gold: 2,
      rarity: 65
    },
    elite = {
      name: 'Elite',
      stats: {
        str: 3,
        dex: 3,
        end: 3
      },
      experience: 3,
      gold: 3,
      rarity: 45
    },
    champion = {
      name: 'Champion',
      stats: {
        str: 4,
        dex: 4,
        end: 4
      },
      experience: 4,
      gold: 4,
      rarity: 25
    },
    legendary = {
      name: 'Legendary',
      stats: {
        str: 5,
        dex: 5,
        end: 5
      },
      experience: 5,
      gold: 5,
      rarity: 5
    },
    omega = {
      name: 'Omega',
      stats: {
        str: 6,
        dex: 6,
        end: 6
      },
      experience: 6,
      gold: 6,
      rarity: 2
    }
  ],

  type: [
    rat = {
      name: 'Rat',
      isSpawnable: true,
      spawnableMapType: ['land', 'snow'],
      stats: {
        str: 1,
        dex: 1,
        end: 1,
      },
      experience: 4,
      gold: 2,
      rarity: 100
    },
    crab = {
      name: 'Crab',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 1,
        dex: 1,
        end: 1,
      },
      experience: 2,
      gold: 1,
      rarity: 100
    },
    slime = {
      name: 'Slime',
      isSpawnable: true,
      spawnableMapType: ['land', 'snow'],
      stats: {
        str: 2,
        dex: 2,
        end: 1,
      },
      experience: 5,
      gold: 2,
      rarity: 100
    },
    goblin = {
      name: 'Goblin',
      isSpawnable: true,
      spawnableMapType: ['land', 'snow'],
      stats: {
        str: 2,
        dex: 1,
        end: 2,
      },
      experience: 6,
      gold: 2,
      rarity: 90
    },
    bandit = {
      name: 'Bandit',
      isSpawnable: true,
      spawnableMapType: ['land', 'snow'],
      stats: {
        str: 5,
        dex: 2,
        end: 5,
      },
      experience: 10,
      gold: 3,
      rarity: 80
    },
    bat = {
      name: 'Bat',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 2,
        dex: 5,
        end: 1,
      },
      experience: 7,
      gold: 4,
      rarity: 90
    },
    dragon = {
      name: 'Dragon',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 10,
        dex: 7,
        end: 10,
      },
      experience: 35,
      gold: 5,
      rarity: 65
    },
    knight = {
      name: 'Knight',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 7,
        dex: 3,
        end: 17,
      },
      experience: 25,
      gold: 6,
      rarity: 50
    },
    necromancer = {
      name: 'Necromancer',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 19,
        dex: 2,
        end: 4,
      },
      experience: 30,
      gold: 7,
      rarity: 50
    },
    zombie = {
      name: 'Zombie',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 4,
        dex: 1,
        end: 12,
      },
      experience: 15,
      gold: 3,
      rarity: 75
    },
    orc = {
      name: 'Orc',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 17,
        dex: 1,
        end: 7,
      },
      experience: 20,
      gold: 8,
      rarity: 50
    },
    elf = {
      name: 'Elf',
      isSpawnable: true,
      spawnableMapType: ['land'],
      stats: {
        str: 4,
        dex: 29,
        end: 3,
      },
      experience: 20,
      gold: 9,
      rarity: 15
    },
    yeti = {
      name: 'Yeti',
      isXmasEvent: true,
      isSpawnable: false,
      spawnableMapType: ['snow'],
      stats: {
        str: 20,
        dex: 2,
        end: 15
      },
      experience: 25,
      gold: 12,
      rarity: 50
    },
    xmasGnome = {
      name: 'Christmas Gnome',
      isXmasEvent: true,
      isSpawnable: false,
      spawnableMapType: ['snow'],
      stats: {
        str: 5,
        dex: 2,
        end: 15
      },
      experience: 5,
      gold: 9,
      rarity: 85
    }
  ]
};
module.exports = monsters;
