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
    name: 'Testa1',
    discordId: 'Testa1'
  },
  {
    name: 'Testa2',
    discordId: 'Testa2'
  },
  {
    name: 'Testa3',
    discordId: 'Testa3'
  },
  {
    name: 'Testa4',
    discordId: 'Testa4'
  },
  {
    name: 'Testa5',
    discordId: 'Testa5'
  },
  {
    name: 'Testa6',
    discordId: 'Testa6'
  },
  {
    name: 'Testa7',
    discordId: 'Testa7'
  },
  {
    name: 'Testa8',
    discordId: 'Testa8'
  },
  {
    name: 'Testa9',
    discordId: 'Testa9'
  },
  {
    name: 'Testa10',
    discordId: 'Testa10'
  }]
};
module.exports = enumHelper;