const helper = require('../utils/helper');
const Database = require('../database/Database');
const Event = require('./utils/Event');
const spells = require('./data/spells');
const moment = require('moment');
const { multiplier } = require('../../settings');

/**
 * GANE CLASS
 */
class Game {

  constructor(discordHook) {
    this.discordHook = discordHook;
    this.multiplier = multiplier;
    this.activeSpells = [];
  }

  selectEvent(player, onlinePlayers, twitchBot) {
    const randomEvent = helper.randomBetween(0, 2);

    Database.loadPlayer(player.discordId)
      .then((selectedPlayer) => {
        if (!selectedPlayer) {
          helper.sendMessage(this.discordHook, twitchBot, false, `${helper.generatePlayerName(player)} was born! Welcome to the world of Idle-RPG!`);

          return Database.createNewPlayer(player.discordId, player.name);
        }

        return selectedPlayer;
      })
      .then((selectedPlayer) => {
        selectedPlayer.name = player.name;
        selectedPlayer.events++;
        if (selectedPlayer.events % 100 === 0) {
          helper.sendMessage(this.discordHook, twitchBot, false, helper.setImportantMessage(`${selectedPlayer.name} has encountered ${selectedPlayer.events} events!`));
        }

        helper.passiveHeal(selectedPlayer);
        console.log(`\nGAME: Random Event ID: ${randomEvent} ${moment().utc('br')}`);

        switch (randomEvent) {
          case 0:
            console.log(`GAME: ${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
          case 1:
            console.log(`GAME: ${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
          case 2:
            console.log(`GAME: ${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, twitchBot)
              .then(updatedPlayer => Database.savePlayer(updatedPlayer));
            break;
        }
      })
      .catch(err => console.log(err));
  }

  moveEvent(selectedPlayer) {
    return Event.moveEvent(selectedPlayer, this.discordHook);
  }

  attackEvent(selectedPlayer, onlinePlayers, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
    if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 30 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateTownItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    if (luckDice >= 90 - (selectedPlayer.stats.luk / 2) && !Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventPlayerVsPlayer(this.discordHook, twitchBot, selectedPlayer, onlinePlayers, this.multiplier);
    }

    if (!Event.MapClass.getTowns().includes(selectedPlayer.map.name)) {
      return Event.attackEventMob(this.discordHook, twitchBot, selectedPlayer, this.multiplier);
    }

    return Event.generateLuckItemEvent(this.discordHook, 'twitch', selectedPlayer);
  }

  luckEvent(selectedPlayer, twitchBot) {
    const luckDice = helper.randomBetween(0, 100);
    console.log(`Player: ${selectedPlayer.name} - Dice: ${luckDice}`);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGodsEvent(this.discordHook, twitchBot, selectedPlayer);
    } else if (Event.MapClass.getTowns().includes(selectedPlayer.map.name) && luckDice <= 20 + (selectedPlayer.stats.luk / 2)) {
      return Event.generateGamblingEvent(this.discordHook, selectedPlayer, this.multiplier);
    } else if (Event.isBlizzardActive && Event.MapClass.getMapsByType('Snow').includes(selectedPlayer.map.name) && luckDice <= 35 + (selectedPlayer.stats.luk / 2)) {
      Event.chanceToCatchSnowflake(this.discordHook, selectedPlayer);
    } else if (luckDice >= 65 - (selectedPlayer.stats.luk / 2)) {
      return Event.generateLuckItemEvent(this.discordHook, twitchBot, selectedPlayer);
    }

    return Event.generateGoldEvent(this.discordHook, selectedPlayer, this.multiplier);
  }

  // Event
  powerHourWarn() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));
  }

  powerHourBegin() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
    this.multiplier += 1;
  }

  powerHourEnd() {
    helper.sendMessage(this.discordHook, 'twitch', false, helper.setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
    this.multiplier -= 1;
  }

  giveGold(playerId, amount) {
    return Database.loadPlayer(playerId)
      .then((updatingPlayer) => {
        updatingPlayer.gold += Number(amount);
        Database.savePlayer(updatingPlayer);
      });
  }

  // Commands
  top10(commandAuthor, type = { level: -1 }) {
    return Database.loadTop10(type)
      .then((top10) => {
        const rankString = `${top10.filter(player => player[Object.keys(type)[0]] > 0)
          .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${Object.keys(type)[0]}: ${player[Object.keys(type)[0]]}`)
          .join('\n')}`;

        commandAuthor.send(`\`\`\`Top 10 ${Object.keys(type)[0]}:
${rankString}
        \`\`\``);
      });
  }

  /**
   * Modify player preference for being @mentionned in events
   * @param Player commandAuthor
   * @param DiscordHook hook
   * @param Boolean isMentionInDiscord
   */
  modifyMention(commandAuthor, hook, isMentionInDiscord) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
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

  castSpell(commandAuthor, hook, spell) {
    return Database.loadPlayer(commandAuthor.id)
      .then((castingPlayer) => {
        switch (spell) {
          case 'bless':
            if (castingPlayer.gold >= spells.bless.spellCost) {
              castingPlayer.spells++;
              castingPlayer.gold -= spells.bless.spellCost;
              this.multiplier += 1;
              const blessLogObj = {
                spellName: 'Bless',
                caster: castingPlayer.discordId
              };

              this.activeSpells.push(blessLogObj);

              let activeBlessCount = this.activeSpells.filter((bless) => {
                return bless.spellName === 'Bless';
              }).length;

              hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name} just casted ${spell}!!\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              setTimeout(() => {
                this.multiplier -= 1;
                this.activeSpells.splice(this.activeSpells.indexOf(blessLogObj), 1);
                activeBlessCount = this.activeSpells.filter((bless) => {
                  return bless.spellName === 'Bless';
                }).length;

                hook.actionHook.send(helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off.\nCurrent Active Bless: ${activeBlessCount}\nCurrent Multiplier is: ${this.multiplier}x`));
              }, 1800000); // 30 minutes
              Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been casted!');
                });
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${spells.bless.spellCost} gold. You are lacking ${spells.bless.spellCost - castingPlayer.gold} gold.`);
            }
            break;
        }
      });
  }

  playerEventLog(playerId, count) {
    return Database.loadPlayer(playerId)
      .then((player) => {
        return helper.generateLog(player, count);
      });
  }

  playerStats(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  playerEquipment(commandAuthor) {
    return Database.loadPlayer(commandAuthor.id);
  }

  getOnlinePlayerMaps(onlinePlayers) {
    return Database.loadOnlinePlayerMaps(onlinePlayers);
  }

  savePlayer(player) {
    return Database.savePlayer(player);
  }

  loadPlayer(playerId) {
    return Database.loadPlayer(playerId);
  }

  deletePlayer(playerId) {
    return Database.deletePlayer(playerId);
  }

  deleteAllPlayers() {
    return Database.deleteAllPlayers();
  }

  /**
   * SPECIAL EVENTS
   */
  blizzardSwitch(blizzardSwitch) {
    return Event.blizzardSwitch(this.discordHook, blizzardSwitch);
  }

  sendChristmasPreEventMessage() {
    setTimeout(() => {
      helper.sendMessage(this.discordHook, 'twitch', false, '@veryone\`\`\`python\n\'Rumour has it that some mysterious beasts appeared in Wintermere, Norpond and North Redmount. Inns and taverns all over the world are full of curious adventurers. Is it somehow connected with recent news from Olohaseth?\'\`\`\`');
    }, 43200000); // 21hr

    return helper.sendMessage(this.discordHook, 'twitch', false, '@veryone\`\`\`python\n\'Terrible news from Kingdom of Olohaseth! Several people are now in hospitals with unknown wounds. They don\`t remember exactly what or who did it to them but they keep warning not to travel to another lands...\'\`\`\`');
  }

  updateChristmasEvent(isStarting) {
    if (isStarting) {
      helper.sendMessage(this.discordHook, 'twitch', false, '@veryone\`\`\`python\n\'The bravest adventurers started their expedition to the northern regions and discovered unbelievable things. It seems that Yetis had awoken from their snow caves after hundreds of years of sleep. Are they not a myth anymore?\'\`\`\`');
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

    helper.sendMessage(this.discordHook, 'twitch', false, '@veryone\`\`\`python\n\'Thousand of townsmen in Olohaseth, Kindale and other towns are celebrating end of the Darknight. It seems that Christmas Gnomes lost all their candy canes and all Yetis are back to their caves. Though noone knows for how long...\'\`\`\`');
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