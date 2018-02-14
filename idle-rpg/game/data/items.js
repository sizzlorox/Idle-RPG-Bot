const items = {
  rarity: [
    crack = {
      name: 'Cracked',
      power: 0.25,
      gold: 1,
      rarity: 100
    },
    crude = {
      name: 'Crude',
      power: 0.5,
      gold: 1,
      rarity: 75
    },
    battered = {
      name: 'Battered',
      power: 0.75,
      gold: 1,
      rarity: 75
    },
    common = {
      name: 'Common',
      power: 1,
      gold: 2,
      rarity: 100
    },
    uncommon = {
      name: 'Uncommon',
      power: 1.25,
      gold: 3,
      rarity: 50
    },
    sturdy = {
      name: 'Sturdy',
      power: 1.5,
      gold: 4,
      rarity: 40
    },
    reinforced = {
      name: 'Reinforced',
      power: 1.75,
      gold: 4,
      rarity: 30
    },
    unique = {
      name: 'Unique',
      power: 2,
      gold: 5,
      rarity: 25
    },
    hardened = {
      name: 'Hardened',
      power: 2.25,
      gold: 6,
      rarity: 20
    },
    rare = {
      name: 'Rare',
      power: 2.5,
      gold: 7,
      rarity: 15
    },
    magic = {
      name: 'Magic',
      power: 2.75,
      gold: 10,
      rarity: 10
    },
    legendary = {
      name: 'Legendary',
      power: 3,
      gold: 15,
      rarity: 5
    },
    mythical = {
      name: 'Mythical',
      power: 3.25,
      gold: 20,
      rarity: 3
    },
    ancient = {
      name: 'Ancient',
      power: 3.5,
      gold: 25,
      rarity: 2,
    },
    godly = {
      name: 'Godly',
      power: 3.75,
      gold: 30,
      rarity: 1
    }
  ],

  material: [
    wood = {
      name: 'Wooden',
      power: 0.25,
      gold: 5,
      rarity: 100
    },
    stone = {
      name: 'Stone',
      power: 0.5,
      gold: 5,
      rarity: 100
    },
    copper = {
      name: 'Copper',
      power: 0.75,
      gold: 8,
      rarity: 90
    },
    iron = {
      name: 'Iron',
      power: 1,
      gold: 10,
      rarity: 70
    },
    bronze = {
      name: 'Bronze',
      power: 1.25,
      gold: 13,
      rarity: 50
    },
    gold = {
      name: 'Gold',
      stats: {
        str: 1.5,
        dex: 0,
        end: 0,
        int: 4
      },
      gold: 15,
      rarity: 20
    },
    bone = {
      name: 'Bone',
      power: 1.75,
      gold: 15,
      rarity: 40
    },
    steel = {
      name: 'Steel',
      power: 2,
      gold: 15,
      rarity: 30
    },
    diamond = {
      name: 'Diamond',
      power: 2.25,
      gold: 22,
      rarity: 10
    },
    mithril = {
      name: 'Mithril',
      power: 2.5,
      gold: 25,
      rarity: 5
    },
    adamant = {
      name: 'Adamantine',
      power: 2.75,
      gold: 30,
      rarity: 3
    },
  ],

  type: [
    helmet = [
      helm = {
        name: 'Helm',
        position: 'helmet',
        power: 0.25,
        gold: 1
      },
      hornedHelmet = {
        name: 'Horned Helmet',
        position: 'helmet',
        power: 0.5,
        gold: 2
      },
      greatHelmet = {
        name: 'Great Helmet',
        position: 'helmet',
        power: 0.75,
        gold: 3
      },
      spikedHelmet = {
        name: 'Spiked Helmet',
        position: 'helmet',
        power: 1,
        gold: 3
      },
      minerHelmet = {
        name: 'Miners Helmet',
        position: 'helmet',
        power: 1.25,
        gold: 3
      },
      kettleHelm = {
        name: 'Kettle Helm',
        position: 'helmet',
        power: 1.5,
        gold: 3
      },
      chainHood = {
        name: 'Chainmail Hood',
        position: 'helmet',
        power: 1.75,
        gold: 3
      },
      basinet = {
        name: 'Basinet',
        position: 'helmet',
        power: 2,
        gold: 3
      },
      bucketHelm = {
        name: 'Bucket Helm',
        position: 'helmet',
        power: 2.25,
        gold: 3
      },
      nasalHelmet = {
        name: 'Nasal Helmet',
        position: 'helmet',
        power: 2.5,
        gold: 3
      },
      bucket = {
        name: 'Bucket',
        position: 'helmet',
        power: 1,
        gold: 3
      },
    ],

    weapon = [
      club = {
        name: 'Club',
        position: 'weapon',
        attackType: 'melee',
        power: 1,
        gold: 1
      },
      mace = {
        name: 'Mace',
        position: 'weapon',
        attackType: 'melee',
        power: 1,
        gold: 2
      },
      staff = {
        name: 'Staff',
        position: 'weapon',
        attackType: 'magic',
        power: 1,
        gold: 2
      },
      sword = {
        name: 'Sword',
        position: 'weapon',
        attackType: 'melee',
        power: 1,
        gold: 2
      },
      claymore = {
        name: 'Claymore',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 2
      },
      flail = {
        name: 'Flail',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 2
      },
      wand = {
        name: 'Wand',
        position: 'weapon',
        attackType: 'magic',
        power: 2,
        gold: 2
      },
      bow = {
        name: 'Bow',
        position: 'weapon',
        attackType: 'range',
        power: 1,
        gold: 2
      },
      crossbow = {
        name: 'Crossbow',
        position: 'weapon',
        attackType: 'range',
        power: 2,
        gold: 2
      },
      pike = {
        name: 'Pike',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 3
      },
      halberd = {
        name: 'Halberd',
        position: 'weapon',
        attackType: 'melee',
        power: 3,
        gold: 4
      },
      axe = {
        name: 'Axe',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 4
      },
      maul = {
        name: 'Maul',
        position: 'weapon',
        attackType: 'melee',
        power: 3,
        gold: 5
      },
      scythe = {
        name: 'Scythe',
        position: 'weapon',
        attackType: 'melee',
        power: 4,
        gold: 5
      },
      falchion = {
        name: 'Falchion',
        position: 'weapon',
        attackType: 'melee',
        power: 3,
        gold: 5
      },
      katana = {
        name: 'Katana',
        position: 'weapon',
        attackType: 'melee',
        power: 4,
        gold: 5
      },
      ulfberht = {
        name: 'Ulfberht',
        position: 'weapon',
        attackType: 'melee',
        power: 3,
        gold: 5
      },
      morningStar = {
        name: 'Morning star',
        position: 'weapon',
        attackType: 'melee',
        power: 3,
        gold: 5
      },
      glaive = {
        name: 'Glaive',
        position: 'weapon',
        attackType: 'melee',
        power: 4,
        gold: 5
      },
      sling = {
        name: 'Sling',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      chakram = {
        name: 'Chakram',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      shuriken = {
        name: 'Shuriken',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      spear = {
        name: 'Spear',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      dagger = {
        name: 'Dagger',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      whip = {
        name: 'Tipped Whip',
        position: 'weapon',
        attackType: 'melee',
        power: 2,
        gold: 5
      },
      wizardStaff = {
        name: 'Wizard Staff',
        position: 'weapon',
        attackType: 'magic',
        power: 2,
        gold: 5
      },
    ],

    armor = [
      chainMail = {
        name: 'Chain Mail',
        position: 'armor',
        power: 0.25,
        gold: 1,
        rarity: 80
      },
      thinBody = {
        name: 'Cheap Plate Armour',
        position: 'armor',
        power: 0.5,
        gold: 2,
        rarity: 50
      },
      fullBody = {
        name: 'Highend Plate Armor',
        position: 'armor',
        power: 0.75,
        gold: 3,
        rarity: 25
      },
      scale = {
        name: 'Scale Armor',
        position: 'armor',
        power: 1,
        gold: 3,
        rarity: 30
      },
      studded = {
        name: 'Studded Armor',
        position: 'armor',
        power: 1.25,
        gold: 3,
        rarity: 60
      },
      segmented = {
        name: 'Segmented Armor',
        position: 'armor',
        power: 1.5,
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
    ],

    inventory = [
      potion = {
        name: 'Health Potion',
        position: 'inventory',
        power: 0.25,
        gold: 15,
        rarity: 75
      }
    ]
  ]
};
module.exports = items;
