const maps = require('../data/maps');

const mapSize = maps[maps.length - 1].coords;

class Map {

  constructor(Helper) {
    this.Helper = Helper;
  }

  moveToRandomMap(selectedPlayer) {
    const movement = this.Helper.randomBetween(0, 3);
    const newCoords = selectedPlayer.map.coords;

    switch (movement) {
      case 0:
        if (selectedPlayer.map.coords[1] === 0) {
          newCoords[1]++;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'South',
            previousLocation: selectedPlayer.map.name
          };
        }

        newCoords[1]--;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'North',
          previousLocation: selectedPlayer.map.name
        };

      case 1:
        if (selectedPlayer.map.coords[1] === mapSize[1]) {
          newCoords[1]--;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'North',
            previousLocation: selectedPlayer.map.name
          };
        }

        newCoords[1]++;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'South',
          previousLocation: selectedPlayer.map.name
        };

      case 2:
        if (selectedPlayer.map.coords[0] === mapSize[0]) {
          newCoords[0]--;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'West',
            previousLocation: selectedPlayer.map.name
          };
        }

        newCoords[0]++;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'East',
          previousLocation: selectedPlayer.map.name
        };

      case 3:
        if (selectedPlayer.map.coords[0] === 0) {
          newCoords[0]++;
          return {
            map: this.getMapByCoords(newCoords),
            direction: 'East',
            previousLocation: selectedPlayer.map.name
          };
        }

        newCoords[0]--;
        return {
          map: this.getMapByCoords(newCoords),
          direction: 'West',
          previousLocation: selectedPlayer.map.name
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
