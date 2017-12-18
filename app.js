require('dotenv').config();

const express = require('express');
const router = require('./routes/index');

const { discordBot, hook } = require('./idle-rpg/bots/discord');
// const { twitchBot } = require('./bots/twitch');
const Game = require('./idle-rpg/game/Game');
const { randomBetween } = require('./idle-rpg/utils/helper');
const moment = require('moment');
const { CronJob } = require('cron');

const game = new Game(hook);

const minTimer = (process.env.MIN_TIMER * 1000) * 60;
const maxTimer = (process.env.MAX_TIMER * 1000) * 60;

const powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
const powerHourBeginTime = '00 00 14 * * 0-6'; // 2pm every day
const powerHourEndTime = '00 00 15 * * 0-6'; // 3pm every day
const timeZone = 'America/Los_Angeles';

new CronJob({
  cronTime: powerHourWarnTime,
  onTick: () => {
    game.powerHourWarn();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

new CronJob({
  cronTime: powerHourBeginTime,
  onTick: () => {
    game.powerHourBegin();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

new CronJob({
  cronTime: powerHourEndTime,
  onTick: () => {
    game.powerHourEnd();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

const app = express();
const { PORT } = process.env;
const tickInMinutes = 2;
let onlinePlayerList = [];

// Preperation for the website that allows others to let this bot join their discord!
app.set('views', `${__dirname}/public/views`);
app.set('view engine', 'jade');
app.use('/', router);
app.listen(PORT, () => console.log(`Idle RPG web listening on port ${PORT}!`));

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const heartBeat = () => {
  const discordUsers = discordBot.users;
  const discordOfflinePlayers = discordUsers
    .filter(player => player.presence.status === 'offline' && !player.bot)
    .map((player) => {
      return {
        name: player.username,
        discordId: player.id
      };
    });

  const discordOnlinePlayers = discordUsers
    .filter(player => player.presence.status === 'online' && !player.bot
      || player.presence.status === 'idle' && !player.bot
      || player.presence.status === 'dnd' && !player.bot)
    .map((player) => {
      return {
        name: player.username,
        discordId: player.id
      };
    });

  onlinePlayerList = onlinePlayerList.concat(discordOnlinePlayers)
    .filter((player, index, array) =>
      index === array.findIndex(p => (
        p.discordId === player.discordId
      ) && discordOfflinePlayers.findIndex(offlinePlayer => (offlinePlayer.discordId === player.discordId)) === -1));

  console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);
  console.log(`TEST RANDOM INT: ${(randomBetween(minTimer, maxTimer) / 1000) / 60}`);

  onlinePlayerList.forEach((player) => {
    if (!player.timer) {
      const playerTimer = randomBetween(minTimer, maxTimer);
      console.log(`${player.name} setting timer ${(playerTimer / 1000) / 60} ${moment()}`);
      player.timer = setTimeout(() => {
        game.selectEvent(player, onlinePlayerList, 'twitchBot');
        delete player.timer;
      }, playerTimer);
    }
  });
};

setInterval(heartBeat, 60000 * tickInMinutes);
