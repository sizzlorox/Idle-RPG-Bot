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

  maxHealth: (level) => {
    return 100 + (level * 5);
  },

  maxMana: (level) => {
    return 50 + (level * 5);
  },

  equipment: {
    starter: {
      weapon: {
        name: 'Training Sword',
        power: 0.75,
        position: 'weapon',
        attackType: 'melee',
        previousOwners: []
      },
      armor: {
        name: 'Linen Shirt',
        power: 0.75,
        position: 'armor',
        previousOwners: []
      }
    },
    empty: {
      helmet: {
        name: 'Nothing',
        power: 0.15,
        position: 'helmet',
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        power: 0.15,
        position: 'armor',
        previousOwners: []
      },
      weapon: {
        name: 'Fist',
        power: 0.15,
        position: 'weapon',
        attackType: 'melee',
        previousOwners: []
      },
      relic: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0,
        luk: 0,
        position: 'relic',
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

  roamingNpcs: [
    pyddur = {
      name: 'Pyddur, God of Beer',
      discordId: 'pyddur'
    }
  ],

  mockPlayers: [{
    name: 'plisbebalanced01',
    discordId: 'plisbebalanced01'
  },
  {
    name: 'plisbebalanced02',
    discordId: 'plisbebalanced02'
  },
  {
    name: 'plisbebalanced03',
    discordId: 'plisbebalanced03'
  },
  {
    name: 'plisbebalanced04',
    discordId: 'plisbebalanced04'
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

  inventorySelectFields: {
    name: 1,
    inventory: 1
  },

  playerEventLogSelectFields: {
    name: 1,
    pastEvents: 1
  },

  pvpLogSelectFields: {
    name: 1,
    stole: 1,
    stolen: 1,
    kills: 1,
    battles: 1,
    pastPvpEvents: 1
  },

  statsSelectFields: {
    name: 1,
    health: 1,
    class: 1,
    mana: 1,
    level: 1,
    experience: 1,
    gender: 1,
    events: 1,
    gold: 1,
    horse:1,
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
    deaths: 1,
    spellCasted: 1
  },

  equipSelectFields: {
    name: 1,
    stats: 1,
    equipment: 1
  }
};
module.exports = enumHelper;