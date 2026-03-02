const playerHandlers = require('./handlers/player');
const logsHandlers = require('./handlers/logs');
const gameplayHandlers = require('./handlers/gameplay');
const tradeHandlers = require('./handlers/trade');
const socialHandlers = require('./handlers/social');
const adminHandlers = require('./handlers/admin');

const commandList = [
  ...playerHandlers,
  ...logsHandlers,
  ...gameplayHandlers,
  ...tradeHandlers,
  ...socialHandlers,
  ...adminHandlers
];

const commandMap = new Map();
commandList.forEach(cmd => {
  cmd.aliases.forEach(alias => {
    commandMap.set(alias.toLowerCase(), cmd);
  });
});

module.exports = { commandMap, commandList };
