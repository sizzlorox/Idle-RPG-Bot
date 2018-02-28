const maps = require('../data/maps');
const Helper = require('../../utils/Helper');

class Map {

  moveToRandomMap(selectedPlayer) {
    const movement = Helper.randomBetween(0, 100);
    let movementSpeed = 1;
    if ( selectedPlayer.horse === "Yes" ){
      let movementSpeed = randomBetween (1,3);
      
    }
    
    if (movement > 50 && selectedPlayer.map.id !== 0 && selectedPlayer.map.id !== maps.length - 1 || selectedPlayer.map.id === 0) {
      let distanceMoved = selectedPlayer.map.id + movementSpeed;
      if(distanceMoved > maps.length){
        selectedPlayer.map.id = map.length;
        distanceMoved = selectedPlayer.map.id;
      } 
      return maps[distanceMoved];
    }
    let distanceMoved = selectedPlayer.map.id - movementSpeed;

    if(distanceMoved < 0){
      selectedPlayer.map.id = 0;
      distanceMoved = selectedPlayer.map.id;
    } 
    return maps[distanceMoved];
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
