const maps = require('../data/maps');
const Helper = require('../../utils/Helper');

class Map {

  moveToRandomMap(selectedPlayer) {
    const movement = Helper.randomBetween(0, 3);
    const mapSize = maps[maps.length - 1].coords;

    switch (movement) {
      case 0:
        // UP - Move down if at edge
        if (selectedPlayer.map.coords[1] === 0) {
          selectedPlayer.map.coords[1]++;
          return {
            map: this.getMapByCoords(selectedPlayer.map.coords),
            direction: 'South'
          };
        }

        selectedPlayer.map.coords[1]--;
        return {
          map: this.getMapByCoords(selectedPlayer.map.coords),
          direction: 'North'
        };

      case 1:
        // Down - Move up if at edge
        if (selectedPlayer.map.coords[1] === mapSize[1]) {
          selectedPlayer.map.coords[1]--;
          return {
            map: this.getMapByCoords(selectedPlayer.map.coords),
            direction: 'North'
          };
        }

        selectedPlayer.map.coords[1]++;
        return {
          map: this.getMapByCoords(selectedPlayer.map.coords),
          direction: 'South'
        };

      case 2:
        // Right - Move left if at edge
        if (selectedPlayer.map.coords[0] === mapSize[0]) {
          selectedPlayer.map.coords[1]--;
          return {
            map: this.getMapByCoords(selectedPlayer.map.coords),
            direction: 'West'
          };
        }

        selectedPlayer.map.coords[0]++;
        return {
          map: this.getMapByCoords(selectedPlayer.map.coords),
          direction: 'East'
        };

      case 3:
        // Left - Move right if at edge
        if (selectedPlayer.map.coords[0] === 0) {
          selectedPlayer.map.coords[1]++;
          return {
            map: this.getMapByCoords(selectedPlayer.map.coords),
            direction: 'East'
          };
        }

        selectedPlayer.map.coords[0]--;
        return {
          map: this.getMapByCoords(selectedPlayer.map.coords),
          direction: 'West'
        };
    }
  }

  getMapByCoords(coords) {
    return maps.find(map => map.coords[0] === coords[0] && map.coords[1] === coords[1]);
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
