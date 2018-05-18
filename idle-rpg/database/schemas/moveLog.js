const mongoose = require('mongoose');

const moveLog = mongoose.Schema({
  playerId: String,
  type: {
    type: String,
    default: 'MOVE'
  },
  log: {
    type: Array,
    default: []
  }
});

moveLog.set('autoIndex', false);

module.exports = moveLog;
