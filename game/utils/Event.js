const helper = require('../../utils/helper');

class Event {

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventMessage = helper.randomInt(0, 3);
    switch (randomEventMessage) {
      case 0:
        return `**${selectedPlayer.name}** found a chest containing ${item.name} in ${selectedPlayer.map}!`;
      case 1:
        return `**${selectedPlayer.name}** found ${item.name} on the ground in ${selectedPlayer.map}!`;
      case 2:
        return `**${selectedPlayer.name}** explored an abandoned hut in ${selectedPlayer.map} which had ${item.name} inside!`;
      case 3:
        return `**${selectedPlayer.name}** a bird just dropped ${item.name} infront of him/her in ${selectedPlayer.map}!`;
    }
  }

}
module.exports = new Event();
