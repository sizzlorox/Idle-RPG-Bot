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
        power: 0.5,
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        power: 0.5,
        previousOwners: []
      },
      weapon: {
        name: 'Fists',
        power: 0.5,
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
    name: 'Testing1',
    discordId: 'Testing1'
  },
  {
    name: 'Testing2',
    discordId: 'Testing2'
  },
  {
    name: 'Testing3',
    discordId: 'Testing3'
  },
  {
    name: 'Testing4',
    discordId: 'Testing4'
  },
  {
    name: 'Testing5',
    discordId: 'Testing5'
  },
  {
    name: 'Testing6',
    discordId: 'Testing6'
  },
  {
    name: 'Testing7',
    discordId: 'Testing7'
  },
  {
    name: 'Testing8',
    discordId: 'Testing8'
  },
  {
    name: 'Testing9',
    discordId: 'Testing9'
  },
  {
    name: 'Testing10',
    discordId: 'Testing10'
  }]
};
module.exports = enumHelper;