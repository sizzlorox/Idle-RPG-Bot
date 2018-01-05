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
    },
    undead = {
      name: 'Undead',
      stats: {
        str: 1,
        dex: 1,
        end: 1
      },
      experience: 1,
      gold: 1,
      rarity: 50
    },
    deadly = {
      name: 'Deadly',
      stats: {
        str: 6,
        dex: 3,
        end: 6
      },
      experience: 6,
      gold: 6,
      rarity: 6
    },
    berserk = {
      name: 'Berserk',
      stats: {
        str: 4,
        dex: 2,
        end: 3
      },
      experience: 3,
      gold: 1,
      rarity: 44
    },
    corrupted = {
      name: 'Corrupted',
      stats: {
        str: 2,
        dex: 1,
        end: 2
      },
      experience: 1.5,
      gold: 1.5,
      rarity: 71
    },
    starving = {
      name: 'Starving',
      stats: {
        str: 1,
        dex: 1,
        end: 0.5
      },
      experience: 1,
      gold: 0.25,
      rarity: 75
    },
  ],

  type: [
    rat = {
      name: 'Rat',
      isSpawnable: true,
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land', 'Snow'],
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
      spawnableMapType: ['Land', 'Snow'],
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
      spawnableMapType: ['Land', 'Snow'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land', 'Undead Land'],
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
      spawnableMapType: ['Land', 'Plains', 'Forest'],
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
      spawnableMapType: ['Land', 'Forest'],
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
      spawnableMapType: ['Snow'],
      stats: {
        str: 12,
        dex: 2,
        end: 9
      },
      experience: 25,
      gold: 12,
      rarity: 60
    },
    xmasGnome = {
      name: 'Christmas Gnome',
      isXmasEvent: true,
      isSpawnable: false,
      spawnableMapType: ['Snow'],
      stats: {
        str: 5,
        dex: 2,
        end: 9
      },
      experience: 5,
      gold: 9,
      rarity: 95
    },
    basilisk = {
      name: 'Basilisk',
      isSpawnable: true,
      spawnableMapType: ['Mountains'],
      stats: {
        str: 30,
        dex: 10,
        end: 20,
      },
      experience: 27,
      gold: 9,
      rarity: 10
    },
    bugbear = {
      name: 'Bugbear',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Plains'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 5,
      gold: 3,
      rarity: 75
    },
    gargoyle = {
      name: 'Gargoyle',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 10,
        dex: 2,
        end: 10,
      },
      experience: 20,
      gold: 6,
      rarity: 25
    },
    griffin = {
      name: 'Griffin',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Plains'],
      stats: {
        str: 8,
        dex: 8,
        end: 8,
      },
      experience: 8,
      gold: 8,
      rarity: 48
    },
    wereWolf = {
      name: 'Werewolf',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 9,
        dex: 7,
        end: 7,
      },
      experience: 11,
      gold: 11,
      rarity: 35
    },
    pixie = {
      name: 'Pixie',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 2,
        dex: 2,
        end: 1,
      },
      experience: 2,
      gold: 2,
      rarity: 75
    },
    unicorn = {
      name: 'Unicorn',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 4,
        dex: 4,
        end: 4,
      },
      experience: 5,
      gold: 4,
      rarity: 50
    },
    wraith = {
      name: 'Wraith',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Undead Land'],
      stats: {
        str: 1,
        dex: 4,
        end: 4,
      },
      experience: 4,
      gold: 5,
      rarity: 80
    },
    giantSpider = {
      name: 'Giant Spider',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 6,
        dex: 6,
        end: 1,
      },
      experience: 7,
      gold: 7,
      rarity: 50
    },
    killerBee = {
      name: 'Killer Bee',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest'],
      stats: {
        str: 1,
        dex: 5,
        end: 1,
      },
      experience: 2,
      gold: 1,
      rarity: 90
    },
    golem = {
      name: 'Golem',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Mountains', 'Plains'],
      stats: {
        str: 7,
        dex: 2,
        end: 7,
      },
      experience: 8,
      gold: 8,
      rarity: 60
    },
    centaur = {
      name: 'Centaur',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Plains'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 3,
      gold: 3,
      rarity: 71
    },
    cyclops = {
      name: 'Cyclops',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Mountains', 'Plains'],
      stats: {
        str: 4,
        dex: 2,
        end: 4,
      },
      experience: 5,
      gold: 3,
      rarity: 63
    },
    demon = {
      name: 'Demon',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Undead Land'],
      stats: {
        str: 6,
        dex: 6,
        end: 6,
      },
      experience: 6,
      gold: 6,
      rarity: 66.6
    },
    elemental = {
      name: 'Elemental',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Plains', 'Forest', 'Mountains'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 3,
      gold: 5,
      rarity: 73
    },
    sphinx = {
      name: 'Sphinx',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Desert'],
      stats: {
        str: 2,
        dex: 2,
        end: 10,
      },
      experience: 10,
      gold: 15,
      rarity: 41
    },
    tribalWarrior = {
      name: 'Tribal Warrior',
      isSpawnable: true,
      spawnableMapType: ['Land', 'Forest', 'Plains'],
      stats: {
        str: 6,
        dex: 6,
        end: 6,
      },
      experience: 15,
      gold: 5,
      rarity: 33
    }
  ]
};
module.exports = monsters;
