require('dotenv').config();

const express = require('express');
const router = require('./web/routes/index');

const app = express();
const { errorLog } = require('./idle-rpg/utils/logger');
const { PORT } = process.env;

console.log(`${process.env.NODE_ENV.includes('production') ? 'Running Production Env' : 'Running Development Env'}`);

// Preperation for the website that allows others to let this bot join their discord!
app.set('views', `${__dirname}/views`);
app.set('view engine', 'jade');
app.use('/', router);
app.listen(PORT, () => console.log(`Idle RPG web listening on port ${PORT}!`));

process.on('unhandledRejection', (reason, p) => {
  errorLog.error({
    promise: p,
    reason
  });
});
