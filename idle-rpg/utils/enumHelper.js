const enumHelper = {
  map: {
    types: {
      town: 'Town'
    }
  },

  inventory: {
    maxEquipmentAmount: 5,
    maxItemAmount: 15,
    name: 'Inventory',
    position: 'inventory'
  },

  equipment: {
    empty: {
      helmet: {
        name: 'Nothing',
        power: 0.25,
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        power: 0.25,
        previousOwners: []
      },
      weapon: {
        name: 'Fist',
        power: 0.25,
        attackType: 'melee',
        previousOwners: []
      },
      relic: {
        name: 'Nothing',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
          luk: 0
        },
        previousOwners: []
      }
    },
    types: {
      helmet: {
        name: 'Helmet',
        position: 'helmet'
      },
      armor: {
        name: 'Armor',
        position: 'armor'
      },
      weapon: {
        name: 'Weapon',
        position: 'weapon'
      },
      relic: {
        name: 'Relic',
        position: 'relic'
      }
    }
  },

  stats: {
    str: 'Strength',
    dex: 'Dexterity',
    end: 'Endurance',
    int: 'Intelligence',
    luk: 'Luck'
  },

  mockPlayers: [{
    name: 'LoneTester',
    discordId: 'LoneTester'
  },
  {
    name: 'LoneTester01',
    discordId: 'LoneTester01'
  }],

  // source cited: https://en.wiktionary.org/wiki/Appendix:English_third-person_singular_pronouns
  genders: {
    male: {
      he: 'he',
      his: 'his',
      him: 'him',
      himself: 'himself',
    },
    female: {
      he: 'she',
      his: 'her',
      him: 'her',
      himself: 'herself',
    },
    neutral: {
      he: 'they',
      his: 'their',
      him: 'them',
      himself: 'themself',
    },
    neuter: {
      he: 'it',
      his: 'its',
      him: 'it',
      himself: 'itself',
    }
  },

  statsSelectFields: {
    name: 1,
    health: 1,
    level: 1,
    experience: 1,
    gender: 1,
    events: 1,
    gold: 1,
    equipment: 1,
    map: 1,
    currentBounty: 1,
    stats: 1,
    createdAt: 1,
    pastEvents: 1,
    gambles: 1,
    stole: 1,
    stolen: 1,
    spells: 1,
    kills: 1,
    battles: 1,
    deaths: 1
  },

  equipSelectFields: {
    name: 1,
    equipment: 1
  }
};
module.exports = enumHelper;