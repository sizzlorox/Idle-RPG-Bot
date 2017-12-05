require('dotenv').config();

const { discordBot, hook } = require('./bots/discord');
const { twitchBot, getViewerList } = require('./bots/twitch');
const { eventEmitter } = require('./utils/cron');
const Game = require('./game/Game');

eventEmitter.on('TICK', () => {
  const discordOnlinePlayers = discordBot.users.filter(player => player.presence.status === 'online' && !player.bot || player.presence.status === 'idle' && !player.bot);
  /*
    const twitchOnlinePlayers = getViewerList()
      .then(viewers => console.log(viewers.chatters))
      .catch(err => console.log(err));
  */
  Game.selectEvent(discordOnlinePlayers, hook, twitchBot);
});
