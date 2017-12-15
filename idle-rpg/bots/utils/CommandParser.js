const commands = require('../data/commands');
const { botOperator } = require('../../../settings');

const commandList = commands.map(c => c.command).join('|');
const commandRegex = new RegExp(commandList);

class CommandParser {

  parseUserCommand(discordBot, hook, messageObj) {
    const messageContent = messageObj.content;
    const command = messageContent.includes(' ') ? messageContent.split(' ')[0].toLowerCase() : messageContent.toLowerCase();
    const authorId = messageObj.author.id;
    const channelId = messageObj.channel.id;

    if (commandRegex.test(command)) {
      const commandObj = commands.filter(c => c.command === command)[0];
      if (!commandObj) {
        return;
      }

      if (commandObj.channelOnlyId && channelId !== commandObj.channelOnlyId) {
        return messageObj.reply('This is a RPG channel only command.');
      }

      if (commandObj.operatorOnly && authorId !== botOperator) {
        return messageObj.reply('This is a bot operator only command.');
      }

      commandObj.function(messageObj, discordBot, hook);
    }
  }

}
module.exports = new CommandParser();
