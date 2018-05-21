const fs = require('fs');
const enumHelper = require('../utils/enumHelper');
const { moveLog, actionLog, errorLog, infoLog } = require('../utils/logger');
const { battleDebug, eventDebug, guildID } = require('../../settings');
const messages = require('../game/data/messages');

class Helper {
  printBattleDebug(debugMsg) {
    if (battleDebug) {
      console.log(debugMsg);
    }
  }

  printEventDebug(debugMsg) {
    if (eventDebug) {
      console.log(debugMsg);
    }
  }

  randomBetween(min, max, decimal, exclude) {
    // https://stackoverflow.com/questions/15594332/unbiased-random-range-generator-in-javascript
    if (arguments.length < 2) return (Math.random() >= 0.5);

    let factor = 1;
    let result;
    if (typeof decimal === 'number') {
      factor = decimal ** 10;
    }

    do {
      //result = (Math.random() * (max - min)) + min;
      // https://en.wikipedia.org/wiki/Power_law
      result = Math.ceil(Math.exp(Math.random() * (Math.log(max) - Math.log(min))) * min);
      result = Math.round(result * factor) / factor;
    } while (result === exclude);
    return result;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase()
      .concat(string.slice(1));
  }

  getTimePassed(timeStamp) {
    return this.secondsToTimeFormat((new Date().getTime() - timeStamp) / 1000);
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

  // https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss#6313008
  secondsToTimeFormat(duration) {
    const secNum = parseInt(duration, 10); // don't forget the second param
    let days = Math.floor(secNum / 86400);
    let hours = Math.floor(secNum / 3600) % 24;
    let minutes = Math.floor((secNum - (hours * 3600)) / 60) % 60;
    let seconds = secNum % 60;

    days = days < 10 ? `0${days}` : days;
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  logEvent(selectedPlayer, Database, msg, eventType) {
    return new Promise((resolve) => {
      switch (eventType) {
        case enumHelper.logTypes.move:
          Database.loadMoveLog(selectedPlayer.discordId)
            .then((playerMoveLog) => {
              if (playerMoveLog.log.length > 25) {
                playerMoveLog.log.shift();
              }

              playerMoveLog.log.push({
                event: msg.includes('`') ? msg.replace(/`/g, '') : msg,
                timeStamp: new Date().getTime()
              });

              return playerMoveLog;
            })
            .then(playerMoveLog => Database.saveMoveLog(selectedPlayer.discordId, playerMoveLog))
            .catch((err) => {
              errorLog.error(err);
            });
          break;

        case enumHelper.logTypes.action:
          Database.loadActionLog(selectedPlayer.discordId)
            .then((playerActionLog) => {
              if (playerActionLog.log.length > 25) {
                playerActionLog.log.shift();
              }

              playerActionLog.log.push({
                event: msg.includes('`') ? msg.replace(/`/g, '') : msg,
                timeStamp: new Date().getTime()
              });

              return playerActionLog;
            })
            .then(playerActionLog => Database.saveActionLog(selectedPlayer.discordId, playerActionLog));
          break;

        case enumHelper.logTypes.pvp:
          Database.loadPvpLog(selectedPlayer.discordId)
            .then((playerPvpLog) => {
              if (playerPvpLog.log.length > 25) {
                playerPvpLog.log.shift();
              }

              playerPvpLog.log.push({
                event: msg.includes('`') ? msg.replace(/`/g, '') : msg,
                timeStamp: new Date().getTime()
              });

              return playerPvpLog;
            })
            .then(playerPvpLog => Database.savePvpLog(selectedPlayer.discordId, playerPvpLog));
          break;
      }

      return resolve(selectedPlayer);
    });
  }

  sendPrivateMessage(discordHook, player, msg, isImportantMessage) {
    return new Promise((resolve) => {
      if (player && player.isPrivateMessage) {
        if (player.isPrivateMessageImportant && !isImportantMessage) {
          return resolve();
        }

        return discordHook.discordBot.guilds.find('id', guildID)
          .members.find('id', player.discordId).send(msg)
          .then(() => {
            return resolve();
          })
          .catch(err => errorLog.error(err));
      }
    });
  }

  sendMessage(discordHook, twitchBot, player, isMovement, msg) {
    return new Promise((resolve) => {
      if (msg.toLowerCase().includes('pyddur')) {
        msg = msg.replace(new RegExp('<@!pyddur>', 'g'), '\`Pyddur, God Of Beer\`');
      }

      if (isMovement) {
        return discordHook.movementHook.send(msg)
          .then(debugMsg => moveLog.info(this.formatLog(debugMsg)))
          .then(resolve())
          .catch(err => console.log(err));
      }

      return discordHook.actionHook.send(msg)
        .then(debugMsg => actionLog.info(this.formatLog(debugMsg)))
        .then(resolve())
        .catch(err => console.log(err));
    });
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

  calculateItemRating(player, item) {
    if (player && item.position !== enumHelper.equipment.types.relic.position) {
      if (item.position !== enumHelper.equipment.types.weapon.position) {
        return item.power;
      }

      switch (item.attackType) {
        case 'melee':
          return Math.ceil((this.sumPlayerTotalStrength(player) + item.power)
            + (this.sumPlayerTotalDexterity(player)));

        case 'range':
          return Math.ceil((this.sumPlayerTotalDexterity(player) + item.power)
            + (this.sumPlayerTotalDexterity(player)));

        case 'magic':
          return Math.ceil((this.sumPlayerTotalIntelligence(player) + item.power)
            + (this.sumPlayerTotalDexterity(player)));
      }
    }

    return Math.ceil(item.str + item.dex + item.end + item.int + item.luk);
  }

  sumPlayerTotalStrength(player) {
    return player.stats.str
      + player.equipment.relic.str;
  }

  sumPlayerTotalDexterity(player) {
    return player.stats.dex
      + player.equipment.relic.dex;
  }

  sumPlayerTotalEndurance(player) {
    return player.stats.end
      + player.equipment.relic.end;
  }

  sumPlayerTotalIntelligence(player) {
    return player.stats.int
      + player.equipment.relic.int;
  }

  sumPlayerTotalLuck(player) {
    return player.stats.luk
      + player.equipment.relic.luk;
  }

  checkExperience(selectedPlayer, Database, discordHook, twitchBot) {
    return new Promise((resolve) => {
      if (selectedPlayer.experience.current >= selectedPlayer.level * 15) {
        selectedPlayer.level++;
        selectedPlayer.experience.current = 0;
        selectedPlayer.health = 100 + (selectedPlayer.level * 5);
        selectedPlayer.mana = 50 + (selectedPlayer.level * 5);
        for (let i = 0; i < 4; i++) {
          switch (this.randomBetween(0, 3)) {
            case 0:
              selectedPlayer.stats.str++;
              break;
            case 1:
              selectedPlayer.stats.dex++;
              break;
            case 2:
              selectedPlayer.stats.end++;
              break;
            case 3:
              selectedPlayer.stats.int++;
              break;
          }
        }
        const oldClass = selectedPlayer.class;

        const playerStats = Object.keys(selectedPlayer.stats).map((key) => {
          if (['str', 'dex', 'int'].includes(key)) {
            return {
              key,
              value: selectedPlayer.stats[key]
            };
          }
        }).filter(obj => obj !== undefined)
          .sort((stat1, stat2) => stat2.value - stat1.value);

        switch (playerStats[0].key) {
          case 'str':
            selectedPlayer.class = 'Knight';
            break;
          case 'dex':
            selectedPlayer.class = 'Thief';
            break;
          case 'int':
            selectedPlayer.class = 'Mage';
            break;
        }

        if (selectedPlayer.class !== oldClass) {
          this.sendMessage(discordHook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name} has decided to become a ${selectedPlayer.class}!`))
            .then(this.sendPrivateMessage(discordHook, selectedPlayer, `You have become a ${selectedPlayer.class}`, true))
            .then(this.logEvent(selectedPlayer, Database, `You have become a ${selectedPlayer.class}`, 'ACTION'));
        }

        const eventMsg = this.setImportantMessage(`${selectedPlayer.name} is now level ${selectedPlayer.level}!`);
        const eventLog = `Leveled up to level ${selectedPlayer.level}`;

        return Promise.all([
          this.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg),
          this.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true),
          this.logEvent(selectedPlayer, Database, eventLog, 'ACTION')
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    });
  }

  setPlayerEquipment(selectedPlayer, equipment, item) {
    selectedPlayer.equipment[equipment].name = item.name;
    const oldItemRating = this.calculateItemRating(selectedPlayer, selectedPlayer.equipment[item.position]);
    const newItemRating = this.calculateItemRating(selectedPlayer, item);
    if (item.name !== enumHelper.equipment.empty.weapon.name && item.name !== enumHelper.equipment.empty.armor.name) {
      selectedPlayer.equipment[equipment].gold = item.gold;
      if (oldItemRating > newItemRating) {
        infoLog.info({ player: selectedPlayer.name, old: { itemName: selectedPlayer.equipment[item.position], power: oldItemRating }, new: { itemName: item.name, power: newItemRating } });
      }
    }
    if (equipment !== enumHelper.equipment.types.relic.position) {
      selectedPlayer.equipment[equipment].power = item.power;
      if (equipment === enumHelper.equipment.types.weapon.position) {
        selectedPlayer.equipment[equipment].attackType = item.attackType;
      }
    } else if (equipment === enumHelper.equipment.types.relic.position) {
      selectedPlayer.equipment[equipment].str = item.stats.str;
      selectedPlayer.equipment[equipment].dex = item.stats.dex;
      selectedPlayer.equipment[equipment].end = item.stats.end;
      selectedPlayer.equipment[equipment].int = item.stats.int;
      selectedPlayer.equipment[equipment].luk = item.stats.luk;
    }
    selectedPlayer.equipment[equipment].previousOwners = item.previousOwners;

    return selectedPlayer;
  }

  checkHealth(MapClass, selectedPlayer, attackerObj, Database, hook) {
    return new Promise((resolve) => {
      if (selectedPlayer.health <= 0) {
        const expLoss = Math.ceil(selectedPlayer.experience.current / 8);
        const goldLoss = Math.ceil(selectedPlayer.gold.current / 12);
        selectedPlayer.health = 100 + (selectedPlayer.level * 5);
        selectedPlayer.mana = 50 + (selectedPlayer.level * 5);
        selectedPlayer.map = MapClass.getRandomTown();
        selectedPlayer.experience.current -= expLoss;
        selectedPlayer.experience.lost += expLoss;
        selectedPlayer.gold.current -= goldLoss;
        selectedPlayer.gold.lost += goldLoss;
        selectedPlayer.inventory = {
          equipment: [],
          items: []
        };

        const breakChance = this.randomBetween(0, 100);
        if (breakChance < 15) {
          switch (this.randomBetween(0, 2)) {
            case 0:
              if (selectedPlayer.equipment.helmet.name !== enumHelper.equipment.empty.helmet.name) {
                this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.helmet.name} just broke!`))
                  .then(this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.helmet.name} just broke!`, true))
                  .then(this.setPlayerEquipment(
                    selectedPlayer,
                    enumHelper.equipment.types.helmet.position,
                    enumHelper.equipment.empty.helmet
                  ));
              }
              break;
            case 1:
              if (selectedPlayer.equipment.armor.name !== enumHelper.equipment.empty.armor.name) {
                this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.armor.name} just broke!`))
                  .then(this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.armor.name} just broke!`, true))
                  .then(this.setPlayerEquipment(
                    selectedPlayer,
                    enumHelper.equipment.types.armor.position,
                    enumHelper.equipment.empty.armor
                  ));
              }
              break;
            case 2:
              if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
                this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.weapon.name} just broke!`))
                  .then(this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.weapon.name} just broke!`, true))
                  .then(this.setPlayerEquipment(
                    selectedPlayer,
                    enumHelper.equipment.types.weapon.position,
                    enumHelper.equipment.empty.weapon
                  ));
              }
              break;
          }
        }

