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
    name: 'Tester 1',
    discordId: 'Tester 1'
  },
  {
    name: 'Tester 2',
    discordId: 'Tester 2'
  },
  {
    name: 'Tester 3',
    discordId: 'Tester 3'
  },
  {
    name: 'Tester 4',
    discordId: 'Tester 4'
  },
  {
    name: 'Tester 5',
    discordId: 'Tester 5'
  },
  {
    name: 'Tester 6',
    discordId: 'Tester 6'
  },
  {
    name: 'Tester 7',
    discordId: 'Tester 7'
  },
  {
    name: 'Tester 8',
    discordId: 'Tester 8'
  },
  {
    name: 'Tester 9',
    discordId: 'Tester 9'
  },
  {
    name: 'Tester 10',
    discordId: 'Tester 10'
  }],

  genders = {
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
    },
    yo: {
      he: 'yo',
      his: 'yos',
      him: 'yo',
      himself: 'yoself',
    },
    elverson: {
      he: 'ey',
      his: 'eir',
      him: 'em',
      himself: 'emself',
    },
    spivak: {
      he: 'e',
      his: 'eir',
      him: 'em',
      himself: 'emself',
    },
    hir: {
      he: 'ze',
      his: 'hir',
      him: 'hir',
      himself: 'hirself',
    },
    per: {
      he: 'per',
      his: 'pers',
      him: 'per',
      himself: 'perself',
    },
    xe: {
      he: 'xe',
      his: 'xyr',
      him: 'xem',
      himself: 'xemself',
    },
    helicopter: {
      he: 'heli',
      his: 'helis',
      him: 'helim',
      himself: 'heliself',
    },
    ghost: {
      he: '',
      his: '',
      him: '',
      himself: '',
    }
  }
};
module.exports = enumHelper;