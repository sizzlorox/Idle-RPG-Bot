const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
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
  dailyLottery: {
    prizePool: {
      type: Number,
      default: 1500
    }
  }
});
module.exports = gameSchema;
