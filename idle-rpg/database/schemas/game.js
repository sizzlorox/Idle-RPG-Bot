const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
  guildId: {
    type: String,
    default: 'None'
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
