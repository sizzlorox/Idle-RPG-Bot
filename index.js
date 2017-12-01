require('dotenv').config();

const logger = require('./utils/logger');
const Discord = require('discord.js');
const { eventEmitter } = require('./utils/cron');
const Game = require('./game/Game');
const helper = require('./utils/helper');
const fs = require('fs');

const bot = new Discord.Client();
const hook = new Discord.WebhookClient(
  process.env.DISCORD_WEBHOOK_ID,
  process.env.DISCORD_WEBHOOK_TOKEN,
);

const botOperator = process.env.DISCORD_BOT_OPERATOR_ID;
const rpgChannel = process.env.DISCORD_RPG_CHANNEL_ID;

bot.on('ready', () => {
  bot.user.setAvatar(fs.readFileSync('./res/hal.jpg'), (err) => {
    if (err) throw err;
  });
  bot.user.setGame('Idle-RPG Game Master');
  bot.user.setStatus('idle');
  logger.info('Idle RPG has been loaded!');
});

bot.on('message', (message) => {
  if (message.channel.id !== rpgChannel) {
    return;
  }

  if (message.content === '!submode' && message.author.id === botOperator) {
    /*
    Under development, trying to get a list of subscribers
    const onlineUsers = bot.users.filter(player => player.presence.status === 'online' && !player.bot);
    console.log(bot.users.array()[5].role);
    */
  }

  if (message.content === '!help') {
    const helpMsg = `!me - Sends a PM with your characters stats.
    !onlineUsers - Displays users that are currently in idle-rpg.
    !check <Player Name> - Sends a PM with the players stats. (without < > and case-senstive).`;
    message.author.send(helpMsg);
  }

  if (message.content === '!me') {
    Game.playerStats(message.author)
      .then((playerStats) => {
        const stats = helper.generateStatsString(playerStats);
        message.author.send(stats);
      });
  }

  if (message.content.startsWith('!check ')) {
    const checkPlayer = message.content.split(' ');
    const playerObj = bot.users.filter(player => player.username === checkPlayer[1] && !player.bot);
    if (playerObj.size === 0) {
      message.author.send(`${checkPlayer[1]} was not found!`);
      return;
    }

    Game.playerStats(playerObj.array()[0])
      .then((playerStats) => {
        const stats = helper.generateStatsString(playerStats);
        message.author.send(stats.replace('Here are your stats!', `Here is ${checkPlayer[1]}s stats!`));
      });
  }

});

bot.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('name', 'member-log');
  if (!channel) {
    return;
  }
  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! Please type into #idle-rpg channel !help for a list of commands or DM me!`);
});

eventEmitter.on('TICK', () => {
  const onlinePlayers = bot.users.filter(player => player.presence.status === 'online' && !player.bot || player.presence.status === 'idle' && !player.bot);
  Game.selectEvent(onlinePlayers, hook);
});

bot.login(process.env.DISCORD_BOT_LOGIN_TOKEN);
