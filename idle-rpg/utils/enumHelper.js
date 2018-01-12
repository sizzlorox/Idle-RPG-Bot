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
    name: 'Victim_1',
    discordId: 'Victim_1'
  },
  {
    name: 'Victim_2',
    discordId: 'Victim_2'
  },
  {
    name: 'Victim_3',
    discordId: 'Victim_3'
  },
  {
    name: 'Victim_4',
    discordId: 'Victim_4'
  },
  {
    name: 'Victim_5',
    discordId: 'Victim_5'
  },
  {
    name: 'Victim_6',
    discordId: 'Victim_6'
  },
  {
    name: 'Victim_7',
    discordId: 'Victim_7'
  },
  {
    name: 'Victim_8',
    discordId: 'Victim_8'
  },
  {
    name: 'Victim_9',
    discordId: 'Victim_9'
  },
  {
    name: 'Victiem_10',
    discordId: 'Victiem_10'
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
  }
};
module.exports = enumHelper;