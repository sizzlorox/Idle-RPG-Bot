const maps = require('../data/maps');

class Map {
  moveToRandomMap(selectedPlayer) {
    const movement = Math.random();
    if (movement >= 0.5 && selectedPlayer.map.id !== 0 || selectedPlayer.map.id === maps.length - 1) {
      return maps[selectedPlayer.map.id + 1];
    }
    return maps[selectedPlayer.map.id - 1];
  }

  getMapByIndex(index) {
    return maps[index];
  }

  getMapByName(name) {
    let map = '';
    for (let i = 0; i < maps.length; i++) {
      if (maps[i].name === name) {
        map = maps[i];
      }
    }
    delete map.id;
    delete map.mobs;
    delete map.levelReq;
    return map;
  }
}
module.exports = new Map();
