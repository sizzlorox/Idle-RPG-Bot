require('dotenv').config();

const { discordBot, hook } = require('./bots/discord');
const { twitchBot, getViewerList } = require('./bots/twitch');
const { eventEmitter } = require('./utils/cron');
const Game = require('./game/Game');
const { randomInt } = require('./utils/Helper');

let onlinePlayerList = [];

eventEmitter.on('TICK', () => {
  const discordOfflinePlayers = discordBot.users
    .filter(player => player.presence.status !== 'online' && !player.bot || player.presence.status !== 'idle' && !player.bot)
    .map((player) => {
      return {
        name: player.username,
        discordId: player.id
      };
    });

  const discordOnlinePlayers = discordBot.users
    .filter(player => player.presence.status === 'online' && !player.bot && !discordOfflinePlayers.includes(player.id)
      || player.presence.status === 'idle' && !player.bot && !discordOfflinePlayers.includes(player.id))
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
      )));

  onlinePlayerList.forEach((player) => {
    if (!player.timer) {
      player.timer = setTimeout(() => {
        Game.selectEvent(player, discordOnlinePlayers, hook, twitchBot);
        delete player.timer;
      }, randomInt(120000, 300000));
    }
  });

  /*
    const twitchOnlinePlayers = getViewerList()
      .then(viewers => console.log(viewers.chatters))
      .catch(err => console.log(err));
  */
});
