const Helper = require('../utils/Helper');
const Database = require('../database/Database');
const enumHelper = require('../utils/enumHelper');
const Event = require('./utils/Event');
const { errorLog } = require('../utils/logger');
const { multiplier } = require('../../settings');
const globalSpells = require('./data/globalSpells');

/**
 * GANE CLASS
 */
class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;
    this.multiplier = multiplier;
    this.activeSpells = [];
  }

  /**
   * Loads player by discordID and rolls a dice to select which type of event to activate
   * @param {Number} player
   * @param {Array} onlinePlayers
   * @param {*} twitchBot
   */
  selectEvent(discordBot, player, onlinePlayers, twitchBot) {
    const randomEvent = Helper.randomBetween(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          return Database.createNewPlayer(player.discordId, player.name)
            .then((newPlayer) => {
              Helper.sendMessage(this.discordHook, twitchBot, selectedPlayer, false, `${Helper.generatePlayerName(newPlayer, true)} was born in \`${newPlayer.map.name}\`! Welcome to the world of Idle-RPG!`);

              return newPlayer;
            });
        } else if (selectedPlayer.events === 0) {
          Helper.sendMessage(this.discordHook, twitchBot, selectedPlayer, false, `${Helper.generatePlayerName(selectedPlayer, true)} was reborn in \`${selectedPlayer.map.name}\`!`);
        }

        return selectedPlayer;
      })
      .then((selectedPlayer) => {
        if (process.env.NODE_ENV === 'production') {
          this.setPlayerTitles(discordBot, selectedPlayer);
        }

        // TODO: Remove later after release
        if (!selectedPlayer.map || !selectedPlayer.map.coords || selectedPlayer.map.coords.length === 0) {
          selectedPlayer.map = Event.MapClass.getRandomTown();
          Helper.sendMessage(this.discordHook, twitchBot, selectedPlayer, false, `The land has suddenly shifted with a large Earthquake and deafening sounds. Someone has tinkered with the fabric of reality! ${Helper.generatePlayerName(selectedPlayer)} was teleported by a mysterious wizard to \`${selectedPlayer.map.name}\``);
          Database.savePlayer(selectedPlayer);
        }
        if (!selectedPlayer.gold.current) {
          selectedPlayer.gold = {
            current: 0,
            stole: 0,
            stolen: 0,
            total: 0
          };
          Database.savePlayer(selectedPlayer);
        }
        if (!selectedPlayer.experience.current) {
          selectedPlayer.experience = {
            current: 0,
            total: 0
          };
          Database.savePlayer(selectedPlayer);
        }

        selectedPlayer.name = player.name;
        selectedPlayer.events++;

        if (selectedPlayer.events % 100 === 0) {
          Helper.sendMessage(this.discordHook, twitchBot, selectedPlayer, false, Helper.setImportantMessage(`${selectedPlayer.name} has encountered ${selectedPlayer.events} events!`))
            .then(Helper.sendPrivateMessage(this.discordHook, selectedPlayer, `You have encountered ${selectedPlayer.events} events!`, true));
        }

        Helper.passiveRegen(selectedPlayer, ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.end / 2), ((5 * selectedPlayer.level) / 2) + (selectedPlayer.stats.int / 2));
        switch (randomEvent) {
          case 0:
            console.log(`GAME: ${selectedPlayer.name} activated a move event.`);
            return this.moveEvent(selectedPlayer, onlinePlayers, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer))
              .catch(err => console.log(err));
          case 1:
            console.log(`GAME: ${selectedPlayer.name} activated an attack event.`);
            return this.attackEvent(selectedPlayer, onlinePlayers, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer))
              .catch(err => console.log(err));
          case 2:
            console.log(`GAME: ${selectedPlayer.name} activated a luck event.`);
            return this.luckEvent(selectedPlayer, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer))
              .catch(err => console.log(err));
        }
      })
      .catch(err => console.log(err));
  }

  moveEvent(selectedPlayer, onlinePlayers, twitchBot) {
    return new Promise((resolve) => {
      const pastMoveCount = selectedPlayer.pastEvents.slice(Math.max(selectedPlayer.pastEvents.length - 5, 1)).filter(event => event.event.includes('and arrived in')).length;
      if (pastMoveCount >= 5 && !Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
        console.log(`GAME: ${pastMoveCount} count: from move event ${selectedPlayer.name} activated an attack event.`);
        return this.attackEvent(selectedPlayer, onlinePlayers, twitchBot)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      return Event.moveEvent(selectedPlayer, this.discordHook)
        .then(updatedPlayer => resolve(updatedPlayer));
    });
  }

  /**
   * Rolls dice to select which type of attack event is activated for the player
   * @param {Player} selectedPlayer
   * @param {Array} onlinePlayers
   * @param {*} twitchBot
   */
  attackEvent(selectedPlayer, onlinePlayers, twitchBot) {
    return new Promise((resolve) => {
      const luckDice = Helper.randomBetween(0, 100);
      if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 30 + (selectedPlayer.stats.luk / 4)) {
        return Event.sellInTown(this.discordHook, selectedPlayer)
          .then(updatedPlayer => Event.generateTownItemEvent(this.discordHook, updatedPlayer))
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      if (luckDice >= 95 - (selectedPlayer.stats.luk / 4) && !Event.MapClass.getTowns().includes(selectedPlayer.map.name)
        && selectedPlayer.health > (100 + (selectedPlayer.level * 5)) / 4) {
        return Event.attackEventPlayerVsPlayer(this.discordHook, selectedPlayer, onlinePlayers, this.multiplier)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      if (!Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
        if (selectedPlayer.health > (100 + (selectedPlayer.level * 5)) / 4) {
          return Event.attackEventMob(this.discordHook, selectedPlayer, this.multiplier)
            .then(updatedPlayer => resolve(updatedPlayer));
        }

        return Event.campEvent(this.discordHook, selectedPlayer)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      return Event.generateLuckItemEvent(this.discordHook, 'twitch', selectedPlayer)
        .then(updatedPlayer => resolve(updatedPlayer));
    });
  }

  /**
   * Rolls dice to select which type of luck event is activated for the player
   * @param {Player} selectedPlayer
   * @param {*} twitchBot
   */
  luckEvent(selectedPlayer, twitchBot) {
    return new Promise((resolve) => {
      const luckDice = Helper.randomBetween(0, 100);
      if (luckDice <= 5 + (selectedPlayer.stats.luk / 4)) {
        return Event.generateGodsEvent(this.discordHook, twitchBot, selectedPlayer)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 20 + (selectedPlayer.stats.luk / 4)) {
        return Event.generateGamblingEvent(this.discordHook, selectedPlayer)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      if (Event.isBlizzardActive && Event.MapClass.getMapsByType('Snow').includes(selectedPlayer.map.name) && luckDice <= 35 + (selectedPlayer.stats.luk / 4)) {
        return Event.chanceToCatchSnowflake(this.discordHook, selectedPlayer)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      if (luckDice >= 65 - (selectedPlayer.stats.luk / 4)) {
        return Event.generateLuckItemEvent(this.discordHook, twitchBot, selectedPlayer)
          .then(updatedPlayer => resolve(updatedPlayer));
      }

      return Event.generateGoldEvent(this.discordHook, selectedPlayer, this.multiplier)
        .then(updatedPlayer => resolve(updatedPlayer));
    });
  }

  // Event
  powerHourBegin() {
    Helper.sendMessage(this.discordHook, 'twitch', undefined, false, Helper.setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));

    setTimeout(() => {
      Helper.sendMessage(this.discordHook, 'twitch', undefined, false, Helper.setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
      this.multiplier += 1;
    }, 1800000); // 30 minutes

    setTimeout(() => {
      Helper.sendMessage(this.discordHook, 'twitch', undefined, false, Helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
      this.multiplier -= 1;
      this.multiplier = this.multiplier <= 0 ? 1 : this.multiplier;
    }, 5400000); // 1hr 30 minutes
  }

  /**
   * Gives gold amount to player
   * @param {Number} playerId
   * @param {Number} amount
   */
  giveGold(playerId, amount) {
    return Database.loadPlayer(playerId)
      .then((updatingPlayer) => {
        updatingPlayer.gold.current += Number(amount);
        updatingPlayer.gold.total += Number(amount);
        Database.savePlayer(updatingPlayer);
      });
  }

  /**
   * Returns top10 of a certain attribute
   * @param {Number} commandAuthor
   * @param {String} type
   */
  top10(commandAuthor, type = { level: -1 }) {
    return Database.loadTop10(type)
      .then((top10) => {
        const rankString = `${top10.filter(player => Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] > 0)
          .sort((player1, player2) => {
            if (Object.keys(type)[0] === 'level') {
              return player2.experience.current - player1.experience.current && player2.level - player2.level;
            }

            if (Object.keys(type)[0].includes('.')) {
              const keys = Object.keys(type)[0].split('.');
              return player2[keys[0]][keys[1]] - player1[keys[0]][keys[1]];
            }

            return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
          })
          .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}: ${player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}: ${player[Object.keys(type)[0]]}`}`)
          .join('\n')}`;

        commandAuthor.send(`\`\`\`Top 10 ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}`}:
${rankString}
        \`\`\``);
      });
  }

  /**
   * Modify player preference for being @mentionned in events
   * @param {Number} commandAuthor
   * @param {DiscordHook} hook
   * @param {Boolean} isMentionInDiscord
   */
  modifyMention(commandAuthor, hook, isMentionInDiscord) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return commandAuthor.send('Please set this after you have been born');
        }

        if (castingPlayer.isMentionInDiscord !== isMentionInDiscord) {
          castingPlayer.isMentionInDiscord = isMentionInDiscord;

          return Database.savePlayer(castingPlayer)
            .then(() => {
              return commandAuthor.send('Preference for being @mention has been updated.');
            });
        }

        return commandAuthor.send('Your @mention preference is already set to this value.');
      });
  }

  /**
   * Modify player preference for being private messaged in events
   * @param {Number} commandAuthor
   * @param {DiscordHook} hook
   * @param {Boolean} isMentionInDiscord
   */
  modifyPM(commandAuthor, hook, isPrivateMessage, filtered) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return commandAuthor.send('Please set this after you have been born');
        }

        if (castingPlayer.isPrivateMessage !== isPrivateMessage || castingPlayer.isPrivateMessageImportant !== filtered) {
          castingPlayer.isPrivateMessage = isPrivateMessage;
          castingPlayer.isPrivateMessageImportant = filtered;

          return Database.savePlayer(castingPlayer)
            .then(() => {
              return commandAuthor.send('Preference for being PMed has been updated.');
            });
        }

        return commandAuthor.send('Your PM preference is already set to this value.');
      });
  }

  /**
   * Modify player gender
   * @param Player commandAuthor
   * @param DiscordHook hook
   * @param String gender
   */
  modifyGender(commandAuthor, hook, gender) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return commandAuthor.send('Please set this after you have been born');
        }

        if (castingPlayer.gender !== gender) {
          castingPlayer.gender = gender;
          return Database.savePlayer(castingPlayer)
            .then(() => {
              return commandAuthor.send('Gender has been updated.');
            });
        }

        return commandAuthor.send('Your gender is already set to this value.');
      });
  }

  /**
   * Casts spell
   * @param {Number} commandAuthor
   * @param {DiscordHook} hook
   * @param {String} spell
   */
  castSpell(commandAuthor, hook, spell) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        switch (spell) {
          case 'bless':
            if (castingPlayer.gold.current >= globalSpells.bless.spellCost) {
              castingPlayer.spellCasted++;
              castingPlayer.gold.current -= globalSpells.bless.spellCost;
              this.multiplier += 1;
              const blessLogObj = {
                spellName: 'Bless',
                caster: castingPlayer.discordId
              };

              this.activeSpells.push(blessLogObj);

              let activeBlessCount = this.activeSpells.filter((bless) => {
                return bless.spellName === 'Bless';
              }).length;

              hook.actionHook.send(Helper.setImportantMessage(`${castingPlayer.name} just casted ${spell}!!\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              setTimeout(() => {
                this.multiplier -= 1;
                this.multiplier = this.multiplier <= 0 ? 1 : this.multiplier;
                this.activeSpells.splice(this.activeSpells.indexOf(blessLogObj), 1);
                activeBlessCount = this.activeSpells.filter((bless) => {
                  return bless.spellName === 'Bless';
                }).length;

                hook.actionHook.send(Helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off.\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              }, 1800000); // 30 minutes

              Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been casted!');
                });
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${globalSpells.bless.spellCost} gold. You are lacking ${globalSpells.bless.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;

          case 'home':
            if (castingPlayer.gold.current >= globalSpells.home.spellCost) {
              castingPlayer.gold.current -= globalSpells.bless.spellCost;
              const Kindale = Event.MapClass.getMapByIndex(4);
              castingPlayer.map = Kindale;
              hook.actionHook.send(`${castingPlayer.name} just casted ${spell}!\nTeleported back to ${Kindale.name}.`);

              Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been casted!');
                });
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${globalSpells.home.spellCost} gold. You are lacking ${globalSpells.home.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;
        }
      });
  }

  /**
   * Sets player bounty
   * @param {Number} recipient
   * @param {Number} amount
   */
  setPlayerBounty(recipient, amount) {
    return Database.loadPlayer(recipient)
      .then((player) => {
        player.currentBounty = amount;
        return Database.savePlayer(player);
      });
  }

  /**
   * Sets player gold
   * @param {Number} recipient
   * @param {Number} amount
   */
  setPlayerGold(recipient, amount) {
    return Database.loadPlayer(recipient)
      .then((player) => {
        player.gold.current = Number(amount);
        player.gold.total += Number(amount);
        return Database.savePlayer(player);
      });
  }

  setPlayerTitles(discordBot, selectedPlayer) {
    const currentGuild = discordBot.guilds.array()[0];
    const playerDiscordObj = currentGuild.members
      .filterArray(member => member.id === selectedPlayer.discordId)[0];
    const goldTitleRole = currentGuild.roles.filterArray(role => role.name === 'Gold Hoarder')[0];
    const thiefTitleRole = currentGuild.roles.filterArray(role => role.name === 'Thief')[0];
    const veteranTitleRole = currentGuild.roles.filterArray(role => role.name === 'Veteran Idler')[0];

    const hasGoldTitle = playerDiscordObj.roles.array().includes(goldTitleRole);
    if (selectedPlayer.gold.current >= 10000 && !hasGoldTitle) {
      playerDiscordObj.addRole(goldTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} has just earned the Gold Hoarder title!`));
    } else if (selectedPlayer.gold.current < 10000 && hasGoldTitle) {
      playerDiscordObj.removeRole(goldTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} lost the Gold Hoarder title!`));
    }

    const hasThiefTitle = playerDiscordObj.roles.array().includes(thiefTitleRole);
    if (selectedPlayer.stole >= 50 && !hasThiefTitle) {
      playerDiscordObj.addRole(thiefTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} has just earned the Thief title!`));
    } else if (selectedPlayer.stole < 50 && hasThiefTitle) {
      playerDiscordObj.removeRole(thiefTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} lost the Thief title!`));
    }

    const hasVeteranTitle = playerDiscordObj.roles.array().includes(veteranTitleRole);
    if (selectedPlayer.events >= 10000 && !hasVeteranTitle) {
      playerDiscordObj.addRole(veteranTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} has just earned the Veteran Idler title!`));
    } else if (selectedPlayer.events < 10000 && hasVeteranTitle) {
      playerDiscordObj.removeRole(veteranTitleRole);
      this.discordHook.actionHook.send(Helper.setImportantMessage(`${selectedPlayer.name} lost the Veteran Idler title!`));
    }
  }

  /**
   * places a bounty on specific player
   * @param {DiscordHook} discordHook
   * @param {Number} playerId
   * @param {Number} recipient
   * @param {Number} amount
   */
  placeBounty(discordHook, bountyPlacer, recipient, amount) {
    return Database.loadPlayer(bountyPlacer.id)
      .then((placer) => {
        if (placer.gold.current >= amount) {
          placer.gold.current -= amount;

          return Database.savePlayer(placer)
            .then(() => {
              return Database.loadPlayer(recipient)
                .then((bountyRecipient) => {
                  if (!bountyRecipient) {
                    return bountyPlacer.send('This player does not exist.');
                  }
                  bountyRecipient.currentBounty += amount;
                  discordHook.actionHook.send(
                    Helper.setImportantMessage(`${placer.name} just put a bounty of ${amount} gold on ${bountyRecipient.name}'s head!`)
                  );

                  return Database.savePlayer(bountyRecipient)
                    .then(() => {
                      return bountyPlacer.send(`Bounty of ${amount} gold has been placed`);
                    });
                });
            });
        }

        return bountyPlacer.send('You need more gold to place this bounty');
      });
  }

  /**
   * Returns player eventlog by <count> amount
   * @param {String} playerId
   * @param {Number} count
   */
  playerEventLog(playerId, count) {
    return Database.loadPlayer(playerId, enumHelper.playerEventLogSelectFields)
      .then((player) => {
        if (!player) {
          return;
        }

        return Helper.generateLog(player, count);
      });
  }

  /**
   * Returns player pvp event log by <count> amount
   * @param {String} playerId
   * @param {Number} count
   */
  playerPvpLog(playerId, count) {
    return Database.loadPlayer(playerId, enumHelper.pvpLogSelectFields)
      .then((player) => {
        if (!player) {
          return;
        }

        return Helper.generatePvpLog(player, count);
      });
  }

  /**
   * Loads player stats by discordId
   * @param {Number} commandAuthor
   */
  playerStats(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id, enumHelper.statsSelectFields);
  }

  /**
   * Loads player inventory by discordId
   * @param {Number} commandAuthor
   */
  playerInventory(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id, enumHelper.inventorySelectFields);
  }

  /**
   * Loads player equipment by discordId
   * @param {Number} commandAuthor
   */
  playerEquipment(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id, enumHelper.equipSelectFields);
  }

  /**
   * Get online players maps by an array of discordIds
   * @param {Array} onlinePlayers
   */
  getOnlinePlayerMaps(onlinePlayers) {
    return Database.loadOnlinePlayerMaps(onlinePlayers);
  }

  /**
   * Saves player into database
   * @param {Number} player
   */
  savePlayer(player) {
    return Database.savePlayer(player);
  }

  /**
   * Loads player by discordId
   * @param {Number} playerId
   */
  loadPlayer(playerId) {
    return Database.loadPlayer(playerId);
  }

  /**
   * Deletes player by discordId
   * @param {Number} playerId
   */
  deletePlayer(playerId) {
    return Database.deletePlayer(playerId);
  }

  /**
   * Deletes all players in database
   */
  deleteAllPlayers() {
    return Database.resetAllPlayers();
  }

  /**
   * SPECIAL EVENTS
   */
  blizzardSwitch(blizzardSwitch) {
    return Event.blizzardSwitch(this.discordHook, blizzardSwitch);
  }

  /**
   * Sends Christmas Pre Event Message and another pre event message after 21 hours
   */
  sendChristmasFirstPreEventMessage() {
    return Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Terrible news from Kingdom of Olohaseth! Several people are now in hospitals with unknown wounds. They don\`t remember exactly what or who did it to them but they keep warning not to travel to other lands...\'\`\`\`');
  }

  sendChristmasSecondPreEventMessage() {
    return Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Rumour has it that some mysterious beasts appeared in Wintermere, Norpond and North Redmount. Inns and taverns all over the world are full of curious adventurers. Is it somehow connected with recent news from Olohaseth?\'\`\`\`');
  }

  // TODO change to utilize setTimeout
  /**
   * Activates christmas mobs to be spawnable and items droppable
   * @param {*} isStarting 
   */
  updateChristmasEvent(isStarting) {
    if (isStarting) {
      Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'The bravest adventurers started their expedition to the northern regions and discovered unbelievable things. It seems that Yetis had awoken from their snow caves after hundreds of years of sleep. Are they not a myth anymore?\'\`\`\`');
      Event.MonsterClass.monsters.forEach((mob) => {
        if (mob.isXmasEvent) {
          mob.isSpawnable = true;
        }
      });
      Event.ItemClass.items.forEach((type) => {
        type.forEach((item) => {
          if (item.isXmasEvent && item.name !== 'Snowflake') {
            item.isDroppable = true;
          }
        });
      });
      return '';
    }

    Helper.sendMessage(this.discordHook, 'twitch', undefined, false, '@everyone\`\`\`python\n\'Thousand of townsmen in Olohaseth, Kindale and other towns are celebrating end of the Darknight. It seems that Christmas Gnomes lost all their candy canes and all Yetis are back to their caves. Though noone knows for how long...\'\`\`\`');
    Event.MonsterClass.monsters.forEach((mob) => {
      if (mob.isXmasEvent) {
        mob.isSpawnable = false;
      }
    });
    Event.ItemClass.items.forEach((type) => {
      type.forEach((item) => {
        if (item.isXmasEvent && item.name !== 'Snowflake') {
          item.isDroppable = false;
        }
      });
    });
    return '';
  }

}

module.exports = Game;
