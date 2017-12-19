const items = {
  rarity: [
    common = {
      name: 'Common',
      stats: {
        str: 1,
        dex: 1,
        end: 1,
        int: 1
      },
      gold: 1,
      rarity: 100
    },
    uncommon = {
      name: 'Uncommon',
      stats: {
        str: 2,
        dex: 2,
        end: 2,
        int: 2
      },
      gold: 2,
      rarity: 50
    },
    unique = {
      name: 'Unique',
      stats: {
        str: 3,
        dex: 3,
        end: 3,
        int: 3
      },
      gold: 3,
      rarity: 25
    },
    rare = {
      name: 'Rare',
      stats: {
        str: 4,
        dex: 4,
        end: 4,
        int: 4
      },
      gold: 5,
      rarity: 15
    },
    magic = {
      name: 'Magic',
      stats: {
        str: 5,
        dex: 5,
        end: 5,
        int: 5
      },
      gold: 10,
      rarity: 10
    },
    legendary = {
      name: 'Legendary',
      stats: {
        str: 6,
        dex: 6,
        end: 6,
        int: 6
      },
      gold: 15,
      rarity: 5
    },
    mythical = {
      name: 'Mythical',
      stats: {
        str: 7,
        dex: 7,
        end: 7,
        int: 7
      },
      gold: 20,
      rarity: 3
    },
    ancient = {
      name: 'Ancient',
      stats: {
        str: 8,
        dex: 8,
        end: 8,
        int: 8
      },
      gold: 25,
      rarity: 2,
    },
    godly = {
      name: 'Godly',
      stats: {
        str: 9,
        dex: 9,
        end: 9,
        int: 9
      },
      gold: 30,
      rarity: 1
    }
  ],

  material: [
    bronze = {
      name: 'Bronze',
      stats: {
        str: 2,
        dex: 2,
        end: 2,
        int: 2
      },
      gold: 5,
      rarity: 100
    },
    iron = {
      name: 'Iron',
      stats: {
        str: 3,
        dex: 3,
        end: 3,
        int: 3
      },
      gold: 10,
      rarity: 50
    },
    steel = {
      name: 'Steel',
      stats: {
        str: 4,
        dex: 4,
        end: 4,
        int: 4
      },
      gold: 15,
      rarity: 30
    }
  ],

  type: [
    helmet = [
      helmet = {
        name: 'Helmet',
        position: 'helmet',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 1
        },
        gold: 1
      },
      hornedHelmet = {
        name: 'Horned Helmet',
        position: 'helmet',
        stats: {
          str: 1,
          dex: 3,
          end: 2,
          int: 1
        },
        gold: 2
      },
      greatHelmet = {
        name: 'Great Helmet',
        position: 'helmet',
        stats: {
          str: 3,
          dex: 1,
          end: 3,
          int: 1
        },
        gold: 3
      },
    ],
    weapon = [
      club = {
        name: 'Club',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 0,
          end: 1,
          int: 0
        },
        gold: 1
      },
      mace = {
        name: 'Mace',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 1,
          end: 1,
          int: 0
        },
        gold: 2
      },
      staff = {
        name: 'Staff',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 1,
          end: 0,
          int: 3
        },
        gold: 2
      },
      sword = {
        name: 'Sword',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 2,
          end: 1,
          int: 0
        },
        gold: 2
      },
      claymore = {
        name: 'Claymore',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 1,
          end: 1,
          int: 0
        },
        gold: 2
      },
      flail = {
        name: 'Flail',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 1,
          end: 2,
          int: 1
        },
        gold: 2
      },
      wand = {
        name: 'Wand',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 3
        },
        gold: 2
      },
      bow = {
        name: 'Bow',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 3,
          end: 1,
          int: 1
        },
        gold: 2
      },
      crossbow = {
        name: 'Crossbow',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 2,
          end: 1,
          int: 1
        },
        gold: 2
      },
      pike = {
        name: 'Pike',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 3
      },
      halberd = {
        name: 'Halberd',
        position: 'weapon',
        stats: {
          str: 3,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 4
      },
      axe = {
        name: 'Axe',
        position: 'weapon',
        stats: {
          str: 4,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 4
      },
      maul = {
        name: 'Maul',
        position: 'weapon',
        stats: {
          str: 5,
          dex: 1,
          end: 2,
          int: 1
        },
        gold: 5
      },
      scythe = {
        name: 'Scythe',
        position: 'weapon',
        stats: {
          str: 5,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 5
      },
    ],

    armor = [
      chainMail = {
        name: 'Chain Mail',
        position: 'armor',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 1
        },
        gold: 1,
        rarity: 80
      },
      thinBody = {
        name: 'Thin Body Armor',
        position: 'armor',
        stats: {
          str: 2,
          dex: 2,
          end: 2,
          int: 2
        },
        gold: 2,
        rarity: 50
      },
      fullBody = {
        name: 'Full Body Armor',
        position: 'armor',
        stats: {
          str: 3,
          dex: 3,
          end: 3,
          int: 3
        },
        gold: 3,
        rarity: 25
      },
    ]
  ]
};
module.exports = items;
