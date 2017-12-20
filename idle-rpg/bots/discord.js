const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const { randomBetween } = require('../utils/helper');
const logger = require('../utils/logger');
const Game = require('../game/Game');
const { CronJob } = require('cron');

const discordBot = new Discord.Client();
const actionHook = new Discord.WebhookClient(
  process.env.DISCORD_ACTION_WEBHOOK_ID,
  process.env.DISCORD_ACTION_WEBHOOK_TOKEN,
);

const movementHook = new Discord.WebhookClient(
  process.env.DISCORD_MOVEMENT_WEBHOOK_ID,
  process.env.DISCORD_MOVEMENT_WEBHOOK_TOKEN
);

const hook = {
  actionHook,
  movementHook
};

const game = new Game(hook);

const powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
const powerHourBeginTime = '00 00 14 * * 0-6'; // 2pm every day
const powerHourEndTime = '00 00 15 * * 0-6'; // 3pm every day
const timeZone = 'America/Los_Angeles';

const minTimer = (process.env.MIN_TIMER * 1000) * 60;
const maxTimer = (process.env.MAX_TIMER * 1000) * 60;

const tickInMinutes = 2;
let onlinePlayerList = [];

discordBot.on('ready', () => {
  discordBot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'), (err) => {
    if (err) logger.error(err);
  });
  discordBot.user.setGame('Idle-RPG Game Master');
  discordBot.user.setStatus('idle');
  console.log('Idle RPG has been loaded!');
});

discordBot.on('message', (message) => {
  if (message.content.includes('(╯°□°）╯︵ ┻━┻')) {
    message.reply('┬─┬ノ(ಠ_ಠノ)');
  }

  CommandParser.parseUserCommand(game, discordBot, hook, message);
});

discordBot.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('id', process.env.DISCORD_RPG_WELCOME_CHANNEL_ID);
  if (!channel) {
    return;
  }

  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! If you have any questions check the <#${process.env.DISCORD_RPQ_FAQ_CHANNEL}> or PM me !help.`);
});

discordBot.login(process.env.DISCORD_BOT_LOGIN_TOKEN);
console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);

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

  onlinePlayerList.forEach((player) => {
    if (!player.timer) {
      const playerTimer = randomBetween(minTimer, maxTimer);
      player.timer = setTimeout(() => {
        game.selectEvent(player, onlinePlayerList, 'twitchBot');
        delete player.timer;
      }, playerTimer);
    }
  });
};

setInterval(heartBeat, 60000 * tickInMinutes);

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

module.exports = discordBot;
