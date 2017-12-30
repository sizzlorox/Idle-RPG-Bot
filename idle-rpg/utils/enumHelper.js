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
    name: 'hmmmmm1',
    discordId: 'hmmmmm1'
  },
  {
    name: 'hmmmmm2',
    discordId: 'hmmmmm2'
  },
  {
    name: 'hmmmmm3',
    discordId: 'hmmmmm3'
  },
  {
    name: 'hmmmmm4',
    discordId: 'hmmmmm4'
  },
  {
    name: 'hmmmmm5',
    discordId: 'hmmmmm5'
  },
  {
    name: 'hmmmmm6',
    discordId: 'hmmmmm6'
  },
  {
    name: 'hmmmmm7',
    discordId: 'hmmmmm7'
  },
  {
    name: 'hmmmmm8',
    discordId: 'hmmmmm8'
  },
  {
    name: 'hmmmmm9',
    discordId: 'hmmmmm9'
  },
  {
    name: 'hmmmmm10',
    discordId: 'hmmmmm10'
  }]
};
module.exports = enumHelper;