        if (selectedPlayer.deaths.firstDeath === 'never') {
          selectedPlayer.deaths.firstDeath = new Date().getTime();
        }

        if (!attackerObj.discordId) {
          selectedPlayer.deaths.mob++;
        } else {
          if (selectedPlayer.currentBounty > 0) {
            const bountyGain = selectedPlayer.currentBounty / 4;
            const bountyEventLog = `Claimed ${bountyGain} gold for ${selectedPlayer.name}'s head`;
            attackerObj.gold.current += Number(bountyGain);
            attackerObj.gold.total += Number(bountyGain);
            this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${attackerObj.name} just claimed ${bountyGain} gold as a reward for killing ${selectedPlayer.name}!`))
              .then(this.sendPrivateMessage(hook, selectedPlayer, `${attackerObj.name} just claimed ${bountyGain} gold as a reward for killing you!`, true))
              .then(this.sendPrivateMessage(hook, attackerObj, bountyEventLog, true))
              .then(this.logEvent(attackerObj, Database, bountyEventLog, 'ACTION'));
            selectedPlayer.currentBounty = 0;
          }

          selectedPlayer.deaths.player++;
          attackerObj.kills.player++;
        }

        const eventMsg = this.setImportantMessage(`${selectedPlayer.name} died${expLoss === 0 ? '' : ` and lost ${expLoss} exp`}${goldLoss === 0 ? '' : ` and lost ${goldLoss} gold`}! Game over man... Game over.`);
        const eventLog = `You died${expLoss === 0 ? '' : ` and lost ${expLoss} exp`}${goldLoss === 0 ? '' : ` and lost ${goldLoss} gold`}. Game over man... Game over.`;

        return Promise.all([
          this.sendMessage(hook, 'twitch', selectedPlayer, false, eventMsg),
          this.sendPrivateMessage(hook, selectedPlayer, eventLog, true),
          this.logEvent(selectedPlayer, Database, eventLog, 'ACTION')
        ])
          .then(resolve(selectedPlayer));
      }

      return resolve(selectedPlayer);
    });
  }

  generateSpellBookString(player) {
    let spellBookString = '\`\`\`Here\'s your spellbook!\n';
    player.spells.forEach((spell) => {
      spellBookString = spellBookString.concat(`    ${spell.name} - ${spell.description}\n`);
    });
    spellBookString = spellBookString.concat('\`\`\`');

    return spellBookString;
  }

  generateStatsString(player) {
    return `\`\`\`Here are your stats!
    Health: ${player.health} / ${enumHelper.maxHealth(player.level)}
    Mana: ${player.mana} / ${enumHelper.maxMana(player.level)}
    Level: ${player.level}
    Experience: 
      Current: ${player.experience.current}
      Lost: ${player.experience.lost}
      Total: ${player.experience.total}
      TNL: ${(player.level * 15) - player.experience.current} / ${(player.level * 15)}
    Class: ${player.class}
    Gender: ${player.gender}
    Gold:
      Current: ${player.gold.current}
      Lost: ${player.gold.lost}
      Stolen from you: ${player.gold.stolen}
      Stole from others: ${player.gold.stole}
      Lottery: ${player.gold.dailyLottery}
      Gambles: 
        Count: ${player.gambles}
        Won: ${player.gold.gambles.won}
        Lost: ${player.gold.gambles.lost}
      Total: ${player.gold.total}
    Map: ${player.map.name}
    Bounty: ${player.currentBounty}

    Stats (Sum of stats with equipment):
      Strength: ${player.stats.str} (${this.sumPlayerTotalStrength(player)})
      Dexterity: ${player.stats.dex} (${this.sumPlayerTotalDexterity(player)})
      Endurance: ${player.stats.end} (${this.sumPlayerTotalEndurance(player)})
      Intelligence: ${player.stats.int} (${this.sumPlayerTotalIntelligence(player)})
      Luck: ${player.stats.luk} (${this.sumPlayerTotalLuck(player)})

    Born: ${this.getTimePassed(player.createdAt)}
    Events: ${player.events}
    Items Stolen: ${player.stole}
    Items Lost: ${player.stolen}
    Spells Cast: ${player.spellCast}
    Kills:
      Monsters: ${player.kills.mob}
      Players: ${player.kills.player}
    Battles:
      Won: ${player.battles.won}
      Lost: ${player.battles.lost}
    Deaths:
      By Monsters: ${player.deaths.mob}
      By Players: ${player.deaths.player}\`\`\``;
  }

  generatePreviousOwnerString(equipment) {
    if (equipment.previousOwners && equipment.previousOwners.length > 0) {
      let result = 'Previous Owners:\n            ';
      result = result.concat(equipment.previousOwners.join('\n            '));
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
  generatePlayerName(player, isAction) {
    if (
      player.isMentionInDiscord === 'off'
      || player.isMentionInDiscord === 'action' && !isAction
      || player.isMentionInDiscord === 'move' && isAction
    ) {
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
    return enumHelper.genders[player.gender] ? enumHelper.genders[player.gender][word] : word;
  }

  generateInventoryEquipmentString(player) {
    return new Promise((resolve) => {
      let equipString = '';
      player.inventory.equipment.forEach((equip, index, array) => {
        switch (equip.position) {
          case enumHelper.equipment.types.helmet.position:
            equipString = equipString.concat(`${equip.name}:
            Defense: ${equip.power}
          ${this.generatePreviousOwnerString(equip)}`);
            break;

          case enumHelper.equipment.types.armor.position:
            equipString = equipString.concat(`${equip.name}:
            Defense: ${equip.power}
          ${this.generatePreviousOwnerString(equip)}`);
            break;

          case enumHelper.equipment.types.weapon.position:
            const weaponRating = this.calculateItemRating(player, equip);
            equipString = equipString.concat(`${equip.name}:
            BaseAttackPower: ${equip.power}
            AttackPower: ${Number(weaponRating)}
            AttackType: ${equip.attackType}
          ${this.generatePreviousOwnerString(equip)}`);
            break;
        }

        if (index !== array.length - 1) {
          equipString = equipString.concat('\n          ');
        }
      });

      return resolve(equipString);
    });
  }

  generateInventoryString(player) {
    return this.generateInventoryEquipmentString(player)
      .then((equipment) => {
        return `\`\`\`Here is your inventory!
        Equipment:
          ${equipment}
        
        Items:
          ${player.inventory.items.map(item => item.name).join('\n      ')}\`\`\``;
      });
  }

  generateEquipmentsString(player) {
    const weaponRating = this.calculateItemRating(player, player.equipment.weapon);
    return `\`\`\`Here is your inventory!
        Helmet: ${player.equipment.helmet.name}
          Defense: ${player.equipment.helmet.power}
          ${this.generatePreviousOwnerString(player.equipment.helmet)}
        Armor: ${player.equipment.armor.name}
          Defense: ${player.equipment.armor.power}
          ${this.generatePreviousOwnerString(player.equipment.armor)}
        Weapon: ${player.equipment.weapon.name}
          BaseAttackPower: ${player.equipment.weapon.power}
          AttackPower: ${Number(weaponRating)}
          AttackType: ${player.equipment.weapon.attackType}
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
    if (player.log.length === 0) {
      return '';
    }

    let logResult = 'Heres what you have done so far:\n      ';
    let logCount = 0;
    for (let i = player.log.length - 1; i >= 0; i--) {
      if (logCount === count) {
        break;
      }

      logResult = logResult.concat(`${player.log[i].event} [${this.getTimePassed(player.log[i].timeStamp)} ago]\n      `);
      logCount++;
    }

    return logResult;
  }

  generatePvpLog(player, count) {
    if (player.log.length === 0) {
      return '';
    }

    let logResult = 'Heres what you have done so far:\n      ';
    let logCount = 0;
    for (let i = player.log.length - 1; i >= 0; i--) {
      if (logCount === count) {
        break;
      }

      logResult = logResult.concat(`${player.log[i].event} [${this.getTimePassed(player.log[i].timeStamp)} ago]\n      `);
      logCount++;
    }

    return logResult;
  }

  generateMessageWithNames(eventMsg, eventLog, selectedPlayer, item, luckGambleGold, victimPlayer, otherPlayerLog) {
    // TODO: Maybe change these ^^^^^ into an array???
    eventMsg = eventMsg.replace(/(\$\$)/g, selectedPlayer.map.name)
      .replace(/(##)/g, this.generatePlayerName(selectedPlayer, true))
      .replace(/(@@)/g, this.generateGenderString(selectedPlayer, 'him'))
      .replace(/(\^\^)/g, this.generateGenderString(selectedPlayer, 'his'))
      .replace(/(&&)/g, this.generateGenderString(selectedPlayer, 'he'));

    eventLog = eventLog.replace('$$', selectedPlayer.map.name)
      .replace(/(##)/g, selectedPlayer.name)
      .replace(/(@@)/g, this.generateGenderString(selectedPlayer, 'him'))
      .replace(/(\^\^)/g, this.generateGenderString(selectedPlayer, 'his'))
      .replace(/(&&)/g, this.generateGenderString(selectedPlayer, 'he'));

    if (item) {
      eventMsg = eventMsg.replace(/(%%)/g, item.name);
      eventLog = eventLog.replace(/(%%)/g, item.name);
    }
    if (luckGambleGold) {
      eventMsg = eventMsg.replace(/(\$&)/g, luckGambleGold);
      eventLog = eventLog.replace(/(\$&)/g, luckGambleGold);
    }
    if (victimPlayer) {
      eventMsg = eventMsg.replace(/(!!)/g, this.generatePlayerName(victimPlayer, true));
      eventLog = eventLog.replace(/(!!)/g, victimPlayer.name);
    }

    return { eventMsg, eventLog, selectedPlayer, item, victimPlayer, otherPlayerLog };
  }

  randomCampEventMessage(selectedPlayer) {
    const randomEventInt = this.randomBetween(0, messages.event.camp.length - 1);
    const { eventMsg, eventLog } = messages.event.camp[randomEventInt];

    return this.generateMessageWithNames(eventMsg, eventLog, selectedPlayer);
  }

  randomItemEventMessage(selectedPlayer, item) {
    const randomEventInt = this.randomBetween(0, messages.event.item.length - 1);
    const { eventMsg, eventLog } = messages.event.item[randomEventInt];

    return this.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, item);
  }

  randomGambleEventMessage(selectedPlayer, luckGambleGold, isWin) {
    if (isWin) {
      const randomEventInt = this.randomBetween(0, messages.event.gamble.win.length - 1);
      const { eventMsg, eventLog } = messages.event.gamble.win[randomEventInt];

      return this.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
    }

    const randomEventInt = this.randomBetween(0, messages.event.gamble.lose.length - 1);
    const { eventMsg, eventLog } = messages.event.gamble.lose[randomEventInt];

    return this.generateMessageWithNames(eventMsg, eventLog, selectedPlayer, undefined, luckGambleGold);
  }
}
module.exports = Helper;
