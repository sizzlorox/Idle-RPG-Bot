const mongoose = require('mongoose');

const questLog = mongoose.Schema({
  playerId: String,
  log: {
    type: Array,
    default: []
  }
});

questLog.set('autoIndex', false);

module.exports = questLog;
