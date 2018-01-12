const enumHelper = {
  map: {
    types: {
      town: 'Town'
    }
  },

  inventory: {
    maxEquipmentAmount: 5,
    maxItemAmount: 15
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
    name: 'testeeeee1',
    discordId: 'testeeeee1'
  },
  {
    name: 'testeeeee2',
    discordId: 'testeeeee2'
  },
  {
    name: 'testeeeee3',
    discordId: 'testeeeee3'
  },
  {
    name: 'testeeeee4',
    discordId: 'testeeeee4'
  },
  {
    name: 'testeeeee5',
    discordId: 'testeeeee5'
  },
  {
    name: 'testeeeee6',
    discordId: 'testeeeee6'
  },
  {
    name: 'testeeeee7',
    discordId: 'testeeeee7'
  },
  {
    name: 'testeeeee8',
    discordId: 'testeeeee8'
  },
  {
    name: 'testeeeee9',
    discordId: 'testeeeee9'
  },
  {
    name: 'Tester 10',
    discordId: 'Tester 10'
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