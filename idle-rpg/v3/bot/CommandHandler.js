const { ChannelType } = require('discord.js');
const { botOperators } = require('../../../settings');
const { commandMap } = require('../commands/registry');
const { commandLog, errorLog } = require('../../utils/logger');

class CommandHandler {

  constructor({ game, bot }) {
    this.game = game;
    this.bot = bot;
  }

  async parseUserCommand(message) {
    try {
      const isDM = message.channel.type === ChannelType.DM;
      let guildId;
      let commandChannelId;
      let guildPrefix = '!';

      if (isDM) {
        const playerGuild = await this.game.db.getPlayerGuildId(message.author.id);
        guildId = playerGuild ? playerGuild.guildId : null;
        commandChannelId = 'dm';
      } else {
        guildId = message.guild.id;
        const commandsChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === 'commands' && channel.type === ChannelType.GuildText);
        commandChannelId = commandsChannel ? commandsChannel.id : null;
      }

      // Get the guild command prefix
      if (guildId) {
        const guildConfig = this.game.guildConfigs.get(guildId);
        if (guildConfig && guildConfig.commandPrefix) {
          guildPrefix = guildConfig.commandPrefix;
        }
      }

      if (!message.content.startsWith(guildPrefix)) return;

      // Normalize command prefix
      const normalizedContent = guildPrefix === '!irpg'
        ? '!' + message.content.replace('!irpg ', '').split(/ (.+)/)[1]
        : message.content.replace(guildPrefix, '!');

      const commandAlias = normalizedContent.split(' ')[0].toLowerCase();
      const author = message.author;
      const channelId = message.channel.id;

      const commandDef = commandMap.get(commandAlias);
      if (!commandDef) {
        if (message.content.startsWith(guildPrefix) && !isDM && channelId !== commandChannelId) {
          return author.send(`Please check ${guildPrefix}help for more info. ${commandAlias} was an invalid command.`);
        }
        return;
      }

      commandLog.info({ author: author.username, command: message.content, guildId });

      if (commandDef.channelOnly && !isDM && channelId !== commandChannelId) {
        try { await message.delete(); } catch (_) {}
        return author.send(`Please send this to <#${commandChannelId}> or PM me.`);
      }

      if (commandDef.operatorOnly && !botOperators.includes(author.id)) {
        try { await message.delete(); } catch (_) {}
        return author.send('This is a bot operator only command.');
      }

      const ctx = {
        game: this.game,
        bot: this.bot,
        message,
        guildId,
        author
      };

      return commandDef.handler(ctx);
    } catch (err) {
      errorLog.error(err);
    }
  }

}

module.exports = CommandHandler;
