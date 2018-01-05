const mongoose = require('mongoose');
const mapSchema = require('./map');
const maps = require('../../game/data/maps');
const moment = require('moment');
const { starterTown } = require('../../../settings');

const newPlayerObj = (discordId, name) => {
  return {
    discordId,
    name,
    health: 105,
    experience: 0,
    map: maps[starterTown],
    level: 1,
    gold: 0,
    isMentionInDiscord: true,
    gender: 'neutral',
    equipment: {
      helmet: {
        name: 'Nothing',
        power: 0.15,
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        power: 0.15,
        previousOwners: []
      },
      weapon: {
        name: 'Fist',
        power: 0.15,
        attackType: 'melee',
        previousOwners: []
      },
      relic: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0,
        luk: 0,
        previousOwners: []
      }
    },
    inventory: {
      equipment: [],
      items: []
    },
    stats: {
      str: 1,
      dex: 1,
      end: 1,
      int: 1,
      luk: 1
    },
    spells: [],
    isOnline: true,
    createdAt: moment().toISOString(),
    events: 0,
    gambles: 0,
    stole: 0,
    stolen: 0,
    spellCasted: 0,
    kills: {
      mob: 0,
      player: 0
    },
    battles: {
      won: 0,
      lost: 0
    },
    deaths: {
      mob: 0,
      player: 0
    },
    pastEvents: []
  };
};

const playerSchema = mongoose.Schema({
  discordId: String,
  name: String,
  health: Number,
  experience: Number,
  map: mapSchema,
  level: Number,
  gold: Number,
  isMentionInDiscord: {
    type: Boolean,
    default: true
  },
  gender: {
    type: String,
    default: 'neutral'
  },
  equipment: {
    helmet: {
      name: String,
      power: Number,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    armor: {
      name: String,
      power: Number,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    weapon: {
      name: String,
      power: Number,
      attackType: String,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    relic: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number,
      previousOwners: {
        type: Array,
        default: []
      }
    }
  },
  inventory: {
    equipment: {
      type: Array,
      default: []
    },
    items: {
      type: Array,
      default: []
    }
  },
  stats: {
    str: Number,
    dex: Number,
    end: Number,
    int: Number,
    luk: Number
  },
  spells: {
    type: Array,
    default: []
  },
  isOnline: Boolean,
  createdAt: Date,
  events: Number,
  gambles: {
    type: Number,
    default: 0
  },
  stole: {
    type: Number,
    default: 0
  },
  stolen: {
    type: Number,
    default: 0
  },
  spellCasted: {
    type: Number,
    default: 0
  },
  kills: {
    mob: Number,
    player: Number
  },
  battles: {
    won: {
      type: Number,
      default: 0
    },
    lost: {
      type: Number,
      default: 0
    }
  },
  deaths: {
    mob: Number,
    player: Number
  },
  pastEvents: {
    type: Array,
    default: []
  }
});

playerSchema.set('autoIndex', false);

module.exports = { playerSchema, newPlayerObj };
