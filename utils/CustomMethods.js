const fs = require("fs");

class CustomMethods {

  randomInt(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  countDirectoryFiles(directory) {
    return new Promise((resolve, reject) => {
      return fs.readdir(directory, (err, files) => {
        if (err) {
          return reject(err);
        }
        return resolve(files.length);
      });
    });
  }

  generateStatsString(player) {
    return `\nHere are your stats!
    Health: ${player.health}
    Level: ${player.level}
    Experience: ${player.experience} / ${player.level * 15}
    Gold: ${player.gold}
    Map: ${player.map}

    Stats:
    Strength: ${player.stats.str}
    Dexterity: ${player.stats.dex}
    Endurance: ${player.stats.end}
    Intelligence: ${player.stats.int}
    Luck: ${player.stats.luk}

    Equipment:
      Helment: ${player.equipment.helmet.name}
        Stats:
          Strength: ${player.equipment.helmet.str}
          Dexterity: ${player.equipment.helmet.dex}
          Endurance: ${player.equipment.helmet.end}
          Intelligence: ${player.equipment.helmet.int}
          Luck: ${player.equipment.helmet.luk}

      Armor: ${player.equipment.armor.name}
        Stats:
          Strength: ${player.equipment.armor.str}
          Dexterity: ${player.equipment.armor.dex}
          Endurance: ${player.equipment.armor.end}
          Intelligence: ${player.equipment.armor.int}
          Luck: ${player.equipment.armor.luk}

      Weapon: ${player.equipment.weapon.name}
        Stats:
          Strength: ${player.equipment.weapon.str}
          Dexterity: ${player.equipment.weapon.dex}
          Endurance: ${player.equipment.weapon.end}
          Intelligence: ${player.equipment.weapon.int}
          Luck: ${player.equipment.weapon.luk}

      Relic: ${player.equipment.relic.name}
        Stats:
          Strength: ${player.equipment.relic.str}
          Dexterity: ${player.equipment.relic.dex}
          Endurance: ${player.equipment.relic.end}
          Intelligence: ${player.equipment.relic.int}
          Luck: ${player.equipment.relic.luk}

    Born: ${player.createdAt}`;
  }

}
module.exports.CustomMethods = new CustomMethods;