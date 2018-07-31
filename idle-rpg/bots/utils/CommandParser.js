const commands = require('../data/commands');
const { botOperator } = require('../../../settings');
const { commandLog, errorLog } = require('../../utils/logger');
const moment = require('moment');

const commandList = commands.map(c => c.command).join('|').replace(/(,)/g, '|');
const commandRegex = new RegExp(commandList);

class CommandParser {

  constructor(params) {
    const { Game, Helper, Bot } = params;
    this.Game = Game;
    this.Helper = Helper;
    this.Bot = Bot;
  }

  async parseUserCommand(messageObj) {
    try {
      const commandChannelId = await messageObj.channel.type === 'dm'
        ? messageObj.channel.type
        : messageObj.guild.channels.find(channel => channel.name === 'commands' && channel.type === 'text').id;
      const guildId = await this.Bot.guilds.find(guild => guild.members.find(member => member.id === messageObj.author.id)).id;
      const messageContent = messageObj.content;
      let command;
      if (messageContent.includes('irpg')) {
        command = await messageContent.includes(' ') ? `!${messageContent.split(' ')[1].toLowerCase()}` : '';
        messageObj.content = messageContent.split(/ (.+)/)[1];
      } else {
        command = await messageContent.includes(' ') ? messageContent.split(' ')[0].toLowerCase() : messageContent.toLowerCase();
      }
      const authorId = messageObj.author.id;
      const channelId = messageObj.channel.id;

      if (commandRegex.test(command)) {
        const commandObj = await commands.filter(c => c.command instanceof Array ? c.command.includes(command) : c.command === command)[0];
        if (!commandObj) {
          return;
        }
        commandLog.info({ author: messageObj.author.username, command: messageContent, time: moment().utc().toISOString() });

        if (commandObj.channelOnlyId && channelId !== commandChannelId && messageObj.channel.type !== 'dm') {
          return messageObj.delete(1500)
            .then(messageObj.author.send(`Please send this to <#${commandChannelId}> or PM me.`));
        }

        if (commandObj.operatorOnly && authorId !== botOperator) {
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

      if (messageContent.startsWith('!') && channelId !== commandChannelId) {
        return messageObj.author.send(`Please check !help for more info. ${messageContent} was an invalid command.`);
      }
    } catch (err) {
      errorLog.error(err);
    }
  }

}
module.exports = CommandParser;
