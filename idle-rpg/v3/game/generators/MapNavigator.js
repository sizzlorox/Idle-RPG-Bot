const maps = require('../../../game/data/maps');
const { randomBetween } = require('../../utils/helpers');

const mapSize = maps[maps.length - 1].coords;

class MapNavigator {

  constructor() {
    this.maps = maps;
    // Build lookup tables at startup — O(1) for all map queries at runtime
    this._coordMap = new Map(maps.map(m => [`${m.coords[0]},${m.coords[1]}`, m]));
    this._towns = maps.filter(area => area.type.name === 'Town');
    this._townNames = this._towns.map(area => area.name);
  }

  async moveToRandomMap(updatedPlayer) {
    const movement = randomBetween(0, 3);

    switch (movement) {
      case 0:
        if (updatedPlayer.map.coords[1] === 0) {
          return {
            map: this.getMapByCoords([updatedPlayer.map.coords[0], updatedPlayer.map.coords[1] + 1]),
            direction: 'South',
            previousLocation: updatedPlayer.map.name
          };
        }
        return {
          map: this.getMapByCoords([updatedPlayer.map.coords[0], updatedPlayer.map.coords[1] - 1]),
          direction: 'North',
          previousLocation: updatedPlayer.map.name
        };

      case 1:
        if (updatedPlayer.map.coords[1] === mapSize[1]) {
          return {
            map: this.getMapByCoords([updatedPlayer.map.coords[0], updatedPlayer.map.coords[1] - 1]),
            direction: 'North',
            previousLocation: updatedPlayer.map.name
          };
        }
        return {
          map: this.getMapByCoords([updatedPlayer.map.coords[0], updatedPlayer.map.coords[1] + 1]),
          direction: 'South',
          previousLocation: updatedPlayer.map.name
        };

      case 2:
        if (updatedPlayer.map.coords[0] === mapSize[0]) {
          return {
            map: this.getMapByCoords([updatedPlayer.map.coords[0] - 1, updatedPlayer.map.coords[1]]),
            direction: 'West',
            previousLocation: updatedPlayer.map.name
          };
        }
        return {
          map: this.getMapByCoords([updatedPlayer.map.coords[0] + 1, updatedPlayer.map.coords[1]]),
          direction: 'East',
          previousLocation: updatedPlayer.map.name
        };

      case 3:
        if (updatedPlayer.map.coords[0] === 0) {
          return {
            map: this.getMapByCoords([updatedPlayer.map.coords[0] + 1, updatedPlayer.map.coords[1]]),
            direction: 'East',
            previousLocation: updatedPlayer.map.name
          };
        }
        return {
          map: this.getMapByCoords([updatedPlayer.map.coords[0] - 1, updatedPlayer.map.coords[1]]),
          direction: 'West',
          previousLocation: updatedPlayer.map.name
        };
    }
  }

  getMapByCoords(coords) {
    return this._coordMap.get(`${coords[0]},${coords[1]}`);
  }

  getMapByIndex(index) {
    return this.maps[index];
  }

  getTowns() {
    return this._townNames;
  }

  getRandomTown() {
    return this._towns[randomBetween(0, this._towns.length - 1)];
  }

  getMapByName(name) {
    return this.maps.find(map => map.name === name);
  }

  getMapsByType(type) {
    return this.maps.filter(area => area.biome === type).map(area => area.name);
  }

}

module.exports = MapNavigator;
