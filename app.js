require('dotenv').config();

const express = require('express');
const router = require('./routes/index');

const app = express();
const { PORT } = process.env;

// Preperation for the website that allows others to let this bot join their discord!
app.set('views', `${__dirname}/views`);
app.set('view engine', 'jade');
app.use('/', router);
app.listen(PORT, () => console.log(`Idle RPG web listening on port ${PORT}!`));

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
