const maps = require('../data/maps');
const Helper = require('../../utils/Helper');

class Map {

  moveToRandomMap(selectedPlayer) {
    const movement = Helper.randomBetween(0, 100);
    if (movement > 50 && selectedPlayer.map.id !== 0 && selectedPlayer.map.id !== maps.length - 1 || selectedPlayer.map.id === 0) {
      return maps[selectedPlayer.map.id + 1];
    }
    return maps[selectedPlayer.map.id - 1];
  }

  getMapByIndex(index) {
    return maps[index];
  }

  getTowns() {
    return maps.filter(area => area.type.name === 'Town').map(area => area.name);
  }

  getMapByName(name) {
    return maps.find(map => map.name === name);
  }

  getMapsByType(type) {
    return maps.filter(area => area.type.name === type).map(area => area.name);
  }

}
module.exports = Map;
