const enumHelper = require('../../../utils/enumHelper');
const { errorLog } = require('../../../utils/logger');

// BASE
const BaseHelper = require('../../Base/Helper');

// DATA
const titles = require('./titles');
const globalSpells = require('../../../game/data/globalSpells');

class Commands extends BaseHelper {

  constructor(params) {
    super();
    const { Helper, Database, Events, MapManager } = params;
    this.Helper = Helper;
    this.Database = Database;
    this.Events = Events;
    this.MapManager = MapManager;
  }

  playerStats(params) {
    const { author } = params;
    return this.Database.loadPlayer(author.id, enumHelper.statsSelectFields);
  }

  playerEquipment(params) {
    const { author } = params;
    return this.Database.loadPlayer(author.id, enumHelper.equipSelectFields);
  }

  playerInventory(params) {
    const { author } = params;
    return this.Database.loadPlayer(author.id, enumHelper.inventorySelectFields);
  }

  async resetQuest(params) {
    const { author } = params;
    const loadedPlayer = await this.Database.loadPlayer(author.id);
    try {
      if (!loadedPlayer || !loadedPlayer.quest) {
        return 'I\'m sorry but you have no quest.';
      }
      if (((new Date() - loadedPlayer.quest.updated_at) / (1000 * 60 * 60 * 24)) <= 2) {
        return 'I\'m sorry but you must have a quest at least 2 days old';
      }
      const oldQuestMob = loadedPlayer.quest.questMob.name;
      let { updatedPlayer } = await this.Events.retrieveNewQuest(loadedPlayer, true);
      if (updatedPlayer.quest.questMob.name === oldQuestMob) {
        const newQuestResult = await this.Events.retrieveNewQuest(loadedPlayer, true);
        updatedPlayer = newQuestResult.updatedPlayer;
      }
      await this.Database.savePlayer(updatedPlayer);
      return `Quest ${oldQuestMob} has been changed to ${updatedPlayer.quest.questMob.name}\nCount: ${updatedPlayer.quest.questMob.count}`;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async joinLottery(params) {
    const { author } = params;
    const player = await this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
    if (player.lottery.joined) {
      return author.send('You\'ve already joined todays daily lottery!');
    }
    player.lottery.joined = true;
    player.lottery.amount += 100;

    const guildConfig = await this.Database.loadGame(player.guildId);
    guildConfig.dailyLottery.prizePool += 100;
    await this.Database.updateGame(player.guildId, guildConfig);
    await this.Database.savePlayer(player);

    return author.send('You have joined todays daily lottery! Good luck!');
  }

  async prizePool(params) {
    const { author } = params;
    const player = await this.Database.loadPlayer(author.id, { guildId: -1 });
    const lotteryPlayers = await this.Database.loadLotteryPlayers(player.guildId);
    const guildConfig = await this.Database.loadGame(player.guildId);

    return author.send(`There are ${lotteryPlayers.length} contestants for a prize pool of ${guildConfig.dailyLottery.prizePool} gold!`);
  }

  async checkMultiplier(params) {
    const { author } = params;
    const loadedPlayer = await this.Database.loadPlayer(author.id, { guildId: -1 });
    const config = await this.Database.loadGame(loadedPlayer.guildId);

    return author.send(`Current Multiplier: ${config.multiplier}x\nActive Bless: ${config.spells.activeBless}x`);
  }

  async listTitles(params) {
    const { author } = params;
    const loadedPlayer = await this.Database.loadPlayer(author.id, { titles: -1 });
    if (loadedPlayer.titles.unlocked.length <= 0) {
      return author.send('I\'m sorry, you currently do not have any titles unlocked.');
    }

    return author.send(`You currently have ${loadedPlayer.titles.unlocked.join(', ')} unlocked!\nUse \`!st\` or \`!settitle <title>\` to change titles.`);
  }

  async setTitle(params) {
    const { author, value } = params;
    if (!this.objectContainsName(titles, value)) {
      return author.send(`${value} is not a title.`);
    }

    const loadedPlayer = await this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
    if (loadedPlayer.titles.unlocked.length <= 0) {
      return author.send('I\'m sorry, but you have no titles unlocked as of yet.');
    }

    if (!loadedPlayer.titles.unlocked.includes(value)) {
      return author.send('You do not have this title unlocked!');
    }

    loadedPlayer.titles.current = value;
    await this.Database.savePlayer(loadedPlayer);
    return author.send(`Title has been set to ${value}, you're now known as ${loadedPlayer.name} the ${value}.`);
  }

  top10(params) {
    const { author, type, guildId, Bot } = params;
    return this.Database.loadTop10(type, guildId, Bot.user.id)
      .then((top10) => {
        const rankString = `${top10.filter(player => Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] > 0)
          .sort((player1, player2) => {
            if (Object.keys(type)[0] === 'level') {
              return player2.experience.current - player1.experience.current && player2.level - player1.level;
            }

            if (Object.keys(type)[0].includes('.')) {
              const keys = Object.keys(type)[0].split('.');
              return player2[keys[0]][keys[1]] - player1[keys[0]][keys[1]];
            }

            return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
          })
          .map((player, rank) => `Rank ${rank + 1}: ${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''} - ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}: ${player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}: ${player[Object.keys(type)[0]]}`}`)
          .join('\n')}`;

        author.send(`\`\`\`Top 10 ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}`}:
${rankString}
        \`\`\``);
      });
  }

  getRank(params) {
    const { author, type } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then(player => this.Database.loadCurrentRank(player, type))
      .then(currentRank => currentRank.filter(player => Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] > 0)
        .sort((player1, player2) => {
          if (Object.keys(type)[0] === 'level') {
            return player2.experience.current - player1.experience.current && player2.level - player1.level;
          }

          if (Object.keys(type)[0].includes('.')) {
            const keys = Object.keys(type)[0].split('.');
            return player2[keys[0]][keys[1]] - player1[keys[0]][keys[1]];
          }

          return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
        }).findIndex(player => player.discordId === author.id))
      .then((rank) => {
        author.send(`You're currently ranked ${rank + 1} in ${Object.keys(type)[0].includes('.') ? Object.keys(type)[0].split('.')[0] : Object.keys(type)[0]}!`);
      });
  }

  async castSpell(params) {
    const { author, Bot, spell, amount } = params;
    const player = await this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
    const actionsChannel = Bot.guilds.find(guild => guild.id === player.guildId).channels.find(channel => channel.name === 'actions' && channel.type === 'text');
    const guildConfig = await this.Database.loadGame(player.guildId);
    switch (spell) {
      case 'bless':
        let calcAmount = amount;
        if (amount === 'all') {
          calcAmount = Math.floor(player.gold.current / globalSpells.bless.spellCost);
        }
        if (player.gold.current >= (globalSpells.bless.spellCost * calcAmount) && calcAmount >= 1) {
          player.spellCast += calcAmount;
          player.gold.current -= (globalSpells.bless.spellCost * calcAmount);
          await this.Database.savePlayer(player)
            .then(() => {
              author.send('Spell has been cast!');
            });
          guildConfig.multiplier += calcAmount;
          guildConfig.spells.activeBless += calcAmount;
          await this.Database.updateGame(player.guildId, guildConfig);
          actionsChannel.send(this.Helper.setImportantMessage(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''} just cast${calcAmount > 1 ? ` ${calcAmount}x` : ''} ${spell}!!\nCurrent Active Bless: ${guildConfig.spells.activeBless}\nCurrent Multiplier is: ${guildConfig.multiplier}x`));
          setTimeout(async () => {
            const newLoadedConfig = await this.Database.loadGame(player.guildId);
            newLoadedConfig.multiplier -= calcAmount;
            newLoadedConfig.spells.activeBless -= calcAmount;
            newLoadedConfig.spells.multiplier = newLoadedConfig.spells.multiplier <= 0 ? 1 : newLoadedConfig.spells.multiplier;
            await this.Database.updateGame(player.guildId, newLoadedConfig);
            actionsChannel.send(this.Helper.setImportantMessage(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''}s ${calcAmount > 1 ? `${calcAmount}x` : ''} ${spell} just wore off.\nCurrent Active Bless: ${newLoadedConfig.spells.activeBless}\nCurrent Multiplier is: ${newLoadedConfig.multiplier}x`));
          }, 1800000); // 30 minutes
        } else {
          author.send(`You do not have enough gold! This spell costs ${globalSpells.bless.spellCost} gold. You're lacking ${globalSpells.bless.spellCost - player.gold.current} gold.`);
        }
        break;

      case 'home':
        if (player.gold.current >= globalSpells.home.spellCost) {
          player.gold.current -= globalSpells.home.spellCost;
          const randomHome = this.MapManager.getRandomTown();
          player.map = randomHome;
          actionsChannel.send(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''} just cast ${spell} and teleported back to ${randomHome.name}.`);
          author.send(`Teleported back to ${randomHome.name}.`);
          await this.Database.savePlayer(player)
            .then(() => {
              author.send('Spell has been cast!');
            });
        } else {
          author.send(`You do not have enough gold! This spell costs ${globalSpells.home.spellCost} gold.You are lacking ${globalSpells.home.spellCost - player.gold.current} gold.`);
        }
        break;
    }
  }

  placeBounty(params) {
    const { author, Bot, recipient, amount } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((placer) => {
        const actionsChannel = Bot.guilds.find(guild => guild.id === placer.guildId).channels.find(channel => channel.name === 'actions' && channel.type === 'text');
        if (placer.gold.current >= amount) {
          placer.gold.current -= amount;

          return this.Database.savePlayer(placer)
            .then(() => {
              return this.Database.loadPlayer(recipient)
                .then((bountyRecipient) => {
                  if (!bountyRecipient) {
                    return author.send('This player does not exist.');
                  }
                  bountyRecipient.currentBounty += amount;
                  actionsChannel.send(this.Helper.setImportantMessage(`${placer.name} just put a bounty of ${amount} gold on ${bountyRecipient.name}'s head!`));

                  return this.Database.savePlayer(bountyRecipient)
                    .then(() => author.send(`Bounty of ${amount} gold has been placed`));
                });
            });
        }

        return author.send('You need more gold to place this bounty');
      });
  }

  playerEventLog(params) {
    const { author, amount } = params;
    return this.Database.loadActionLog(author.id)
      .then((playerLog) => {
        if (!playerLog.log.length) {
          return;
        }

        return this.Helper.generateLog(playerLog, amount);
      });
  }

  playerPvpLog(params) {
    const { author, amount } = params;
    return this.Database.loadPvpLog(author.id)
      .then((player) => {
        if (!player) {
          return;
        }

        return this.Helper.generatePvpLog(player, amount);
      });
  }

  modifyPM(params) {
    const { author, value, filtered } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.isPrivateMessage !== value || castingPlayer.isPrivateMessageImportant !== filtered) {
          castingPlayer.isPrivateMessage = value;
          castingPlayer.isPrivateMessageImportant = filtered;

          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Preference for being PMed has been updated.'));
        }

        return author.send('Your PM preference is already set to this value.');
      });
  }

  // TODO: Block if current or changing server has bless active
  async setServer(params) {
    const { Bot, author, value } = params;
    const loadedPlayer = await this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
    if (value === loadedPlayer.guildId) {
      return author.send('Your primary server is already set to this.');
    }
    let count = 0;
    await Bot.guilds.forEach(guild => guild.members.find(member => member.id === author.id) ? count++ : count);
    if (count <= 1) {
      return author.send('You must be in more than one server with this bot in order to change primary servers.');
    }
    const guildToSet = await Bot.guilds.find(guild => guild.id === value);
    if (!guildToSet) {
      return author.send('No server found with that ID.');
    }
    const memberInGuild = await guildToSet.members.find(member => member.id === author.id);
    if (!memberInGuild) {
      return author.send('You\'re not in this server.');
    }
    loadedPlayer.guildId = value;
    await this.Database.setPlayerGuildId(value, loadedPlayer);

    return author.send(`Primary server set to ${guildToSet.name}`);
  }

  modifyMention(params) {
    const { author, value } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.isMentionInDiscord !== value) {
          castingPlayer.isMentionInDiscord = value;

          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Preference for being @mention has been updated.'));
        }

        return author.send('Your @mention preference is already set to this value.');
      });
  }

  async modifyServerPrefix(params) {
    const { Bot, author, value, guildId } = params;
    try {
      const loadedConfig = await this.Database.loadGame(guildId);
      loadedConfig.commandPrefix = value;
      await this.Database.updateGame(guildId, loadedConfig);
      author.send(`Changed server ${guildId} command prefix to ${value}.`);
      const server = await Bot.guilds.find(guild => guild.id === guildId);
      const faqChannel = await server.channels.find(channel => channel.name === 'faq' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
      const faqMessage = await faqChannel.fetchMessages();
      // TODO move FAQ message somewhere else so I dont have to look everywhere to update these messages
      await faqMessage.array()[0].edit(`
• ** I'm not born yet, what should I do?**
  Once an event is fired for your character you will be born.
  
• ** How do I play ?**
  As long as you are in the online list you will be playing the game.Does not matter what status you set as long as you are not "Invisible".
  
• ** Will my character be reset ?**
  The game is in super early development right now so resets are expected.Once the game is complete resets will most likely be a yearly thing with leaderboards.
  
• ** How can I help with the development ?**
  Suggestions are always welcome, if you have experience with NodeJS you're welcome to become a contributor and develop along side with us!
  You can also support with development by becoming a patron! Keep in mind that you will not gain any advantage over the others and its simply a method of showing your support to the developer!
  Command: ${value} support
  
• ** My event counter goes up but I did not see anything in the event channels **
  There are some events such as luck events which fail.When they do it does not print anything but your event counter goes up.
  
• ** Is there a way to turn off all the spam from events ?**
  Yes, you can right click the channel to mute and select the mute checkbox.
  
• ** Is this open source ?**
  Yes, <https://github.com/sizzlorox/Idle-RPG-Bot>
  
• ** Do you guys have a trello board ?**
  Yes, <https://trello.com/b/OnpWqvlp/idle-rpg>
  
• ** Can I control my character ?**
  No.
  
• ** Whats the command prefix for this bot ?**
  The prefix is ${value} (eg: ${value} help).
  
• ** Can I host this in my server ?**
  Theres a command to get the invite link ${value}invite`);

      return true;
    } catch (err) {
      errorLog.error(err);

      return false;
    }
  }

  modifyGender(params) {
    const { author, value } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.gender !== value) {
          castingPlayer.gender = value;
          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Gender has been updated.'));
        }

        return author.send('Your gender is already set to this value.');
      });
  }

  async resetLotteryPlayers(params) {
    const { author, recipient } = params;
    await this.Database.removeLotteryPlayers(recipient);
    return author.send('Done');
  }

  setPlayerBounty(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        player.currentBounty = amount;
        return this.Database.savePlayer(player);
      });
  }

  setPlayergold(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        player.gold.current = Number(amount);
        player.gold.total += Number(amount);
        return this.Database.savePlayer(player);
      });
  }

  deletePlayer(params) {
    const { recipient } = params;
    return this.Database.deletePlayer(recipient);
  }

  giveGold(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((updatingPlayer) => {
        updatingPlayer.gold.current += Number(amount);
        updatingPlayer.gold.total += Number(amount);
        this.Database.savePlayer(updatingPlayer);
      });
  }

}
module.exports = Commands;