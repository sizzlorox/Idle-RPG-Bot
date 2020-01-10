const mongoose = require('mongoose');

const pvpLog = mongoose.Schema({
  playerId: String,
  type: {
    type: String,
    default: 'PVP'
  },
  log: {
    type: Array,
    default: []
  }
});

pvpLog.set('autoIndex', false);

module.exports = pvpLog;
