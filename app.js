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

app.use(require('./api/routes'));

app.listen(process.env.PORT, () => {
  console.log('API Server up on port: ', process.env.PORT);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  errorLog.error({ err });
});
