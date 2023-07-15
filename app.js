require('dotenv').config();
const fs = require('fs');
const dir = './logs';
const express = require('express');
const app = express();

if (!fs.existsSync(dir)){
  console.log('Logs folder created');
  fs.mkdirSync(dir);
}

console.log(`${process.env.NODE_ENV.includes('production') ? 'Running Production Env' : 'Running Development Env'}`);
const { errorLog } = require('./idle-rpg/utils/logger');

app.use(require('./web/routes'));

process.on('unhandledRejection', (err) => {
  console.log(err);
  errorLog.error({ err });
});
