const mongoose = require('mongoose');

const actionLog = mongoose.Schema({
  playerId: String,
  type: {
    type: String,
    default: 'ACTION'
  },
  log: {
    type: Array,
    default: []
  }
});

actionLog.set('autoIndex', false);

module.exports = actionLog;
