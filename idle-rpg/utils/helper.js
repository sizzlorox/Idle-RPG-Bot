const fs = require('fs');
const Database = require('../database/Database');
const enumHelper = require('../utils/enumHelper');
const logger = require('../utils/logger');

class helper {
  randomBetween(min, max, decimal, exclude) {
    // https://stackoverflow.com/questions/15594332/unbiased-random-range-generator-in-javascript
    if (arguments.length < 2) return (Math.random() >= 0.5);

    let factor = 1;
    let result;
    if (typeof decimal === 'number') {
      factor = decimal ** 10;
    }

    do {
      result = (Math.random() * (max - min)) + min;
      result = Math.trunc(result * factor) / factor;
    } while (result === exclude);
    return result;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase()
      .concat(string.slice(1));
  }

  getTimePassed(timeStamp) {
    return this.toTimeFormat(new Date().getTime() - timeStamp);
  }

  toTimeFormat(duration) {
    const date = new Date(duration);
    const seconds = date.getUTCSeconds();
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const days = (date.getUTCDate() - 1);

    const dayString = (date.getUTCDate() - 1) === 0 ? '' : `${days}d `;
    const hourString = date.getUTCHours() === 0 ? '' : `${hours}h `;
    const minuteString = date.getUTCMinutes() === 0 ? '' : `${minutes}m `;
    const secondString = date.getUTCSeconds() === 0 ? '' : `${seconds}s`;

    return `${dayString}${hourString}${minuteString}${secondString}`;
  }

  logEvent(selectedPlayer, msg) {
    if (selectedPlayer.pastEvents.length === 99) {
      selectedPlayer.pastEvents.shift();
    }
    selectedPlayer.pastEvents.push({
      event: msg,
      timeStamp: new Date().getTime()
    });

    return selectedPlayer;
  }

  sendMessage(discordHook, twitchBot, isMovement, msg) {
    if (isMovement) {
      discordHook.movementHook.send(msg)
        .then(debugMsg => logger.log('move', this.formatLog(debugMsg)))
        .catch(err => logger.error(err));
    } else {
      discordHook.actionHook.send(msg)
        .then(debugMsg => logger.log('action', this.formatLog(debugMsg)))
    }

    // Add if to check if channel is streaming
    // twitchBot.say(msg.replace('/\*/g', ''));
  }

  formatLog(json) {
    const formattedLog = {
      timeStamp: json.timestamp,
      content: json.content,
      mentions: json.mentions,
    };
    return formattedLog;
  }

  setImportantMessage(message) {
    return `\`\`\`css\n${message}\`\`\``;
  }

  passiveHeal(player) {
    if (player.health <= 100 + (player.level * 5)) {
      player.health += 2;
    }

    if (player.health > 100 + (player.level * 5)) {
      player.health = 100 + (player.level * 5);
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
    if (item.position !== enumHelper.equipment.types.relic.position) {

      return Math.trunc(item.str + item.dex + item.end + item.int);
    }

    return Math.trunc(item.str + item.dex + item.end + item.int + item.luk);
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
      const eventMsg = this.setImportantMessage(`${selectedPlayer.name} is now level ${selectedPlayer.level}!`);
      const eventLog = `Leveled up to level ${selectedPlayer.level}`;

      this.sendMessage(discordHook, 'twitch', false, eventMsg);
      selectedPlayer = this.logEvent(selectedPlayer, eventLog);
    }
  }

  setPlayerEquipment(selectedPlayer, equipment, item) {
    selectedPlayer.equipment[equipment].name = item.name;
    selectedPlayer.equipment[equipment].str = item.stats.str;
    selectedPlayer.equipment[equipment].dex = item.stats.dex;
    selectedPlayer.equipment[equipment].end = item.stats.end;
    selectedPlayer.equipment[equipment].int = item.stats.int;
    if (equipment === enumHelper.equipment.types.relic.position) {
      selectedPlayer.equipment[equipment].luk = item.stats.luk;
    }
    selectedPlayer.equipment[equipment].previousOwners = item.previousOwners;
    return selectedPlayer;
  }

  checkHealth(MapClass, selectedPlayer, attackerObj, hook) {
    if (selectedPlayer.health <= 0) {
      selectedPlayer.health = 100 + (selectedPlayer.level * 5);
      selectedPlayer.map = MapClass.getMapByIndex(4);
      selectedPlayer.experience = 0;
      selectedPlayer.gold = Math.trunc(selectedPlayer.gold / 2);

      if (!attackerObj.discordId) {
        selectedPlayer.deaths.mob++;
      } else {
        if (selectedPlayer.currentBounty > 0) {
          attackerObj.gold += selectedPlayer.currentBounty;
          this.sendMessage(hook, 'twitch', false, this.setImportantMessage(`${attackerObj.name} just redeemed ${selectedPlayer.currentBounty} gold as a reward for killing ${selectedPlayer.name}!`));
          selectedPlayer.currentBounty = 0;
        }

        selectedPlayer.deaths.player++;
        attackerObj.kills.player++;
        Database.savePlayer(selectedPlayer);
      }

      const eventMsg = this.setImportantMessage(`${selectedPlayer.name} died! Game over man... Game over.`);
      const eventLog = 'You died. Game over man... Game over.';

      this.sendMessage(hook, 'twitch', false, eventMsg);
      selectedPlayer = this.logEvent(selectedPlayer, eventLog);
    }
  }

