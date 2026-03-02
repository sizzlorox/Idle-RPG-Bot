const { generateLog } = require('../../utils/formatters');

module.exports = [
  {
    aliases: ['!eventlog', '!el'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = parseInt(args[1]) || 5;
      const playerLog = await game.db.loadActionLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      return author.send(`\`\`\`${logString}\`\`\``);
    }
  },
  {
    aliases: ['!pvplog', '!pl'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = parseInt(args[1]) || 5;
      const playerLog = await game.db.loadPvpLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no PvP events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      return author.send(`\`\`\`${logString}\`\`\``);
    }
  },
  {
    aliases: ['!movelog', '!ml'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const amount = parseInt(args[1]) || 5;
      const playerLog = await game.db.loadMoveLog(author.id);
      if (!playerLog || !playerLog.log || playerLog.log.length === 0) {
        return author.send('You have no movement events logged yet.');
      }
      const logString = generateLog(playerLog.log, amount);
      return author.send(`\`\`\`${logString}\`\`\``);
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
