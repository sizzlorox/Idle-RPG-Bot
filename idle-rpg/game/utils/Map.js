const maps = require('../data/maps');

class Map {

  constructor(Helper) {
    this.Helper = Helper;
  }

  moveToRandomMap(selectedPlayer) {
    const movement = this.Helper.randomBetween(0, 3);
    const mapSize = maps[maps.length - 1].coords;
    const newCoords = selectedPlayer.map.coords;

    switch (movement) {
      case 0:
        // UP - Move down if at edge
        if (selectedPlayer.map.coords[1] === 0) {
          newCoords[1]++;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'South'
          };
        }

        newCoords[1]--;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'North'
        };

      case 1:
        // Down - Move up if at edge
        if (selectedPlayer.map.coords[1] === mapSize[1]) {
          newCoords[1]--;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'North'
          };
        }

        newCoords[1]++;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'South'
        };

      case 2:
        // Right - Move left if at edge
        if (selectedPlayer.map.coords[0] === mapSize[0]) {
          newCoords[0]--;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'West'
          };
        }

        newCoords[0]++;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'East'
        };

      case 3:
        // Left - Move right if at edge
        if (selectedPlayer.map.coords[0] === 0) {
          newCoords[0]++;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'East'
          };
        }

        newCoords[0]--;
        return {
          map: this.getMapByCoords(newCoords),
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

  getRandomTown() {
    const towns = maps.filter(area => area.type.name === 'Town');
    return towns[this.Helper.randomBetween(0, towns.length - 1)];
  }

  getMapByName(name) {
    return maps.find(map => map.name === name);
  }

  getMapsByType(type) {
    return maps.filter(area => area.biome === type).map(area => area.name);
  }

}
module.exports = Map;
