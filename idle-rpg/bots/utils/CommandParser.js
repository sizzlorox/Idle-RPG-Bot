const commands = require('../data/commands');
const { botOperators } = require('../../../settings');
const { commandLog, errorLog } = require('../../utils/logger');
const moment = require('moment');
const BaseHelper = require('../../v2/Base/Helper');

const commandList = commands.map(c => c.command).join('|').replace(/(,)/g, '|');
const commandRegex = new RegExp(commandList);

class CommandParser extends BaseHelper {

  constructor(params) {
    super();
    const { Game, Bot } = params;
    this.Game = Game;
    this.Bot = Bot;
  }

  async parseUserCommand(messageObj) {
    try {
      const commandChannelId = await messageObj.channel.type === 'dm'
        ? messageObj.channel.type
        : messageObj.guild.channels.find(channel => channel.name === 'commands' && channel.type === 'text').id;
      const guildId = messageObj.channel.type === 'dm'
        ? (await this.Game.Database.getPlayerGuildId(messageObj.author.id)).guildId
        : messageObj.guild.id;
      const guildPrefix = this.Game.getGuildCommandPrefix(guildId).prefix;
      if (!messageObj.content.startsWith(guildPrefix)) {
        return;
      }
      const command = messageObj.content.replace(guildPrefix === '!irpg' ? '!irpg ' : guildPrefix, '!').split(/ (.+)/)[0];
      if (messageObj.content.startsWith('!irpg')) {
        messageObj.content = messageObj.content.split(/ (.+)/)[1];
      }
      const authorId = messageObj.author.id;
      const channelId = messageObj.channel.id;

      if (commandRegex.test(command)) {
        const commandObj = await commands.filter(c => c.command instanceof Array ? c.command.includes(command) : c.command === command)[0];
        if (!commandObj) {
          return;
        }
        commandLog.info({ author: messageObj.author.username, command: messageObj.content, time: moment().utc().toISOString() });

        if (commandObj.channelOnlyId && channelId !== commandChannelId && messageObj.channel.type !== 'dm') {
          return messageObj.delete(1500)
            .then(messageObj.author.send(`Please send this to <#${commandChannelId}> or PM me.`));
        }

        if (commandObj.operatorOnly && !botOperators.includes(authorId)) {
          return messageObj.delete(1500)
            .then(messageObj.author.send('This is a bot operator only command.'));
        }
        const params = {
          Game: this.Game,
          Bot: this.Bot,
          Helper: this.Helper,
          guildId,
          messageObj
        };

        return commandObj.function(params);
      }

      if (messageObj.content.startsWith(guildPrefix) && channelId !== commandChannelId) {
        return messageObj.author.send(`Please check ${guildPrefix}help for more info. ${messageObj.content} was an invalid command.`);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

}
module.exports = CommandParser;
