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
    name: 'pewpewpew1',
    discordId: 'pewpewpew1'
  },
  {
    name: 'pewpewpew2',
    discordId: 'pewpewpew2'
  },
  {
    name: 'pewpewpew3',
    discordId: 'pewpewpew3'
  },
  {
    name: 'pewpewpew4',
    discordId: 'pewpewpew4'
  },
  {
    name: 'pewpewpew5',
    discordId: 'pewpewpew5'
  },
  {
    name: 'pewpewpew6',
    discordId: 'pewpewpew6'
  },
  {
    name: 'pewpewpew7',
    discordId: 'pewpewpew7'
  },
  {
    name: 'pewpewpew8',
    discordId: 'pewpewpew8'
  },
  {
    name: 'pewpewpew9',
    discordId: 'pewpewpew9'
  },
  {
    name: 'PEWWWW',
    discordId: 'PEWWWW'
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