const { map } = require('../../utils/enumHelper');

const monsters = {
  rarity: [
    starving = {
      name: 'Starving',
      power: 0.5,
      health: 5,
      stats: {
        str: 0.5,
        dex: 0.5,
        end: 0.5,
        int: 0.5,
        luk: 0.5
      },
      experience: 1,
      gold: 0.25,
      rarity: 100
    },
    normal = {
      name: 'Normal',
      power: 1,
      health: 10,
      stats: {
        str: 1,
        dex: 1,
        end: 1,
        int: 1,
        luk: 1
      },
      experience: 1,
      gold: 1,
      rarity: 100
    },
    veteran = {
      name: 'Veteran',
      power: 1.25,
      health: 15,
      stats: {
        str: 1.25,
        dex: 1.25,
        end: 1.25,
        int: 1.25,
        luk: 1.25
      },
      experience: 2,
      gold: 2,
      rarity: 50
    },
    elite = {
      name: 'Elite',
      power: 1.5,
      health: 20,
      stats: {
        str: 1.5,
        dex: 1.5,
        end: 1.5,
        int: 1.5,
        luk: 1.5
      },
      experience: 3,
      gold: 3,
      rarity: 30
    },
    champion = {
      name: 'Champion',
      power: 1.75,
      health: 25,
      stats: {
        str: 1.75,
        dex: 1.75,
        end: 1.75,
        int: 1.75,
        luk: 1.75
      },
      experience: 4,
      gold: 4,
      rarity: 15
    },
    legendary = {
      name: 'Legendary',
      power: 2,
      health: 30,
      stats: {
        str: 2,
        dex: 2,
        end: 2,
        int: 2,
        luk: 2
      },
      experience: 5,
      gold: 5,
      rarity: 10
    },
    omega = {
      name: 'Omega',
      power: 2.25,
      health: 40,
      stats: {
        str: 2.25,
        dex: 2.25,
        end: 2.25,
        int: 2.25,
        luk: 2.25
      },
      experience: 6,
      gold: 6,
      rarity: 2
    },
    undead = {
      name: 'Undead',
      power: 2.5,
      health: 25,
      stats: {
        str: 2.5,
        dex: 2.5,
        end: 2.5,
        int: 2.5,
        luk: 2.5
      },
      experience: 1,
      gold: 1,
      rarity: 5
    },
    deadly = {
      name: 'Deadly',
      power: 2.75,
      health: 35,
      stats: {
        str: 2.75,
        dex: 2.75,
        end: 2.75,
        int: 2.75,
        luk: 2.75
      },
      experience: 6,
      gold: 6,
      rarity: 4
    },
    berserk = {
      name: 'Berserk',
      power: 3,
      health: 45,
      stats: {
        str: 3,
        dex: 3,
        end: 3,
        int: 3,
        luk: 3
      },
      experience: 3,
      gold: 1,
      rarity: 3
    },
    corrupted = {
      name: 'Corrupted',
      power: 3.25,
      health: 30,
      stats: {
        str: 3.25,
        dex: 3.25,
        end: 3.25,
        int: 3.25,
        luk: 3.25
      },
      experience: 7,
      gold: 7,
      rarity: 2
    },
  ],

  type: [
    rat = {
      name: 'Rat',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.coast,
        map.biomes.haunted,
        map.biomes.forest,
        map.biomes.plains,
        map.biomes.mountains,
        map.biomes.swamp,
        map.biomes.grassland,
        map.biomes.caves,
        map.biomes.plateau,
        map.biomes.moors,
        map.biomes.desert
      ],
      power: 1,
      health: 7,
      stats: {
        str: 0.5,
        dex: 0.5,
        end: 0.10,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 0.25
        },
        armor: {
          name: 'fur',
          power: 0.01
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 4,
      gold: 2,
      rarity: 100
    },

    crab = {
      name: 'Crab',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.coast,
        map.biomes.swamp
      ],
      power: 1.25,
      health: 9,
      stats: {
        str: 1,
        dex: 0.25,
        end: 0.25,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'pinchers',
          power: 0.5
        },
        armor: {
          name: 'shell',
          power: 0.02,
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 2,
      gold: 1,
      rarity: 100
    },

    bat = {
      name: 'Bat',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.caves,
        map.biomes.forest,
        map.biomes.haunted
      ],
      power: 1.25,
      health: 45,
      stats: {
        str: 1,
        dex: 0.25,
        end: 0.5,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 0.5
        },
        armor: {
          name: 'fur',
          power: 0.02
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 7,
      gold: 4,
      rarity: 90
    },

    slime = {
      name: 'Slime',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.grassland,
        map.biomes.plains,
        map.biomes.forest,
        map.biomes.plateau,
        map.biomes.moors
      ],
      power: 1.5,
      health: 35,
      stats: {
        str: 1.25,
        dex: 0.5,
        end: 0.5,
        int: 1.25,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'slime',
          power: 0.5
        },
        armor: {
          name: 'slime',
          power: 0.05
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 5,
      gold: 2,
      rarity: 100
    },

    pixie = {
      name: 'Pixie',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest
      ],
      power: 1.5,
      health: 35,
      stats: {
        str: 1.25,
        dex: 1,
        end: 0.5,
        int: 1.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'wand',
          power: 0.75
        },
        armor: {
          name: 'stuff',
          power: 0.05
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 2,
      gold: 2,
      rarity: 75
    },

    goblin = {
      name: 'Goblin',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest,
        map.biomes.plateau,
        map.biomes.mountains,
        map.biomes.plains,
        map.biomes.moors
      ],
      power: 1.75,
      health: 50,
      stats: {
        str: 1.25,
        dex: 0.5,
        end: 1.5,
        int: 1.25,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'dagger',
          power: 0.75
        },
        armor: {
          name: 'rusty chainmail',
          power: 0.10
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 6,
      gold: 2,
      rarity: 90
    },

    bandit = {
      name: 'Bandit',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plateau,
        map.biomes.coast,
        map.biomes.forest,
        map.biomes.plains,
        map.biomes.mountains,
        map.biomes.moors
      ],
      power: 1.75,
      health: 75,
      stats: {
        str: 1.25,
        dex: 2,
        end: 1.5,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'dagger',
          power: 1
        },
        armor: {
          name: 'leather armor',
          power: 0.10
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 10,
      gold: 3,
      rarity: 80
    },

    zombie = {
      name: 'Zombie',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.haunted
      ],
      power: 1.5,
      health: 65,
      stats: {
        str: 1.25,
        dex: 0.5,
        end: 2,
        int: 2,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'undeadly hands ewwww',
          power: 1.25
        },
        armor: {
          name: '',
          power: 0.25
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 15,
      gold: 3,
      rarity: 75
    },

    knight = {
      name: 'Knight',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest,
        map.biomes.plains,
        map.biomes.coast,
        map.biomes.plateau,
        map.biomes.mountains,
        map.biomes.haunted
      ],
      power: 1.75,
      health: 100,
      stats: {
        str: 1.25,
        dex: 2,
        end: 1.5,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claymore',
          power: 1.25
        },
        armor: {
          name: 'iron full armor',
          power: 0.15
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 25,
      gold: 6,
      rarity: 50
    },

    necromancer = {
      name: 'Necromancer',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.haunted,
        map.biomes.caves
      ],
      power: 2,
      health: 85,
      stats: {
        str: 1.25,
        dex: 2.5,
        end: 1,
        int: 2,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'magic',
          name: 'staff',
          power: 1.25
        },
        armor: {
          name: 'robe',
          power: 0.10
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 30,
      gold: 7,
      rarity: 50
    },

    gargoyle = {
      name: 'Gargoyle',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.haunted,
        map.biomes.mountains
      ],
      power: 2,
      health: 160,
      stats: {
        str: 1.5,
        dex: 2,
        end: 2,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 0.90
        },
        armor: {
          name: '',
          power: 0.5
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 20,
      gold: 6,
      rarity: 25
    },

    bugbear = {
      name: 'Bugbear',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains,
        map.biomes.forest,
        map.biomes.plateau,
        map.biomes.mountains,
        map.biomes.caves
      ],
      power: 2.25,
      health: 175,
      stats: {
        str: 1.75,
        dex: 1.5,
        end: 1.75,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'mouth',
          power: 1.25
        },
        armor: {
          name: '',
          power: 0.40
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 5,
      gold: 3,
      rarity: 75
    },

    griffin = {
      name: 'Griffin',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains,
        map.biomes.plateau
      ],
      power: 2,
      health: 120,
      stats: {
        str: 1.75,
        dex: 2.25,
        end: 1.5,
        int: 1.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 1.25
        },
        armor: {
          name: '',
          power: 0.25
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 8,
      gold: 8,
      rarity: 48
    },

    orc = {
      name: 'Orc',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains,
        map.biomes.mountains,
        map.biomes.forest,
        map.biomes.moors
      ],
      power: 2.5,
      health: 125,
      stats: {
        str: 2.5,
        dex: 0.5,
        end: 2,
        int: 0.25,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'rusty broadsword',
          power: 1.5
        },
        armor: {
          name: '',
          power: 0.25
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 20,
      gold: 8,
      rarity: 50
    },

    elf = {
      name: 'Elf',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest
      ],
      power: 2,
      health: 90,
      stats: {
        str: 1.75,
        dex: 3,
        end: 1.75,
        int: 1.25,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'range',
          name: 'bow',
          power: 1.5
        },
        armor: {
          name: '',
          power: 0.25
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 20,
      gold: 9,
      rarity: 15
    },

    wereWolf = {
      name: 'Werewolf',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest,
        map.biomes.mountains
      ],
      power: 2,
      health: 115,
      stats: {
        str: 3,
        dex: 2,
        end: 2,
        int: 0.75,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 1.75
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 11,
      gold: 11,
      rarity: 35
    },

    basilisk = {
      name: 'Basilisk',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.caves
      ],
      power: 2.25,
      health: 190,
      stats: {
        str: 2.5,
        dex: 1.5,
        end: 2.25,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'mouth',
          power: 1.75
        },
        armor: {
          name: '',
          power: 0.5
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 27,
      gold: 9,
      rarity: 10
    },

    unicorn = {
      name: 'Unicorn',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest
      ],
      power: 0.90,
      health: 45,
      stats: {
        str: 1,
        dex: 1.85,
        end: 0.9,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'horn',
          power: 0.75
        },
        armor: {
          name: '',
          power: 0.5
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 5,
      gold: 4,
      rarity: 50
    },

    wraith = {
      name: 'Wraith',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.haunted
      ],
      power: 1.2,
      health: 95,
      stats: {
        str: 1,
        dex: 1.75,
        end: 1.2,
        int: 1.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'something',
          power: 1.75
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 6,
      gold: 5,
      rarity: 80
    },

    dragon = {
      name: 'Dragon',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.mountains
      ],
      power: 3,
      health: 145,
      stats: {
        str: 2.75,
        dex: 1.75,
        end: 3,
        int: 2,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 2.5
        },
        armor: {
          name: 'scales',
          power: 1.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 35,
      gold: 5,
      rarity: 65
    },

    yeti = {
      name: 'Yeti',
      isXmasEvent: true,
      isSpawnable: false,
      spawnableBiomes: [
        'Tundra'
      ],
      power: 1.75,
      health: 150,
      stats: {
        str: 1.75,
        dex: 1.75,
        end: 1.75,
        int: 1.75,
        luk: 1.75
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: '',
          power: 1.75
        },
        armor: {
          name: '',
          power: 1.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 25,
      gold: 12,
      rarity: 60
    },
    xmasGnome = {
      name: 'Christmas Gnome',
      isXmasEvent: true,
      isSpawnable: false,
      spawnableBiomes: [
        'Tundra'
      ],
      power: 0.75,
      health: 45,
      stats: {
        str: 0.75,
        dex: 0.75,
        end: 0.75,
        int: 0.75,
        luk: 0.75
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: '',
          power: 0.75
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 5,
      gold: 9,
      rarity: 95
    },

    giantSpider = {
      name: 'Giant Spider',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest,
        map.biomes.desert
      ],
      power: 1,
      health: 75,
      stats: {
        str: 0.85,
        dex: 2,
        end: 0.75,
        int: 0.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'fangs',
          power: 0.55
        },
        armor: {
          name: '',
          power: 0.5
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 7,
      gold: 7,
      rarity: 50
    },

    killerBee = {
      name: 'Killer Bee',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest
      ],
      power: 0.2,
      health: 50,
      stats: {
        str: 1,
        dex: 2,
        end: 0.2,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'stinger',
          power: 0.75
        },
        armor: {
          name: '',
          power: 0.5
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 2,
      gold: 1,
      rarity: 90
    },

    golem = {
      name: 'Golem',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.mountains,
        map.biomes.plains,
        map.biomes.caves,
        map.biomes.desert
      ],
      power: 2,
      health: 200,
      stats: {
        str: 1.75,
        dex: 0.2,
        end: 3,
        int: 1.2,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'hands',
          power: 0.75
        },
        armor: {
          name: '',
          power: 2
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 8,
      gold: 8,
      rarity: 60
    },

    centaur = {
      name: 'Centaur',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains
      ],
      power: 1,
      health: 135,
      stats: {
        str: 1,
        dex: 1,
        end: 1,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'sword',
          power: 1
        },
        armor: {
          name: '',
          power: 1
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 3,
      gold: 3,
      rarity: 71
    },

    cyclops = {
      name: 'Cyclops',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.mountains,
        map.biomes.plains
      ],
      power: 1,
      health: 160,
      stats: {
        str: 1.65,
        dex: 0.5,
        end: 1.2,
        int: 1,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'sword',
          power: 1.75
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 5,
      gold: 3,
      rarity: 63
    },

    demon = {
      name: 'Demon',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.haunted
      ],
      power: 2,
      health: 185,
      stats: {
        str: 1.5,
        dex: 1.2,
        end: 2,
        int: 1.75,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'club',
          power: 1.3
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 6,
      gold: 6,
      rarity: 66.6
    },

    elemental = {
      name: 'Elemental',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains,
        map.biomes.forest,
        map.biomes.mountains,
        map.biomes.desert
      ],
      power: 1,
      health: 150,
      stats: {
        str: 1,
        dex: 1.2,
        end: 1,
        int: 2.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'magic',
          name: 'magic',
          power: 1
        },
        armor: {
          name: '',
          power: 1
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 3,
      gold: 5,
      rarity: 73
    },

    sphinx = {
      name: 'Sphinx',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.desert
      ],
      power: 1.45,
      health: 210,
      stats: {
        str: 1.95,
        dex: 2,
        end: 1.25,
        int: 1.75,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 1.25
        },
        armor: {
          name: '',
          power: 0.75
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 10,
      gold: 15,
      rarity: 41
    },

    tribalWarrior = {
      name: 'Tribal Warrior',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest,
        map.biomes.plains,
        map.biomes.plateau
      ],
      power: 1,
      health: 110,
      stats: {
        str: 2.15,
        dex: 0.5,
        end: 1.15,
        int: 0.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'sword',
          power: 1
        },
        armor: {
          name: '',
          power: 0.95
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 15,
      gold: 5,
      rarity: 33
    },

    chaoticTriceratops = {
      name: 'Will-o\'-the-wisp',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.forest
      ],
      power: 1,
      health: 75,
      stats: {
        str: 0.75,
        dex: 2.15,
        end: 1,
        int: 2.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'magic',
          name: 'magic',
          power: 2
        },
        armor: {
          name: '',
          power: 0.95
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 10,
      gold: 25,
      rarity: 20
    },

    chaoticTriceratops = {
      name: 'Chaotic Triceratops',
      isSpawnable: true,
      spawnableBiomes: [
        map.biomes.plains,
        map.biomes.forest,
        map.biomes.swamp,
        map.biomes.grassland
      ],
      power: 1,
      health: 235,
      stats: {
        str: 2.15,
        dex: 0.5,
        end: 2.15,
        int: 0.5,
        luk: 1
      },
      equipment: {
        weapon: {
          attackType: 'melee',
          name: 'claws',
          power: 1.2
        },
        armor: {
          name: '',
          power: 0.95
        }
      },
      inventory: {
        items: []
      },
      spells: [],
      experience: 20,
      gold: 5,
      rarity: 15
    }
  ]
};
module.exports = monsters;
