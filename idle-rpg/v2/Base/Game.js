// DATA
const titles = require('../idle-rpg/data/titles');
const enumHelper = require('../../utils/enumHelper');

// UTILS
const { errorLog } = require('../../utils/logger');

class Game {

  /**
   * Returns updatedPlayerObject with updated health and mana
   * @param {PlayerObj} player
   * @param {Number} hpRegenAmount
   * @param {Number} mpRegenAmount
   * @returns {Object} PlayerObj
   */
  passiveRegen(player, hpRegenAmount, mpRegenAmount) {
    if (player.health <= enumHelper.maxHealth(player.level)) {
      player.health += Math.ceil(hpRegenAmount);
      if (player.health > enumHelper.maxHealth(player.level)) {
        player.health = enumHelper.maxHealth(player.level);
      }
    }

    if (player.mana <= enumHelper.maxMana(player.level)) {
      player.mana += Math.ceil(mpRegenAmount);
      if (player.mana > enumHelper.maxMana(player.level)) {
        player.mana = enumHelper.maxMana(player.level);
      }
    }

    return player;
  }

  /**
   * Checks current playerObj experience and returns an updated playerObj
   * @param {Object} Database
   * @param {Object} playerObj
   * @param {Array} eventMsg
   * @param {Array} eventLog
   * @returns {Object} playerObj
   */
  checkExperience(Database, playerObj, eventMsg, eventLog) {
    try {
      if (playerObj.experience.current >= playerObj.level * 15) {
        playerObj.level++;
        playerObj.experience.current = 0;
        playerObj.health = 100 + (playerObj.level * 5);
        playerObj.mana = 50 + (playerObj.level * 5);
        eventMsg.push(`\`\`\`css ${playerObj.name}${playerObj.titles.current !== 'None' ? ` the ${playerObj.titles.current}` : ''} is now level ${playerObj.level}!\`\`\``);
        eventLog.push(`Leveled up to level ${playerObj.level}`);
        for (let i = 0; i < 4; i++) {
          const randomStat = this.randomBetween(0, 3);
          switch (randomStat) {
            case 0:
              playerObj.stats.str++;
              break;
            case 1:
              playerObj.stats.dex++;
              break;
            case 2:
              playerObj.stats.end++;
              break;
            case 3:
              playerObj.stats.int++;
              break;
          }
        }
        const oldClass = playerObj.class;

        const playerStats = Object.keys(playerObj.stats).map((key) => {
          if (['str', 'dex', 'int'].includes(key)) {
            return {
              key,
              value: playerObj.stats[key]
            };
          }
        }).filter(obj => obj !== undefined)
          .sort((stat1, stat2) => stat2.value - stat1.value);

        switch (playerStats[0].key) {
          case 'str':
            playerObj.class = 'Knight';
            break;
          case 'dex':
            playerObj.class = 'Thief';
            break;
          case 'int':
            playerObj.class = 'Mage';
            break;
        }

        if (playerObj.class !== oldClass) {
          eventMsg.push(`\`\`\`css ${playerObj.name}${playerObj.titles.current !== 'None' ? ` the ${playerObj.titles.current}` : ''} has decided to become a ${playerObj.class}!\`\`\``);
          eventLog.push(`You have become a ${playerObj.class}`);
        }
        // TODO: add this once logging events have been rewritten
        // this.logEvent(playerObj, Database, eventLog, enumHelper.logTypes.action);

        return {
          updatedPlayer: playerObj,
          msg: eventMsg,
          pm: eventLog
        };
      }

      return { updatedPlayer: playerObj };
    } catch (err) {
      errorLog.error(err);
    }
  }

  // TODO: Maybe clean this up later?
  manageTitles(eventResults, title) {
    if (!eventResults.updatedPlayer.titles.unlocked.includes(eventResults.updatedPlayer.titles.current)) {
      eventResults.updatedPlayer.titles.current = 'None';
    }

    if (titles[title].stat.includes('.')) {
      const statSplit = titles[title].stat.split('.');
      if (eventResults.updatedPlayer[statSplit[0]][statSplit[1]] >= titles[title].requirements
        && !eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
        if (eventResults.updatedPlayer.titles.current === 'None') {
          eventResults.updatedPlayer.titles.current = titles[title].name;
        }
        eventResults.updatedPlayer.titles.unlocked.push(titles[title].name);
        if (eventResults.pm) {
          eventResults.pm.push(`You've just unlocked the ${titles[title].name} title!`);
        } else {
          eventResults.pm = [`You've just unlocked the ${titles[title].name} title!`]
        }
      } else if (eventResults.updatedPlayer[statSplit[0]][statSplit[1]] < titles[title].requirements
        && eventResults.updatedPlayer.titles.current === titles[title].name
        || eventResults.updatedPlayer[statSplit[0]][statSplit[1]] < titles[title].requirements
        && eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
        eventResults.updatedPlayer.titles.current = 'None';
        eventResults.updatedPlayer.titles.unlocked = eventResults.updatedPlayer.titles.unlocked.splice(eventResults.updatedPlayer.titles.unlocked.indexOf(titles[title].name), 1);
        if (eventResults.pm) {
          eventResults.pm.push(`You've just lost the ${titles[title].name} title!`);
        } else {
          eventResults.pm = [`You've just lost the ${titles[title].name} title!`]
        }
      }

      return eventResults.updatedPlayer;
    }
    if (eventResults.updatedPlayer[titles[title].stat] >= titles[title].requirements
      && !eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
      if (eventResults.updatedPlayer.titles.current === 'None') {
        eventResults.updatedPlayer.titles.current = titles[title].name;
      }
      eventResults.updatedPlayer.titles.unlocked.push(titles[title].name);
      if (eventResults.pm) {
        eventResults.pm.push(`You've just unlocked the ${titles[title].name} title!`);
      } else {
        eventResults.pm = [`You've just unlocked the ${titles[title].name} title!`]
      }
    } else if (eventResults.updatedPlayer[titles[title].stat] < titles[title].requirements
      && eventResults.updatedPlayer.titles.current === titles[title].name
      || eventResults.updatedPlayer[titles[title].stat] < titles[title].requirements
      && eventResults.updatedPlayer.titles.unlocked.includes(titles[title].name)) {
      eventResults.updatedPlayer.titles.current = 'None';
      eventResults.updatedPlayer.titles.unlocked = eventResults.updatedPlayer.titles.unlocked.splice(eventResults.updatedPlayer.titles.unlocked.indexOf(titles[title].name), 1);
      if (eventResults.pm) {
        eventResults.pm.push(`You've just lost the ${titles[title].name} title!`);
      } else {
        eventResults.pm = [`You've just lost the ${titles[title].name} title!`]
      }
    }

    return eventResults.updatedPlayer;
  }

}
module.exports = Game;
