const fs = require('fs');
const Map = require('../game/utils/Map');

class helper {
  randomInt(min, max) {
    return Math.floor(Math.random() * (((max - min) + 1) + min));
  }

  sendMessage(discordHook, twitchBot, msg) {
    discordHook.send(msg);
    // Add if to check if channel is streaming
    // twitchBot.say(msg.replace('/\\*/g', ''));
  }

  setImportantMessage(message) {
    return `\`\`\`css\n${message}\`\`\``;
  }

  passiveHeal(player) {
    if (player.health <= 100 + (player.level * 5)) {
      player.health += 5;
      if (player.health > 100 + (player.level * 5)) {
        player.health = 100 + (player.level * 5);
      }
    }
    return player;
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

  calculateItemRating(item) {
    return item.str + item.dex + item.end + item.int;
  }

  sumPlayerTotalStrength(player) {
    return player.stats.str
      + player.equipment.helmet.str
      + player.equipment.armor.str
      + player.equipment.weapon.str
      + player.equipment.relic.str;
  }

  sumPlayerTotalDexterity(player) {
    return player.stats.dex
      + player.equipment.helmet.dex
      + player.equipment.armor.dex
      + player.equipment.weapon.dex
      + player.equipment.relic.dex;
  }

  sumPlayerTotalEndurance(player) {
    return player.stats.end
      + player.equipment.helmet.end
      + player.equipment.armor.end
      + player.equipment.weapon.end
      + player.equipment.relic.end;
  }

  sumPlayerTotalIntelligence(player) {
    return player.stats.int
      + player.equipment.helmet.int
      + player.equipment.armor.int
      + player.equipment.weapon.int
      + player.equipment.relic.int;
  }

  sumPlayerTotalLuck(player) {
    return player.stats.luk
      + player.equipment.relic.luk;
  }

  checkExperience(selectedPlayer, discordHook, twitchBot) {
    if (selectedPlayer.experience >= selectedPlayer.level * 15) {
      selectedPlayer.level++;
      selectedPlayer.experience = 0;
      selectedPlayer.health = 100 + (selectedPlayer.level * 5);
      selectedPlayer.stats.str++;
      selectedPlayer.stats.dex++;
      selectedPlayer.stats.end++;
      selectedPlayer.stats.int++;
      discordHook.send(this.setImportantMessage(`${selectedPlayer.name} is now level ${selectedPlayer.level}!`));
    }
  }

  setPlayerEquipment(selectedPlayer, equipment, item) {
    selectedPlayer.equipment[equipment].name = item.name;
    selectedPlayer.equipment[equipment].str = item.stats.str;
    selectedPlayer.equipment[equipment].dex = item.stats.dex;
    selectedPlayer.equipment[equipment].end = item.stats.end;
    selectedPlayer.equipment[equipment].int = item.stats.int;
    return selectedPlayer;
  }

  checkHealth(selectedPlayer, attackerObj, hook) {
    if (selectedPlayer.health <= 0) {
      selectedPlayer.health = 105;
      selectedPlayer.experience = 0;
      selectedPlayer.map = Map.getMapByIndex(4);
      selectedPlayer.level = 1;
      selectedPlayer.gold = 0;
      selectedPlayer.equipment = {
        helmet: {
          name: 'Nothing',
          str: 0,
          dex: 0,
          end: 0,
          int: 0
        },
        armor: {
          name: 'Nothing',
          str: 0,
          dex: 0,
          end: 0,
          int: 0
        },
        weapon: {
          name: 'Fist',
          str: 1,
          dex: 1,
          end: 1,
          int: 0
        },
        relic: {
          name: 'Nothing',
          str: 0,
          dex: 0,
          end: 0,
          int: 0,
          luk: 0
        }
      };
      selectedPlayer.stats = {
        str: 1,
        dex: 1,
        end: 1,
        int: 1,
        luk: 1
      };
      if (!attackerObj.discordId) {
        selectedPlayer.deaths.mob++;
      } else {
        selectedPlayer.deaths.player++;
        attackerObj.kills.player++;
        LocalDatabase.write(selectedPlayer);
      }
      hook.send(helper.setImportantMessage(`${selectedPlayer.name} died! Game over man... Game over.`));
    }
  }

  generateStatsString(player) {
    return `\`\`\`Here are your stats!
    Health: ${player.health} / ${100 + (player.level * 5)}
    Level: ${player.level}
    Experience: ${player.experience} / ${player.level * 15}
    Gold: ${player.gold}
    Map: ${player.map.name}

    Stats:
      Strength: ${player.stats.str} (${this.sumPlayerTotalStrength(player)})
      Dexterity: ${player.stats.dex} (${this.sumPlayerTotalDexterity(player)})
      Endurance: ${player.stats.end} (${this.sumPlayerTotalEndurance(player)})
      Intelligence: ${player.stats.int} (${this.sumPlayerTotalIntelligence(player)})
      Luck: ${player.stats.luk} (${this.sumPlayerTotalLuck(player)})

    Equipment:
      Helment: ${player.equipment.helmet.name}
        Stats:
          Strength: ${player.equipment.helmet.str}
          Dexterity: ${player.equipment.helmet.dex}
          Endurance: ${player.equipment.helmet.end}
          Intelligence: ${player.equipment.helmet.int}

      Armor: ${player.equipment.armor.name}
        Stats:
          Strength: ${player.equipment.armor.str}
          Dexterity: ${player.equipment.armor.dex}
          Endurance: ${player.equipment.armor.end}
          Intelligence: ${player.equipment.armor.int}

      Weapon: ${player.equipment.weapon.name}
        Stats:
          Strength: ${player.equipment.weapon.str}
          Dexterity: ${player.equipment.weapon.dex}
          Endurance: ${player.equipment.weapon.end}
          Intelligence: ${player.equipment.weapon.int}

      Relic: ${player.equipment.relic.name}
        Stats:
          Strength: ${player.equipment.relic.str}
          Dexterity: ${player.equipment.relic.dex}
          Endurance: ${player.equipment.relic.end}
          Intelligence: ${player.equipment.relic.int}
          Luck: ${player.equipment.relic.luk}

    Born: ${player.createdAt}
    Events: ${player.events}
    Kills:
      Monsters: ${player.kills.mob}
      Players: ${player.kills.player}
    Deaths:
      By Monsters: ${player.deaths.mob}
      By Players: ${player.deaths.player}\`\`\``;
  }
}
module.exports = new helper();
