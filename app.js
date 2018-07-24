require('dotenv').config();

console.log(`${process.env.NODE_ENV.includes('production') ? 'Running Production Env' : 'Running Development Env'}`);
const DiscordBot = require('./idle-rpg/v2/DiscordBot');
const { errorLog } = require('./idle-rpg/utils/logger');

process.on('unhandledRejection', (err) => {
  console.log(err);
  errorLog.error({ err });
});
