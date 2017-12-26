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
      gold: 2,
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
      gold: 3,
      rarity: 50
    },
    sturdy = {
      name: 'Sturdy',
      stats: {
        str: 3,
        dex: 2,
        end: 3,
        int: 2
      },
      gold: 4,
      rarity: 40
    },
    reinforced = {
      name: 'Reinforced',
      stats: {
        str: 3,
        dex: 1,
        end: 4,
        int: 2
      },
      gold: 4,
      rarity: 30
    },
    unique = {
      name: 'Unique',
      stats: {
        str: 3,
        dex: 3,
        end: 3,
        int: 3
      },
      gold: 5,
      rarity: 25
    },
    hardened = {
      name: 'Hardened',
      stats: {
        str: 5,
        dex: 2,
        end: 5,
        int: 2
      },
      gold: 6,
      rarity: 20
    },
    rare = {
      name: 'Rare',
      stats: {
        str: 4,
        dex: 4,
        end: 4,
        int: 4
      },
      gold: 7,
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
    },
    crack = {
      name: 'Cracked',
      stats: {
        str: 0,
        dex: 0,
        end: 0,
        int: 0
      },
      gold: 1,
      rarity: 100
    },
    crude = {
      name: 'Crude',
      stats: {
        str: 1,
        dex: 0,
        end: 1,
        int: 0
      },
      gold: 1,
      rarity: 75
    },
    battered = {
      name: 'Battered',
      stats: {
        str: 1,
        dex: 1,
        end: 0,
        int: 1
      },
      gold: 1,
      rarity: 75
    },
  ],

  material: [
    wood = {
      name: 'Wooden',
      stats: {
        str: 0,
        dex: 3,
        end: 1,
        int: 1
      },
      gold: 5,
      rarity: 100
    },
    stone = {
      name: 'Stone',
      stats: {
        str: 1,
        dex: 0,
        end: 3,
        int: 1
      },
      gold: 5,
      rarity: 100
    },
    copper = {
      name: 'Copper',
      stats: {
        str: 2,
        dex: 2,
        end: 1,
        int: 1
      },
      gold: 8,
      rarity: 90
    },
    iron = {
      name: 'Iron',
      stats: {
        str: 2,
        dex: 2,
        end: 2,
        int: 2
      },
      gold: 10,
      rarity: 70
    },
    bronze = {
      name: 'Bronze',
      stats: {
        str: 3,
        dex: 3,
        end: 3,
        int: 3
      },
      gold: 13,
      rarity: 50
    },
    bone = {
      name: 'Bone',
      stats: {
        str: 2,
        dex: 5,
        end: 2,
        int: 5
      },
      gold: 15,
      rarity: 40
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
    },
    diamond = {
      name: 'Diamond',
      stats: {
        str: 4,
        dex: 3,
        end: 5,
        int: 4
      },
      gold: 22,
      rarity: 10
    },
    mithril = {
      name: 'Mithril',
      stats: {
        str: 5,
        dex: 5,
        end: 5,
        int: 5
      },
      gold: 25,
      rarity: 5
    },
    adamant = {
      name: 'Adamantine',
      stats: {
        str: 6,
        dex: 6,
        end: 6,
        int: 6
      },
      gold: 30,
      rarity: 3
    },
  ],

  type: [
    helmet = [
      helm = {
        name: 'Helm',
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
      spikedHelmet = {
        name: 'Spiked Helmet',
        position: 'helmet',
        stats: {
          str: 5,
          dex: 0,
          end: 3,
          int: 0
        },
        gold: 3
      },
      minerHelmet = {
        name: 'Miners Helmet',
        position: 'helmet',
        stats: {
          str: 2,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 3
      },
      kettleHelm = {
        name: 'Kettle Helm',
        position: 'helmet',
        stats: {
          str: 4,
          dex: 0,
          end: 4,
          int: 2
        },
        gold: 3
      },
      chainHood = {
        name: 'Chainmail Hood',
        position: 'helmet',
        stats: {
          str: 1,
          dex: 3,
          end: 2,
          int: 1
        },
        gold: 3
      },
      basinet = {
        name: 'Basinet',
        position: 'helmet',
        stats: {
          str: 4,
          dex: -3,
          end: 3,
          int: 1
        },
        gold: 3
      },
      bucketHelm = {
        name: 'Bucket Helm',
        position: 'helmet',
        stats: {
          str: 2,
          dex: 3,
          end: 2,
          int: 2
        },
        gold: 3
      },
      nasalHelmet = {
        name: 'Nasal Helmet',
        position: 'helmet',
        stats: {
          str: 3,
          dex: 3,
          end: 3,
          int: 1
        },
        gold: 3
      },
      bucket = {
        name: 'Bucket',
        position: 'helmet',
        stats: {
          str: 1,
          dex: 3,
          end: 0,
          int: -3
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
      falchion = {
        name: 'Falchion',
        position: 'weapon',
        stats: {
          str: 6,
          dex: 2,
          end: 3,
          int: 1
        },
        gold: 5
      },
      katana = {
        name: 'Katana',
        position: 'weapon',
        stats: {
          str: 5,
          dex: 0,
          end: 0,
          int: 10
        },
        gold: 5
      },
      ulfberht = {
        name: 'Ulfberht',
        position: 'weapon',
        stats: {
          str: 4,
          dex: 4,
          end: 3,
          int: 1
        },
        gold: 5
      },
      morningStar = {
        name: 'Morning star',
        position: 'weapon',
        stats: {
          str: 4,
          dex: 1,
          end: 1,
          int: 0
        },
        gold: 5
      },
      glaive = {
        name: 'Glaive',
        position: 'weapon',
        stats: {
          str: 5,
          dex: 2,
          end: 2,
          int: 1
        },
        gold: 5
      },
      sling = {
        name: 'Sling',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 2,
          end: 1,
          int: 1
        },
        gold: 5
      },
      chakram = {
        name: 'Chakram',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 7,
          end: 1,
          int: 3
        },
        gold: 5
      },
      shuriken = {
        name: 'Shuriken',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 4,
          end: 2,
          int: 1
        },
        gold: 5
      },
      spear = {
        name: 'Spear',
        position: 'weapon',
        stats: {
          str: 3,
          dex: -1,
          end: 3,
          int: 1
        },
        gold: 5
      },
      dagger = {
        name: 'Dagger',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 3,
          end: 2,
          int: 1
        },
        gold: 5
      },
      whip = {
        name: 'Tipped Whip',
        position: 'weapon',
        stats: {
          str: 2,
          dex: 4,
          end: 2,
          int: 1
        },
        gold: 5
      },
      wizardStaff = {
        name: 'Wizard Staff',
        position: 'weapon',
        stats: {
          str: 1,
          dex: 0,
          end: 1,
          int: 7
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
          dex: 3,
          end: 1,
          int: 1
        },
        gold: 1,
        rarity: 80
      },
      thinBody = {
        name: 'Cheap Plate Armour',
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
        name: 'Highend Plate Armor',
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
      scale = {
        name: 'Scale Armor',
        position: 'armor',
        stats: {
          str: 3,
          dex: 5,
          end: 3,
          int: 2
        },
        gold: 3,
        rarity: 30
      },
      studded = {
        name: 'Studded Armor',
        position: 'armor',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 1
        },
        gold: 3,
        rarity: 60
      },
      segmented = {
        name: 'Segmented Armor',
        position: 'armor',
        stats: {
          str: 1,
          dex: 3,
          end: 3,
          int: 0
        },
        gold: 3,
        rarity: 50
      },
    ],

    relic = [
      snowFlake = {
        name: 'Snowflake',
        droppedBy: ['Yeti', 'Christmas Gnome'],
        isXmasEvent: true,
        isDroppable: false,
        position: 'relic',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 1,
          luk: 4,
        },
        gold: 3,
        rarity: 60
      },
      yetiTooth = {
        name: 'Yetis Tooth',
        droppedBy: ['Yeti'],
        isXmasEvent: true,
        isDroppable: false,
        position: 'relic',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 1,
          luk: 3,
        },
        gold: 3,
        rarity: 60
      },
      candyCane = {
        name: 'Candy Cane',
        droppedBy: ['Yeti', 'Christmas Gnome'],
        isXmasEvent: true,
        isDroppable: false,
        position: 'relic',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 2,
          luk: 1
        },
        gold: 3,
        rarity: 90
      }
    ]
  ]
};
module.exports = items;
