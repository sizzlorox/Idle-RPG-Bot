const { generateLog } = require('../../utils/formatters');

module.exports = [
  {
    aliases: ['!eventlog', '!el'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = Math.min(parseInt(args[1]) || 5, 25);
      const playerLog = await game.db.loadActionLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      const response = `\`\`\`${logString}\`\`\``;
      return author.send(response.length > 1950 ? response.slice(0, 1947) + '...' : response);
    }
  },
  {
    aliases: ['!pvplog', '!pl'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = Math.min(parseInt(args[1]) || 5, 25);
      const playerLog = await game.db.loadPvpLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no PvP events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      const response = `\`\`\`${logString}\`\`\``;
      return author.send(response.length > 1950 ? response.slice(0, 1947) + '...' : response);
    }
  },
  {
    aliases: ['!movelog', '!ml'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = Math.min(parseInt(args[1]) || 5, 25);
      const playerLog = await game.db.loadMoveLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no movement events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      const response = `\`\`\`${logString}\`\`\``;
      return author.send(response.length > 1950 ? response.slice(0, 1947) + '...' : response);
    }
  },
  {
    aliases: ['!clearlog', '!cl'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      await game.db.saveActionLog(author.id, { log: [] });
      await game.db.savePvpLog(author.id, { log: [] });
      await game.db.saveMoveLog(author.id, { log: [] });
      return author.send('All your logs have been cleared.');
    }
  }
];
