const maps = require('../data/maps');
const BaseHelper = require('../../v2/Base/Helper');

const mapSize = maps[maps.length - 1].coords;

class Map extends BaseHelper {

  async moveToRandomMap(updatedPlayer) {
    const movement = this.randomBetween(0, 3);

    switch (movement) {
      case 0:
        if (updatedPlayer.map.coords[1] === 0) {
          return {
            map: this.getMapByCoords([
              updatedPlayer.map.coords[0],
              updatedPlayer.map.coords[1] + 1
            ]),
            direction: 'South',
            previousLocation: updatedPlayer.map.name
          };
        }

        return {
          map: this.getMapByCoords([
            updatedPlayer.map.coords[0],
            updatedPlayer.map.coords[1] - 1
          ]),
          direction: 'North',
          previousLocation: updatedPlayer.map.name
        };

      case 1:
        if (updatedPlayer.map.coords[1] === mapSize[1]) {
          return {
            map: this.getMapByCoords([
              updatedPlayer.map.coords[0],
              updatedPlayer.map.coords[1] - 1
            ]),
            direction: 'North',
            previousLocation: updatedPlayer.map.name
          };
        }

        return {
          map: this.getMapByCoords([
            updatedPlayer.map.coords[0],
            updatedPlayer.map.coords[1] + 1
          ]),
          direction: 'South',
          previousLocation: updatedPlayer.map.name
        };

      case 2:
        if (updatedPlayer.map.coords[0] === mapSize[0]) {
          return {
            map: this.getMapByCoords([
              updatedPlayer.map.coords[0] - 1,
              updatedPlayer.map.coords[1]
            ]),
            direction: 'West',
            previousLocation: updatedPlayer.map.name
          };
        }

        return {
          map: this.getMapByCoords([
            updatedPlayer.map.coords[0] + 1,
            updatedPlayer.map.coords[1]
          ]),
          direction: 'East',
          previousLocation: updatedPlayer.map.name
        };

      case 3:
        if (updatedPlayer.map.coords[0] === 0) {
          return {
            map: this.getMapByCoords([
              updatedPlayer.map.coords[0] + 1,
              updatedPlayer.map.coords[1]
            ]),
            direction: 'East',
            previousLocation: updatedPlayer.map.name
          };
        }

        return {
          map: this.getMapByCoords([
            updatedPlayer.map.coords[0] - 1,
            updatedPlayer.map.coords[1]
          ]),
          direction: 'West',
          previousLocation: updatedPlayer.map.name
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
    return towns[this.randomBetween(0, towns.length - 1)];
  }

  getMapByName(name) {
    return maps.find(map => map.name === name);
  }

  getMapsByType(type) {
    return maps.filter(area => area.biome === type).map(area => area.name);
  }

}
module.exports = Map;
