const globalSpells = require('../../../game/data/globalSpells');
const maps = require('../../../game/data/maps');
const enumHelper = require('../../../utils/enumHelper');
const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

module.exports = [
  {
    aliases: ['!castspell', '!cs'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const spell = args[1] ? args[1].toLowerCase() : null;
      const amount = args[2] || null;

      if (!spell) {
        return author.send(`Available global spells:\n\`\`\`bless - Costs ${globalSpells.bless.spellCost} gold per cast. Increases server multiplier for 1 hour.\nhome - Costs ${globalSpells.home.spellCost} gold. Teleports you to a random town.\`\`\``);
      }

      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');

      const actionsChannel = bot.guilds.cache.get(player.guildId) && bot.guilds.cache.get(player.guildId).channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText);
      const guildConfig = await game.db.loadGame(player.guildId);

      switch (spell) {
        case 'bless': {
          let calcAmount = amount;
          if (amount === 'all') {
            calcAmount = Math.floor(player.gold.current / globalSpells.bless.spellCost);
          } else {
            calcAmount = Number(Math.abs(amount));
            if (calcAmount <= 0 || isNaN(calcAmount)) return author.send('You must cast a valid amount');
          }
          if (player.gold.current >= (globalSpells.bless.spellCost * calcAmount) && calcAmount >= 1) {
            player.spellCast += calcAmount;
            player.gold.current -= globalSpells.bless.spellCost * calcAmount;
            await game.db.savePlayer(player);
            author.send('Spell has been cast!');
            guildConfig.multiplier += calcAmount;
            guildConfig.spells.activeBless += calcAmount;
            await game.db.updateGame(player.guildId, guildConfig);
            game.guildConfigs.set(player.guildId, guildConfig);
            if (actionsChannel) actionsChannel.send(setImportantMessage(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''} just cast${calcAmount > 1 ? ` ${calcAmount}x ` : ' '}${spell}!!\nCurrent Active Bless: ${guildConfig.spells.activeBless}\nCurrent Multiplier is: ${guildConfig.multiplier}x`));
            setTimeout(async () => {
              const newConfig = await game.db.loadGame(player.guildId);
              newConfig.multiplier = Math.max(1, newConfig.multiplier - calcAmount);
              newConfig.spells.activeBless = Math.max(0, newConfig.spells.activeBless - calcAmount);
              await game.db.updateGame(player.guildId, newConfig);
              game.guildConfigs.set(player.guildId, newConfig);
              if (actionsChannel) actionsChannel.send(setImportantMessage(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''}s${calcAmount > 1 ? ` ${calcAmount}x ` : ' '}${spell} just wore off.\nCurrent Active Bless: ${newConfig.spells.activeBless}\nCurrent Multiplier is: ${newConfig.multiplier}x`));
            }, 1800000 * 2);
          } else {
            author.send(`You do not have enough gold! This spell costs ${globalSpells.bless.spellCost} gold.`);
          }
          break;
        }
        case 'home': {
          if (player.gold.current >= globalSpells.home.spellCost) {
            player.gold.current -= globalSpells.home.spellCost;
            const randomHome = game.map.getRandomTown();
            player.map = randomHome;
            if (actionsChannel) actionsChannel.send(`${player.name}${player.titles.current !== 'None' ? ` the ${player.titles.current}` : ''} just cast ${spell} and teleported back to ${randomHome.name}.`);
            await game.db.savePlayer(player);
            author.send(`Teleported back to ${randomHome.name}. Spell has been cast!`);
          } else {
            author.send(`You do not have enough gold! This spell costs ${globalSpells.home.spellCost} gold.`);
          }
          break;
        }
        default:
          return author.send('Unknown spell. Available spells: bless, home');
      }
    }
  },
  {
    aliases: ['!lottery', '!l'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      if (!game.canJoinLottery) return author.send('Joining lottery is currently disabled, please try again in a few.');
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      if (player.lottery.joined) return author.send('You\'ve already joined todays daily lottery!');
      if (player.gold.current < 100) return author.send('You do not have enough gold to join the lottery!');

      player.lottery.joined = true;
      player.lottery.amount += 100;
      player.gold.current -= 100;

      const playerGuildId = player.guildId;
      const guildConfig = await game.db.loadGame(playerGuildId);
      guildConfig.dailyLottery.prizePool += 100;
      await game.db.updateGame(playerGuildId, guildConfig);
      game.guildConfigs.set(playerGuildId, guildConfig);
      await game.db.savePlayer(player);

      const lotteryChannel = bot.guilds.cache.get(playerGuildId) && bot.guilds.cache.get(playerGuildId).channels.cache.get(enumHelper.channels.lottery);
      if (lotteryChannel) {
        let lotteryMessages = await lotteryChannel.messages.fetch({ limit: 10 });
        lotteryMessages = lotteryMessages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp);
        if (lotteryMessages.size <= 0) {
          await lotteryChannel.send('Idle-RPG Lottery - You must pay 100 gold to enter! PM me `!lottery` to join!');
          await lotteryChannel.send(`Current lottery prize pool: ${guildConfig.dailyLottery.prizePool}`);
          await lotteryChannel.send('Contestants:');
          await lotteryChannel.send(`${player.name}`);
        } else {
          await [...lotteryMessages.values()][1].edit(`Current lottery prize pool: ${guildConfig.dailyLottery.prizePool}`);
          await [...lotteryMessages.values()][2].edit([...lotteryMessages.values()][2].content.concat(`\n${player.name}`));
        }
      }
      return author.send('You have joined todays daily lottery! Good luck!');
    }
  },
  {
    aliases: ['!quest', '!q'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const loadedPlayer = await game.db.loadPlayer(author.id);
      if (!loadedPlayer || !loadedPlayer.quest) return author.send('I\'m sorry but you have no quest.');
      if (((new Date() - loadedPlayer.quest.updated_at) / (1000 * 60 * 60 * 24)) <= 2) {
        return author.send('I\'m sorry but you must have a quest at least 2 days old to reset it.');
      }
      const oldQuestMob = loadedPlayer.quest.questMob.name;
      let { updatedPlayer } = await game.events.retrieveNewQuest(loadedPlayer, true);
      if (updatedPlayer.quest.questMob.name === oldQuestMob) {
        const newQuestResult = await game.events.retrieveNewQuest(loadedPlayer, true);
        updatedPlayer = newQuestResult.updatedPlayer;
      }
      await game.db.savePlayer(updatedPlayer);
      return author.send(`Quest ${oldQuestMob} has been changed to ${updatedPlayer.quest.questMob.name}\nCount: ${updatedPlayer.quest.questMob.count}`);
    }
  },
  {
    aliases: ['!multiplier', '!multi'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const player = await game.db.loadPlayer(author.id, { guildId: -1 });
      if (!player) return author.send('You have not been born yet!');
      const config = game.guildConfigs.get(player.guildId) || await game.db.loadGame(player.guildId);
      return author.send(`Current Multiplier: ${config.multiplier}x\nActive Bless: ${config.spells.activeBless}x`);
    }
  },
  {
    aliases: ['!map', '!m'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mapData = maps.map(m => `${m.name} [${m.coords[0]},${m.coords[1]}] - ${m.type ? m.type.name : 'Unknown'}`).join('\n');
      return author.send(`\`\`\`${mapData}\`\`\``);
    }
  },
  {
    aliases: ['!newquest', '!nq'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const loadedPlayer = await game.db.loadPlayer(author.id);
      if (!loadedPlayer) return author.send('You have not been born yet!');
      if (!loadedPlayer.quest || !loadedPlayer.quest.questMob || !loadedPlayer.quest.questMob.name) {
        let { updatedPlayer } = await game.events.retrieveNewQuest(loadedPlayer, true);
        await game.db.savePlayer(updatedPlayer);
        return author.send(`You have been assigned a new quest: ${updatedPlayer.quest.questMob.name}\nCount: ${updatedPlayer.quest.questMob.count}`);
      }
      if (((new Date() - loadedPlayer.quest.updated_at) / (1000 * 60 * 60 * 24)) <= 2) {
        return author.send('I\'m sorry but you must have a quest at least 2 days old to reset it.');
      }
      const oldQuestMob = loadedPlayer.quest.questMob.name;
      let { updatedPlayer } = await game.events.retrieveNewQuest(loadedPlayer, true);
      if (updatedPlayer.quest.questMob.name === oldQuestMob) {
        const newQuestResult = await game.events.retrieveNewQuest(loadedPlayer, true);
        updatedPlayer = newQuestResult.updatedPlayer;
      }
      await game.db.savePlayer(updatedPlayer);
      return author.send(`Quest ${oldQuestMob} has been changed to ${updatedPlayer.quest.questMob.name}\nCount: ${updatedPlayer.quest.questMob.count}`);
    }
  },
  {
    aliases: ['!gender', '!g'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(/ (.+)/);
      const value = args[1] ? args[1].trim().toLowerCase() : null;
      const validGenders = Object.keys(enumHelper.genders);
      if (!value || !validGenders.includes(value)) {
        return author.send(`\`\`\`Possible options:\n  male\n  female\n  neutral\n  neuter\`\`\``);
      }
      const loadedPlayer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!loadedPlayer) return author.send('Please set this after you have been born.');
      if (loadedPlayer.gender === value) {
        return author.send('Your gender is already set to this value.');
      }
      loadedPlayer.gender = value;
      await game.db.savePlayer(loadedPlayer);
      return author.send('Gender has been updated.');
    }
  },
  {
    aliases: ['!mention', '!men'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(/ (.+)/);
      const value = args[1] ? args[1].trim().toLowerCase() : null;
      const validOptions = ['on', 'off', 'action', 'move'];
      if (!value || !validOptions.includes(value)) {
        return author.send(`\`\`\`Possible options:\n  on - You will be tagged in events that include you\n  off - You won\'t be tagged in events that include you\n  action - You will be tagged in action events that include you\n  move - You will be tagged in move events that include you\`\`\``);
      }
      const loadedPlayer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!loadedPlayer) return author.send('Please set this after you have been born.');
      if (loadedPlayer.isMentionInDiscord === value) {
        return author.send('Your @mention preference is already set to this value.');
      }
      loadedPlayer.isMentionInDiscord = value;
      await game.db.savePlayer(loadedPlayer);
      return author.send('Preference for being @mentioned has been updated.');
    }
  },
  {
    aliases: ['!pm'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(/ (.+)/);
      const value = args[1] ? args[1].trim().toLowerCase() : null;
      const validOptions = [enumHelper.pmMode.on, enumHelper.pmMode.off, enumHelper.pmMode.filtered];
      if (!value || !validOptions.includes(value)) {
        return author.send(`\`\`\`Possible options:\n  on - You will be PMed in events that include you\n  off - You won\'t be PMed in events that include you\n  filtered - You will be PMed certain important events that include you\`\`\``);
      }
      const loadedPlayer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!loadedPlayer) return author.send('Please set this after you have been born.');
      if (loadedPlayer.isPrivateMessage === value) {
        return author.send('Your PM preference is already set to this value.');
      }
      loadedPlayer.isPrivateMessage = value;
      await game.db.savePlayer(loadedPlayer);
      return author.send(`Preference for being PMed has been set to ${value}.`);
    }
  },
  {
    aliases: ['!setserver', '!ss'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      if (args.length < 2 || !args[1]) {
        return author.send('Please input a server ID after the command. (ex: `!setserver 11111111`)');
      }
      const value = args[1].replace(/([\<\@\!\>])/g, '');
      const confirmation = args[2] === 'true';
      const loadedPlayer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!loadedPlayer) return author.send('You have not been born yet!');
      if (value === loadedPlayer.guildId) {
        return author.send('Your primary server is already set to this.');
      }
      let count = 0;
      bot.guilds.cache.forEach(guild => {
        if (guild.members.cache.get(author.id)) count++;
      });
      if (count <= 1) {
        return author.send('You must be in more than one server with this bot in order to change primary servers.');
      }
      const guildToSet = bot.guilds.cache.get(value);
      if (!guildToSet) {
        return author.send('No server found with that ID.');
      }
      const memberInGuild = guildToSet.members.cache.get(author.id);
      if (!memberInGuild) {
        return author.send('You\'re not in this server.');
      }
      if (!confirmation && loadedPlayer.equipment && loadedPlayer.equipment.relic && loadedPlayer.equipment.relic.name !== 'Nothing') {
        return author.send('Your character has a relic that may only exist in this server. If you would like to continue changing servers, type `!setserver <Server ID> true` to confirm. *This will destroy your relic!*');
      }
      loadedPlayer.guildId = value;
      if (loadedPlayer.equipment && loadedPlayer.equipment.relic && confirmation) {
        loadedPlayer.equipment.relic = { name: 'Nothing', str: 0, dex: 0, end: 0, int: 0, luk: 0, position: 'relic', previousOwners: [] };
      }
      await game.db.savePlayer(loadedPlayer);
      return author.send(`Primary server set to ${guildToSet.name}`);
    }
  }
];
