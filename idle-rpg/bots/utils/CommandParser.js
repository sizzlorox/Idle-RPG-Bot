const commands = require('../data/commands');
const { botOperator } = require('../../../settings');
const { commandLog } = require('../../utils/logger');
const moment = require('moment');

const commandList = commands.map(c => c.command).join('|').replace(/(,)/g, '|');
const commandRegex = new RegExp(commandList);

class CommandParser {

  constructor(Helper) {
    this.Helper = Helper;
  }

  parseUserCommand(game, discordBot, hook, messageObj) {
    const messageContent = messageObj.content;
    const command = messageContent.includes(' ') ? messageContent.split(' ')[0].toLowerCase() : messageContent.toLowerCase();
    const authorId = messageObj.author.id;
    const channelId = messageObj.channel.id;

    if (commandRegex.test(command)) {
      const commandObj = commands.filter(c => c.command instanceof Array ? c.command.includes(command) : c.command === command)[0];
      if (!commandObj) {
        return;
      }
      commandLog.command({ author: messageObj.author.username, command: messageContent, time: moment().utc().toISOString() });

      if (commandObj.channelOnlyId && channelId !== commandObj.channelOnlyId && messageObj.channel.type !== 'dm') {
        return messageObj.delete(1500)
          .then(messageObj.author.send(`Please send this to <#${commandObj.channelOnlyId}> or PM me.`));
      }

      if (commandObj.operatorOnly && authorId !== botOperator) {
        return messageObj.delete(1500)
          .then(messageObj.author.send('This is a bot operator only command.'));
      }

      return commandObj.function(game, messageObj, discordBot, this.Helper, hook);
    }

    if (messageContent.startsWith('!')) {
      return messageObj.author.send(`Please check !help for more info. ${messageContent} was an invalid command.`);
    }
  }

}
module.exports = CommandParser;
