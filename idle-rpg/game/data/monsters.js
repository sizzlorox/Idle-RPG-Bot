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
    reincareration = {
      name: 'Reincareration of Eric as a',
      stats: {
        str: 7,
        dex: 7,
        end: 7
      },
      experience: 7,
      gold: 7,
      rarity: 1
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
    massive = {
      name: 'Massive',
      stats: {
        str: 3,
        dex: 1,
        end: 3
      },
      experience: 2,
      gold: 3,
      rarity: 30
    },
    armored = {
      name: 'Armored',
      stats: {
        str: 1,
        dex: 1,
        end: 3
      },
      experience: 1,
      gold: 2,
      rarity: 53
    },
    beserk = {
      name: 'Beserk',
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
    broke = {
      name: 'Broke',
      stats: {
        str: 1,
        dex: 1,
        end: 1
      },
      experience: 1,
      gold: 0,
      rarity: 94
    },
    cowardly = {
      name: 'Cowardly',
      stats: {
        str: 0,
        dex: 1,
        end: 1
      },
      experience: .5,
      gold: 1,
      rarity: 66
    },
    drunk = {
      name: 'Drunk',
      stats: {
        str: 1,
        dex: .25,
        end: 1
      },
      experience: .75,
      gold: .75,
      rarity: 75
    },
    starving = {
      name: 'Starving',
      stats: {
        str: 1,
        dex: 1,
        end: .5
      },
      experience: 1,
      gold: .25,
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
      stats: {
        str: 10,
        dex: 2,
        end: 10,
      },
      experience: 20,
      gold: 6,
      rarity: 25
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    griffon = {
      name: 'Griffon',
      isSpawnable: true,
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 5,
        end: 1,
      },
      experience: 2,
      gold: 1,
      rarity: 90
    },
    livingStatue = {
      name: 'Living Statue',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 5,
        dex: 1,
        end: 7,
      },
      experience: 6,
      gold: 6,
      rarity: 45
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    golem = {
      name: 'Golem',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 7,
        dex: 2,
        end: 7,
      },
      experience: 8,
      gold: 8,
      rarity: 60
    },
    merperson = {
      name: 'Merperson',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 8,
      gold: 8,
      rarity: 47
    },
    centaur = {
      name: 'Centaur',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 3,
      gold: 3,
      rarity: 71
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    cyclops = {
      name: 'Cyclops',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 4,
        dex: 2,
        end: 4,
      },
      experience: 5,
      gold: 3,
      rarity: 63
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    demon = {
      name: 'Demon',
      isSpawnable: true,
      spawnableMapType: ['Land'],
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
      spawnableMapType: ['Land'],
      stats: {
        str: 3,
        dex: 3,
        end: 3,
      },
      experience: 3,
      gold: 5,
      rarity: 73
    },
    flamingSkull = {
      name: 'Flaming Skull',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 3,
        end: 1,
      },
      experience: 15,
      gold: 5,
      rarity: 33
    },
    Flumph = {
      name: 'Flumph',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 1,
      },
      experience: 1,
      gold: 100,
      rarity: 20
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    kracken = {
      name: 'Kracken',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 20,
        dex: 20,
        end: 30,
      },
      experience: 50,
      gold: 50,
      rarity: 2
    },
    lich = {
      name: 'Lich',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 2,
        dex: 2,
        end: 1,
      },
      experience: 2,
      gold: 1,
      rarity: 64
    },
    oni = {
      name: 'Oni',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 4,
        dex: 4,
        end: 4,
      },
      experience: 4,
      gold: 16,
      rarity: 44.44
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    otyugh = {
      name: 'Otyugh',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 9,
        dex: 5,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 35
    },
    frostWorm = {
      name: 'Frost Worm',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 5,
      },
      experience: 5,
      gold: 6,
      rarity: 80
    },
    shambler = {
      name: 'Shambler',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 5,
        dex: 1,
        end: 8,
      },
      experience: 6,
      gold: 6,
      rarity: 60
    },
    slimeCube = {
      name: 'Slime Cube',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 1,
        dex: 1,
        end: 10,
      },
      experience: 15,
      gold: 10,
      rarity: 33
    },
    sphinx = {
      name: 'Sphinx',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 2,
        dex: 2,
        end: 10,
      },
      experience: 10,
      gold: 15,
      rarity: 41
    },
    cultist = {
      name: 'Cultist',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 3,
        dex: 5,
        end: 3,
      },
      experience: 5,
      gold: 10,
      rarity: 55
    },
    tribalWarrior = {
      name: 'Tribal Warrior',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 6,
        dex: 6,
        end: 6,
      },
      experience: 15,
      gold: 5,
      rarity: 33
    },
    baphomet = {
      name: 'Baphomet',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 8,
        dex: 8,
        end: 8,
      },
      experience: 13,
      gold: 20,
      rarity: 20
    },
    demogorgon = {
      name: 'Demogorgon',
      isSpawnable: true,
      spawnableMapType: ['Land'],
      stats: {
        str: 25,
        dex: 25,
        end: 30,
      },
      experience: 44,
      gold: 50,
      rarity: 2
    }
  ]
};
module.exports = monsters;
