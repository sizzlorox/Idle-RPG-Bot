const commands = require('../data/commands');
const { botOperator } = require('../../settings');

const commandList = commands.map(c => c.command).join('|');
const commandRegex = new RegExp(commandList);

class CommandParser {

  parseUserCommand(discordBot, messageObj) {
    const messageContent = messageObj.content;
    const command = messageContent.includes(' ') ? messageContent.split(' ')[0].toLowerCase() : messageContent.toLowerCase();
    const authorId = messageObj.author.id;
    const channelId = messageObj.channel.id;

    if (commandRegex.test(command)) {
      const commandObj = commands.filter(c => c.command === command)[0];
      if (commandObj.channelOnlyId && channelId !== commandObj.channelOnlyId) {
        return;
      }

      if (commandObj.operatorOnly && authorId !== botOperator) {
        return;
      }

      commandObj.function(messageObj, discordBot);
    }
  }

}
module.exports = new CommandParser();
