const enumHelper = {
  map: {
    types: {
      town: 'Town'
    }
  },

  equipment: {
    empty: {
      helmet: {
        name: 'Nothing',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
        },
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
        },
        previousOwners: []
      },
      weapon: {
        name: 'Fists',
        stats: {
          str: 1,
          dex: 1,
          end: 1,
          int: 0,
        },
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
    name: 'T1',
    discordId: 'T1'
  },
  {
    name: 'T2',
    discordId: 'T2'
  },
  {
    name: 'T3',
    discordId: 'T3'
  },
  {
    name: 'T4',
    discordId: 'T4'
  },
  {
    name: 'T5',
    discordId: 'T5'
  },
  {
    name: 'T6',
    discordId: 'T6'
  },
  {
    name: 'T7',
    discordId: 'T7'
  },
  {
    name: 'T8',
    discordId: 'T8'
  },
  {
    name: 'T9',
    discordId: 'T9'
  },
  {
    name: 'T10',
    discordId: 'T10'
  }]
};
module.exports = enumHelper;