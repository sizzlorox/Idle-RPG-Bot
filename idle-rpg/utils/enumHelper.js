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
    name: 'castspells1',
    discordId: 'castspells1'
  },
  {
    name: 'castspells2',
    discordId: 'castspells2'
  },
  {
    name: 'castspells3',
    discordId: 'castspells3'
  },
  {
    name: 'castspells4',
    discordId: 'castspells4'
  },
  {
    name: 'castspells5',
    discordId: 'castspells5'
  },
  {
    name: 'castspells6',
    discordId: 'castspells6'
  },
  {
    name: 'castspells7',
    discordId: 'castspells7'
  },
  {
    name: 'castspells8',
    discordId: 'castspells8'
  },
  {
    name: 'castspells9',
    discordId: 'castspells9'
  },
  {
    name: 'castspells10',
    discordId: 'castspells10'
  }]
};
module.exports = enumHelper;