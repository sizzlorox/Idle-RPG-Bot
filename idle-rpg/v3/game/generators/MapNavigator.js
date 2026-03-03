const maps = require('../../../game/data/maps');
const monsters = require('../../../game/data/monsters');
const { randomBetween } = require('../../utils/helpers');

const mapSize = maps[maps.length - 1].coords;

class MapNavigator {

  constructor() {
    this.maps = maps;
    // Build lookup tables at startup — O(1) for all map queries at runtime
    this._coordMap = new Map(maps.map(m => [`${m.coords[0]},${m.coords[1]}`, m]));
    this._towns = maps.filter(area => area.type.name === 'Town');
    this._townNames = this._towns.map(area => area.name);
    // mob name → Set of spawnable biome name strings
    this._mobBiomes = new Map(monsters.type.map(t => [t.name, new Set(t.spawnableBiomes)]));
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

  // Returns the nearest non-town map whose biome can spawn `mobName`, or null.
  findNearestMapForMob(playerCoords, mobName) {
    const validBiomes = this._mobBiomes.get(mobName);
    if (!validBiomes) return null;
    const [px, py] = playerCoords;
    let nearest = null;
    let minDist = Infinity;
    for (const m of this.maps) {
      if (!validBiomes.has(m.biome.name)) continue;
      const dist = Math.abs(m.coords[0] - px) + Math.abs(m.coords[1] - py);
      if (dist < minDist) {
        minDist = dist;
        nearest = m;
      }
    }
    return nearest;
  }

  // Steps one tile toward targetCoords along the dominant axis.
  moveTowardCoords(player, targetCoords) {
    const [px, py] = player.map.coords;
    const [tx, ty] = targetCoords;
    const dx = tx - px;
    const dy = ty - py;
    let newCoords, direction;

    const preferHorizontal = Math.abs(dx) > Math.abs(dy)
      || (dx !== 0 && dy === 0)
      || (Math.abs(dx) === Math.abs(dy) && dx !== 0 && randomBetween(0, 1) === 0);

    if (preferHorizontal && dx !== 0) {
      newCoords = [px + (dx > 0 ? 1 : -1), py];
      direction = dx > 0 ? 'East' : 'West';
    } else if (dy !== 0) {
      newCoords = [px, py + (dy > 0 ? 1 : -1)];
      direction = dy > 0 ? 'South' : 'North';
    } else {
      newCoords = [Math.min(px + 1, mapSize[0]), py];
      direction = 'East';
    }

    const map = this.getMapByCoords(newCoords);
    if (!map) return null;
    return { map, direction, previousLocation: player.map.name };
  }

}

module.exports = MapNavigator;
