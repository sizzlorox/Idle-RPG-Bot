require('dotenv').config();
const fs = require('fs');
const dir = './logs';

if (!fs.existsSync(dir)){
  console.log('Logs folder created');
  fs.mkdirSync(dir);
}

console.log(`${process.env.NODE_ENV.includes('production') ? 'Running Production Env' : 'Running Development Env'}`);
require('./idle-rpg/v2/DiscordBot');
const { errorLog } = require('./idle-rpg/utils/logger');

process.on('unhandledRejection', (err) => {
  console.log(err);
  errorLog.error({ err });
});
