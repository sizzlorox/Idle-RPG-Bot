const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const { randomBetween } = require('../utils/helper');
const logger = require('../utils/logger');
const { mockPlayers } = require('../utils/enumHelper');
const Game = require('../game/Game');
const { CronJob } = require('cron');
const {
  actionWebHookId,
  actionWebHookToken,
  moveWebHookId,
  moveWebHookToken,
  welcomeChannelId,
  faqChannelId,
  botLoginToken,
  minimalTimer,
  maximumTimer
} = require('../../settings');

const webHookOptions = {
  apiRequestMethod: 'sequential',
  shardId: 0,
  shardCount: 0,
  messageCacheMaxSize: 200,
  messageCacheLifetime: 0,
  messageSweepInterval: 0,
  fetchAllMembers: false,
  disableEveryone: false,
  sync: false,
  restWsBridgeTimeout: 5000,
  restTimeOffset: 500
};

const discordBot = new Discord.Client();
const actionHook = new Discord.WebhookClient(
  actionWebHookId,
  actionWebHookToken,
  webHookOptions
);

const movementHook = new Discord.WebhookClient(
  moveWebHookId,
  moveWebHookToken,
  webHookOptions
);

const hook = {
  actionHook,
  movementHook
};

const game = new Game(hook);

const powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
const powerHourBeginTime = '00 00 14 * * 0-6'; // 2pm every day
const powerHourEndTime = '00 00 15 * * 0-6'; // 3pm every day

// Christmas Event times
const christmasEventPre = '00 00 4 14 11 *';
const christmasEventStart = '00 00 13 24 11 *';
const christmasEventEnd = '00 00 13 6 1 *';
const timeZone = 'America/Los_Angeles';

const minTimer = (minimalTimer * 1000) * 60;
const maxTimer = (maximumTimer * 1000) * 60;

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
  const channel = member.guild.channels.find('id', welcomeChannelId);
  if (!channel) {
    return;
  }

  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! If you have any questions check the <#${faqChannelId}> or PM me !help.`);
  logger.log('welcome', member);
});

discordBot.login(botLoginToken);
console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);

const heartBeat = () => {
  if (process.env.NODE_ENV.includes('production')) {
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
  } else {
    onlinePlayerList = onlinePlayerList.push(mockPlayers);
  }

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

/**
 * EVENT CRONS
 */
new CronJob({
  cronTime: christmasEventPre,
  onTick: () => {
    game.sendChristmasPreEventMessage();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

new CronJob({
  cronTime: christmasEventStart,
  onTick: () => {
    game.updateChristmasEvent(true);
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

new CronJob({
  cronTime: christmasEventEnd,
  onTick: () => {
    game.updateChristmasEvent(false);
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

module.exports = discordBot;
