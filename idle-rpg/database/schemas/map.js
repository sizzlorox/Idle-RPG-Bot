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
  biome: {
    id: Number,
    name: String
  },
  levelReq: Number,
  lore: String,
  previousLocation: {
    type: String,
    default: ''
  }
});

mapSchema.set('autoIndex', false);

module.exports = mapSchema;
