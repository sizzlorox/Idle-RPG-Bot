const mongoose = require('mongoose');

const mapSchema = mongoose.Schema({
  id: Number,
  name: String,
  type: {
    id: Number,
    name: String
  },
  levelReq: Number
});
module.exports = mapSchema;
