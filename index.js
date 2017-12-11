require('dotenv').config();

const express = require('express');

const { discordBot, hook } = require('./bots/discord');
// const { twitchBot } = require('./bots/twitch');
const Game = require('./game/Game');
const { randomInt } = require('./utils/helper');
const moment = require('moment');

const app = express();
const tickInMinutes = 2;
let onlinePlayerList = [];

// Preperation for the website that allows others to let this bot join their discord!
app.get('/', (req, res) => res.send('Idle-RPG Bot!'));
app.listen(process.env.PORT, () => console.log(`Idle RPG web listening on port ${process.env.PORT}!`));

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const heartBeat = () => {
  const discordOfflinePlayers = discordBot.users
    .filter(player => player.presence.status === 'offline' && !player.bot)
    .map((player) => {
      return {
        name: player.username,
        discordId: player.id
      };
    });

  const discordOnlinePlayers = discordBot.users
    .filter(player => player.presence.status === 'online' && !player.bot
      || player.presence.status === 'idle' && !player.bot)
    .map((player) => {
      return {
        name: player.username,
        discordId: player.id
      };
    });

  onlinePlayerList = onlinePlayerList.concat(discordOnlinePlayers)
    .filter((player, index, array) =>
      index === array.findIndex(p => (
        p.discordId === player.discordId && !discordOfflinePlayers.includes(p.discordId)
      )));

  const minTimer = 120000 + (60000 * ((onlinePlayerList.length + 1) / 4));
  const maxTimer = 300000 + (60000 * ((onlinePlayerList.length + 1) / 4));
  console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);
  console.log(`TEST RANDOM INT: ${(randomInt(minTimer, maxTimer) / 1000) / 60}`);

  onlinePlayerList.forEach((player) => {
    if (!player.timer) {
      console.log(`${player.name} setting timer ${moment()}`);
      player.timer = setTimeout(() => {
        Game.selectEvent(player, onlinePlayerList, hook, 'twitchBot');
        delete player.timer;
      }, randomInt(minTimer, maxTimer));
    }
  });
};

setInterval(heartBeat, 60000 * tickInMinutes);
