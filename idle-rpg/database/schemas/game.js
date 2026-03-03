const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
  guildId: {
    type: String,
    index: {
      unique: true,
      dropDups: true
    }
  },
  commandPrefix: {
    type: String,
    default: '!'
  },
  multiplier: {
    type: Number,
    default: 1
  },
  spells: {
    activeBless: {
      type: Number,
      default: 0
    }
  },
  events: {
    isBlizzardActive: {
      type: Boolean,
      default: false
    },
    isInvasionActive: {
      type: Boolean,
      default: false
    },
    invasionMobType: {
      type: String,
      default: ''
    },
    isBloodMoonActive: {
      type: Boolean,
      default: false
    },
    weather: {
      biome: { type: String, default: '' },
      type: { type: String, default: '' }
    }
  },
  dailyLottery: {
    prizePool: {
      type: Number,
      default: 1500
    }
  }
});

gameSchema.set('autoIndex', false);

module.exports = gameSchema;
