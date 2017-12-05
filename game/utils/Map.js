const maps = require('../data/maps');

class Map {
  moveToRandomMap(selectedPlayer) {
    const movement = Math.random();
    if (movement >= 0.5 && selectedPlayer.map.id !== 0 && selectedPlayer.map.id !== maps.length - 1) {
      return maps[selectedPlayer.map.id + 1];
    }
    return maps[selectedPlayer.map.id - 1];
  }

  getMapByIndex(index) {
    return maps[index];
  }
}
module.exports = new Map();
