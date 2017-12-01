const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  id: Number,
  discordId: Number,
  name:  String,
  health: Number,
  experience: Number,
  map: Number,
  level: Number,
  equipment: {
    helmet: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number
    },
    armor: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number
    },
    leftHand: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number
    },
    rightHand: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number
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
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date, 
    default: Date.now
  },
});
module.exports.playerSchema = playerSchema;