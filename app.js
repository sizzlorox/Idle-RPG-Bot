require('dotenv').config();
const fs = require('fs');
const dir = './logs';
const express = require('express');
const cors = require('cors');
const app = express();

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

if (!fs.existsSync(dir)){
  console.log('Logs folder created');
  fs.mkdirSync(dir);
}

console.log(`${process.env.NODE_ENV.includes('production') ? 'Running Production Env' : 'Running Development Env'}`);
const { errorLog } = require('./idle-rpg/utils/logger');

app.use(cors(corsOptions));
app.use(require('./api/routes'));
app.use(express.static('web/build'));

app.listen(process.env.PORT, () => {
  console.log('API Server up on port: ', process.env.PORT);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  errorLog.error({ err });
});
