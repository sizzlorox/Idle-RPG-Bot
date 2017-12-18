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
      gold: 4,
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
      gold: 5,
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
      gold: 6,
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
      gold: 7,
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
      gold: 8,
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
      gold: 9,
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
      gold: 2,
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
      gold: 3,
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
      gold: 4,
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
          str: 2,
          dex: 2,
          end: 2,
          int: 2
        },
        gold: 2
      },
      greatHelmet = {
        name: 'Great Helmet',
        position: 'helmet',
        stats: {
          str: 3,
          dex: 3,
          end: 3,
          int: 3
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
          dex: 1,
          end: 1,
          int: 1
        },
        gold: 1
      },
      mace = {
        name: 'Mace',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 2,
          end: 2,
          int: 2
        },
        gold: 2
      },
      staff = {
        name: 'Staff',
        position: 'weapon',
        stats: {
          str: 3,
          dex: 3,
          end: 3,
          int: 3
        },
        gold: 3
      },
      sword = {
        name: 'Sword',
        position: 'weapon',
        stats: {
          str: 4,
          dex: 4,
          end: 4,
          int: 4
        },
        gold: 4
      },
      claymore = {
        name: 'Claymore',
        position: 'weapon',
        stats: {
          str: 5,
          dex: 5,
          end: 5,
          int: 5
        },
        gold: 5
      },
      flail = {
        name: 'Flail',
        position: 'weapon',
        stats: {
          str: 6,
          dex: 6,
          end: 6,
          int: 6
        },
        gold: 6
      },
      wand = {
        name: 'Wand',
        position: 'weapon',
        stats: {
          str: 7,
          dex: 7,
          end: 7,
          int: 7
        },
        gold: 7
      },
      bow = {
        name: 'Bow',
        position: 'weapon',
        stats: {
          str: 8,
          dex: 8,
          end: 8,
          int: 8
        },
        gold: 8
      },
      crossbow = {
        name: 'Crossbow',
        position: 'weapon',
        stats: {
          str: 9,
          dex: 9,
          end: 9,
          int: 9
        },
        gold: 9
      },
      pike = {
        name: 'Pike',
        position: 'weapon',
        stats: {
          str: 10,
          dex: 10,
          end: 10,
          int: 10
        },
        gold: 10
      },
      halberd = {
        name: 'Halberd',
        position: 'weapon',
        stats: {
          str: 11,
          dex: 11,
          end: 11,
          int: 11
        },
        gold: 11
      },
      axe = {
        name: 'Axe',
        position: 'weapon',
        stats: {
          str: 12,
          dex: 12,
          end: 12,
          int: 12
        },
        gold: 12
      },
      maul = {
        name: 'Maul',
        position: 'weapon',
        stats: {
          str: 13,
          dex: 13,
          end: 13,
          int: 13
        },
        gold: 13
      },
      scythe = {
        name: 'Scythe',
        position: 'weapon',
        stats: {
          str: 14,
          dex: 14,
          end: 14,
          int: 14
        },
        gold: 14
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
