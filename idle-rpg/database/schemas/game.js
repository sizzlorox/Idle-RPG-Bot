const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
  guildId: {
    type: String,
    index: {
      unique: true,
      dropDups: true,
    },
  },
  commandPrefix: {
    type: String,
    default: '!',
  },
  multiplier: {
    type: Number,
    default: 1,
  },
  spells: {
    bless: {
      type: [
        {
          castBy: String,
          count: Number,
          guildId: String,
          expiresAt: Number,
        },
      ],
      default: [],
    },
  },
  events: {
    blizzard: {
      isActive: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Number,
        default: 0,
      },
    },
    powerHour: {
      isActive: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Number,
        default: 0,
      },
    },

    // TODO: Refactor to follow blizzard
    isInvasionActive: {
      type: Boolean,
      default: false,
    },
    invasionMobType: {
      type: String,
      default: '',
    },
    isBloodMoonActive: {
      type: Boolean,
      default: false,
    },
    weather: {
      biome: { type: String, default: '' },
      type: { type: String, default: '' },
    },
  },
  dailyLottery: {
    prizePool: {
      type: Number,
      default: 1500,
    },
  },
});

gameSchema.set('autoIndex', false);

module.exports = gameSchema;
