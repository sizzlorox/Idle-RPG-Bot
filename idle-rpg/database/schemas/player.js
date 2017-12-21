const mongoose = require('mongoose');
const mapSchema = require('./map');
const Map = require('../../game/utils/Map');
const moment = require('moment');
const { starterTown } = require('../../../settings');

const newPlayerObj = (discordId, name) => {
  return {
    discordId,
    name,
    health: 105,
    experience: 0,
    map: Map.getMapByIndex(starterTown),
    level: 1,
    gold: 0,
    isMentionInDiscord: true,
    equipment: {
      helmet: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0,
        previousOwners: []
      },
      armor: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0,
        previousOwners: []
      },
      weapon: {
        name: 'Fist',
        str: 1,
        dex: 1,
        end: 1,
        int: 0,
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
    stats: {
      str: 1,
      dex: 1,
      end: 1,
      int: 1,
      luk: 1
    },
    isOnline: true,
    createdAt: moment().toISOString(),
    events: 0,
    gambles: 0,
    stole: 0,
    stolen: 0,
    spells: 0,
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
  isMentionInDiscord: Boolean,
  equipment: {
    helmet: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    armor: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    weapon: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
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
  stats: {
    str: Number,
    dex: Number,
    end: Number,
    int: Number,
    luk: Number
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
  spells: {
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
