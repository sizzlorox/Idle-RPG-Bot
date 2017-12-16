const enumHelper = {
  map: {
    types: {
      town: 'Town'
    }
  },

  equipment: {
    empty: {
      equip: {
        name: 'Nothing',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
          previousOwners: []
        },
      },
      relic: {
        name: 'Nothing',
        stats: {
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
          luk: 0,
          previousOwners: []
        }
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
  }
};
module.exports = enumHelper;