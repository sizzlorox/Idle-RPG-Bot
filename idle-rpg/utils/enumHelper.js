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
  },

  statsSelectFields: {
    name: 1,
    health: 1,
    level: 1,
    experience: 1,
    gender: 1,
    gold: 1,
    map: 1,
    currentBounty: 1,
    stats: 1,
    createdAt: 1,
    pastEvents: 1,
    gambles: 1,
    stole: 1,
    stolen: 1,
    spells: 1,
    kills: 1,
    battles: 1,
    deaths: 1
  },

  equipSelectFields: {
    name: 1,
    equipment: 1
  }
};
module.exports = enumHelper;