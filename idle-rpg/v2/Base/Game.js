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
   * Checks players health, and if killer is mob or another player
   * @param {Object} Database
   * @param {Object} MapClass
   * @param {Object} playerObj
   * @param {Object} attackerObj
   * @param {Array} eventMsg
   * @param {Array} eventLog
   * @param {Array} otherPlayerPmMsg
   * @returns {Object} playerObj
   */
  checkHealth(Database, MapClass, playerObj, attackerObj, eventMsg, eventLog, otherPlayerPmMsg) {
    const updatedPlayer = Object.assign({}, playerObj);
    const updatedAttacker = Object.assign({}, attackerObj);

    try {
      if (updatedPlayer.health <= 0) {
        const expLoss = Math.ceil(updatedPlayer.experience.current / 8);
        const goldLoss = Math.ceil(updatedPlayer.gold.current / 12);
        eventMsg.push(this.setImportantMessage(`${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''} died${expLoss === 0 ? '' : ` and lost ${expLoss} exp`}${goldLoss === 0 ? '' : ` and lost ${goldLoss} gold`}! Game over man... Game over.`));
        eventLog.push(`You died${expLoss === 0 ? '' : ` and lost ${expLoss} exp`}${goldLoss === 0 ? '' : ` and lost ${goldLoss} gold`}. Game over man... Game over.`);
        let bountyEventLog;
        updatedPlayer.health = 100 + (updatedPlayer.level * 5);
        updatedPlayer.mana = 50 + (updatedPlayer.level * 5);
        updatedPlayer.map = MapClass.getRandomTown();
        updatedPlayer.experience.current -= expLoss;
        updatedPlayer.experience.lost += expLoss;
        updatedPlayer.gold.current -= goldLoss;
        updatedPlayer.gold.lost += goldLoss;
        updatedPlayer.inventory = {
          equipment: [],
          items: []
        };

        const breakChance = this.randomBetween(0, 100);
        if (breakChance < 15) {
          const randomEquip = this.randomBetween(0, 2);
          switch (randomEquip) {
            case 0:
              if (updatedPlayer.equipment.helmet.name !== enumHelper.equipment.empty.helmet.name) {
                eventMsg.push(this.setImportantMessage(`${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''}'s ${updatedPlayer.equipment.helmet.name} just broke!`));
                eventLog.push(`Your ${updatedPlayer.equipment.helmet.name} just broke!`);
                this.setPlayerEquipment(
                  updatedPlayer,
                  enumHelper.equipment.types.helmet.position,
                  enumHelper.equipment.empty.helmet
                );
              }
              break;
            case 1:
              if (updatedPlayer.equipment.armor.name !== enumHelper.equipment.empty.armor.name) {
                eventMsg.push(this.setImportantMessage(`${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''}'s ${updatedPlayer.equipment.armor.name} just broke!`));
                eventLog.push(`Your ${updatedPlayer.equipment.armor.name} just broke!`);
                this.setPlayerEquipment(
                  updatedPlayer,
                  enumHelper.equipment.types.armor.position,
                  enumHelper.equipment.empty.armor
                );
              }
              break;
            case 2:
              if (updatedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
                eventMsg.push(this.setImportantMessage(`${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''}'s ${updatedPlayer.equipment.weapon.name} just broke!`));
                eventLog.push(`Your ${updatedPlayer.equipment.weapon.name} just broke!`);
                this.setPlayerEquipment(
                  updatedPlayer,
                  enumHelper.equipment.types.weapon.position,
                  enumHelper.equipment.empty.weapon
                );
              }
              break;
          }
        }

        if (updatedPlayer.deaths.firstDeath === 'never') {
          updatedPlayer.deaths.firstDeath = new Date().getTime();
        }

        if (!updatedAttacker.discordId) {
          updatedPlayer.deaths.mob++;
        } else {
          if (updatedPlayer.currentBounty > 0) {
            const bountyGain = Math.ceil(updatedPlayer.currentBounty / 1.25);
            bountyEventLog = `Claimed ${bountyGain} gold for ${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''}'s head`;
            updatedAttacker.gold.current += Number(bountyGain);
            updatedAttacker.gold.total += Number(bountyGain);
            updatedPlayer.currentBounty = 0;
            eventMsg.push(this.setImportantMessage(`${updatedAttacker.name}${updatedAttacker.titles.current !== 'None' ? ` the ${updatedAttacker.titles.current}` : ''} just claimed ${bountyGain} gold as a reward for killing ${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''}!`));
            eventLog.push(`You just claimed ${bountyGain} gold as a reward for killing ${updatedPlayer.name}!`)
            otherPlayerPmMsg.push(`${updatedAttacker.name}${updatedAttacker.titles.current !== 'None' ? ` the ${updatedAttacker.titles.current}` : ''} just claimed ${bountyGain} gold as a reward for killing you!`);
            // this.logEvent(updatedAttacker, Database, bountyEventLog, enumHelper.logTypes.action);
          }

          updatedPlayer.deaths.player++;
          updatedAttacker.kills.player++;
          Database.savePlayer(updatedAttacker);
        }
        // TODO: add when log has been rewritten to V2
        // this.logEvent(updatedPlayer, Database, eventLog, enumHelper.logTypes.action);

        return {
          updatedPlayer,
          msg: eventMsg,
          pm: eventLog,
          updatedAttacker,
          otherPlayerPmMsg
        };
      }

      return { updatedPlayer };
    } catch (err) {
      errorLog.error(err);
    }
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
    const updatedPlayer = Object.assign({}, playerObj);

    try {
      if (updatedPlayer.experience.current >= updatedPlayer.level * 15) {
        updatedPlayer.level++;
        updatedPlayer.experience.current = 0;
        updatedPlayer.health = 100 + (updatedPlayer.level * 5);
        updatedPlayer.mana = 50 + (updatedPlayer.level * 5);
        eventMsg.push(`\`\`\`css\n${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''} is now level ${updatedPlayer.level}!\`\`\``);
        eventLog.push(`Leveled up to level ${updatedPlayer.level}`);
        for (let i = 0; i < 4; i++) {
          const randomStat = this.randomBetween(0, 3);
          switch (randomStat) {
            case 0:
              updatedPlayer.stats.str++;
              break;
            case 1:
              updatedPlayer.stats.dex++;
              break;
            case 2:
              updatedPlayer.stats.end++;
              break;
            case 3:
              updatedPlayer.stats.int++;
              break;
          }
        }
        const oldClass = updatedPlayer.class;

        const playerStats = Object.keys(updatedPlayer.stats).map((key) => {
          if (['str', 'dex', 'int'].includes(key)) {
            return {
              key,
              value: updatedPlayer.stats[key]
            };
          }
        }).filter(obj => obj !== undefined)
          .sort((stat1, stat2) => stat2.value - stat1.value);

        switch (playerStats[0].key) {
          case 'str':
            updatedPlayer.class = 'Knight';
            break;
          case 'dex':
            updatedPlayer.class = 'Thief';
            break;
          case 'int':
            updatedPlayer.class = 'Mage';
            break;
        }

        if (updatedPlayer.class !== oldClass) {
          eventMsg.push(`\`\`\`css\n${updatedPlayer.name}${updatedPlayer.titles.current !== 'None' ? ` the ${updatedPlayer.titles.current}` : ''} has decided to become a ${updatedPlayer.class}!\`\`\``);
          eventLog.push(`You have become a ${updatedPlayer.class}`);
        }
        // TODO: add this once logging events have been rewritten
        // this.logEvent(updatedPlayer, Database, eventLog, enumHelper.logTypes.action);

        return {
          updatedPlayer,
          msg: eventMsg,
          pm: eventLog
        };
      }

      return { updatedPlayer };
    } catch (err) {
      errorLog.error(err);
    }
  }

  /**
   * Updates player equipment with item
   * @param {Object} playerObj
   * @param {Object} equipment
   * @param {Object} item
   * @returns {Object} updatedPlayer 
   */
  setPlayerEquipment(playerObj, equipment, item) {
    const updatedPlayer = Object.assign({}, playerObj);

    updatedPlayer.equipment[equipment].name = item.name;
    if (equipment !== enumHelper.equipment.types.relic.position) {
      updatedPlayer.equipment[equipment].power = item.power;
      if (equipment === enumHelper.equipment.types.weapon.position) {
        updatedPlayer.equipment[equipment].attackType = item.attackType;
      }
    } else if (equipment === enumHelper.equipment.types.relic.position) {
      updatedPlayer.equipment[equipment].str = item.stats.str;
      updatedPlayer.equipment[equipment].dex = item.stats.dex;
      updatedPlayer.equipment[equipment].end = item.stats.end;
      updatedPlayer.equipment[equipment].int = item.stats.int;
      updatedPlayer.equipment[equipment].luk = item.stats.luk;
    }
    updatedPlayer.equipment[equipment].previousOwners = item.previousOwners;

    return updatedPlayer;
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
