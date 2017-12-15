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
    equipment: {
      helmet: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0
      },
      armor: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0
      },
      weapon: {
        name: 'Fist',
        str: 1,
        dex: 1,
        end: 1,
        int: 0
      },
      relic: {
        name: 'Nothing',
        str: 0,
        dex: 0,
        end: 0,
        int: 0,
        luk: 0
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
    kills: {
      mob: 0,
      player: 0
    },
    deaths: {
      mob: 0,
      player: 0
    }
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
  equipment: {
    helmet: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number
    },
    armor: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number
    },
    weapon: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number
    },
    relic: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number
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
  kills: {
    mob: Number,
    player: Number
  },
  deaths: {
    mob: Number,
    player: Number
  }
});

playerSchema.set('autoIndex', false);

module.exports = { playerSchema, newPlayerObj };
