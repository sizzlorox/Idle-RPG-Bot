const mongoose = require('mongoose');

const mapSchema = mongoose.Schema({
  id: Number,
  coords: Array,
  image: String,
  name: String,
  type: {
    id: Number,
    name: String,
  },
  levelReq: Number,
  lore: String
});
module.exports = mapSchema;