  generateStatsString(player) {
    return `\`\`\`Here are your stats!
    Health: ${player.health} / ${100 + (player.level * 5)}
    Level: ${player.level}
    Experience: ${player.experience} / ${player.level * 15}
    Gender: ${player.gender}
    Gold: ${player.gold}
    Map: ${player.map.name}
    Bounty: ${player.currentBounty}

    Stats (Sum of stats with equipment):
      Strength: ${player.stats.str} (${this.sumPlayerTotalStrength(player)})
      Dexterity: ${player.stats.dex} (${this.sumPlayerTotalDexterity(player)})
      Endurance: ${player.stats.end} (${this.sumPlayerTotalEndurance(player)})
      Intelligence: ${player.stats.int} (${this.sumPlayerTotalIntelligence(player)})
      Luck: ${player.stats.luk} (${this.sumPlayerTotalLuck(player)})

    Born: ${player.createdAt}
    Events: ${player.events}
    Gambles: ${player.gambles}
    Items Stolen: ${player.stole}
    Items Lost: ${player.stolen}
    Spells Casted: ${player.spells}
    Kills:
      Monsters: ${player.kills.mob}
      Players: ${player.kills.player}
    Battles:
      Won: ${player.battles.won}
      Lost: ${player.battles.lost}
    Deaths:
      By Monsters: ${player.deaths.mob}
      By Players: ${player.deaths.player}

    Past Events:
      ${this.generateLog(player, 5).replace('Heres what you have done so far:\n      ', '')}
      \`\`\``;
  }

  generatePreviousOwnerString(equipment) {
    if (equipment.previousOwners && equipment.previousOwners.length > 0) {
      let result = 'Previous Owners:\n        ';
      result = result.concat(equipment.previousOwners.join('\n        '));
      result = result.concat('\n');
      return result;
    }

    return '';
  }

  /**
   * Based on player setting, either return <@!discordId> or playerName
   * @param player
   * @returns String
   */
  generatePlayerName(player) {
    if (player.isMentionInDiscord === false) {
      return `\`${player.name}\``;
    }
    return `<@!${player.discordId}>`;
  }

  /**
   * Based on player setting, transform into the correct gender
   * @param player
   * @param word
   * @returns String
   */
  generateGenderString(player, word) {
    const wordMapping = {
      male: {
        he: 'he',
        his: 'his',
        him: 'him',
        himself: 'himself',
      },
      female: {
        he: 'she',
        his: 'her',
        him: 'her',
        himself: 'herself',
      },
      neutral: {
        he: 'they',
        his: 'their',
        him: 'them',
        himself: 'themself',
      }
    };

    if (wordMapping[player.gender] && wordMapping[player.gender][word]) {
      return wordMapping[player.gender][word];
    }
    return word;
  }

  generateEquipmentsString(player) {
    return `\`\`\`Heres your equipment!
    Helmet: ${player.equipment.helmet.name}
      Stats:
        Strength: ${player.equipment.helmet.str}
        Dexterity: ${player.equipment.helmet.dex}
        Endurance: ${player.equipment.helmet.end}
        Intelligence: ${player.equipment.helmet.int}
      ${this.generatePreviousOwnerString(player.equipment.helmet)}
    Armor: ${player.equipment.armor.name}
      Stats:
        Strength: ${player.equipment.armor.str}
        Dexterity: ${player.equipment.armor.dex}
        Endurance: ${player.equipment.armor.end}
        Intelligence: ${player.equipment.armor.int}
      ${this.generatePreviousOwnerString(player.equipment.armor)}
    Weapon: ${player.equipment.weapon.name}
      Stats:
        Strength: ${player.equipment.weapon.str}
        Dexterity: ${player.equipment.weapon.dex}
        Endurance: ${player.equipment.weapon.end}
        Intelligence: ${player.equipment.weapon.int}
      ${this.generatePreviousOwnerString(player.equipment.weapon)}
    Relic: ${player.equipment.relic.name}
      Stats:
        Strength: ${player.equipment.relic.str}
        Dexterity: ${player.equipment.relic.dex}
        Endurance: ${player.equipment.relic.end}
        Intelligence: ${player.equipment.relic.int}
        Luck: ${player.equipment.relic.luk}
      ${this.generatePreviousOwnerString(player.equipment.relic)}
        \`\`\``;
  }

  generateLog(player, count) {
    if (player.pastEvents.length === 0) {
      return '';
    }

    let logResult = 'Heres what you have done so far:\n      ';
    let logCount = 0;
    for (let i = player.pastEvents.length - 1; i >= 0; i--) {
      if (logCount === count) {
        break;
      }

      logResult = logResult.concat(`${player.pastEvents[i].event} [${this.getTimePassed(player.pastEvents[i].timeStamp)} ago]\n      `);
      logCount++;
    }
    return logResult;
  }
}
module.exports = new helper();
