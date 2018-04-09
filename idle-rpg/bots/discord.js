const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const util = require('util');
const { welcomeLog, errorLog, infoLog } = require('../utils/logger');
const { mockPlayers } = require('../utils/enumHelper');
const Game = require('../game/Game');
const Helper = require('../utils/Helper');
const VirusTotal = require('../bots/modules/VirusTotal');
const { CronJob } = require('cron');
const {
  actionWebHookId,
  actionWebHookToken,
  moveWebHookId,
  moveWebHookToken,
  welcomeChannelId,
  faqChannelId,
  streamChannelId,
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

const helper = new Helper();
const commandParser = new CommandParser(helper);

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
  movementHook,
  discordBot
};

const game = new Game(hook, helper);

const powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
const dailyLotteryTime = '00 00 10 * * 0-6';
const timeZone = 'America/Los_Angeles';
let minTimer = (minimalTimer * 1000) * 60;
let maxTimer = (maximumTimer * 1000) * 60;
const tickInMinutes = 2;
let onlinePlayerList = [];
let guildName;

console.log(`Current ENV: ${process.env.NODE_ENV}`);
if (!process.env.NODE_ENV.includes('production')) {
  console.log('Mock Players loaded');
  onlinePlayerList = mockPlayers;
  guildName = 'Idle-RPG-TEST';
} else {
  onlinePlayerList.push({
    name: 'Pyddur, God of Beer',
    discordId: 'pyddur'
  });
  guildName = 'Idle-RPG';
}

const processDetails = () => {
  let memoryUsage = util.inspect(process.memoryUsage());
  memoryUsage = JSON.parse(memoryUsage.replace('rss', '"rss"').replace('heapTotal', '"heapTotal"').replace('heapUsed', '"heapUsed"').replace('external', '"external"'));

  console.log('------------');
  console.log(`\n\nHeap Usage:\n  RSS: ${(memoryUsage.rss / 1048576).toFixed(2)}MB\n  HeapTotal: ${(memoryUsage.heapTotal / 1048576).toFixed(2)}MB\n  HeapUsed: ${(memoryUsage.heapUsed / 1048576).toFixed(2)}MB`);
  console.log(`Current Up Time: ${helper.secondsToTimeFormat(Math.floor(process.uptime()))}\n\n`);
  console.log('------------');
};

const interval = process.env.NODE_ENV.includes('production') ? tickInMinutes : 1;
const heartBeat = () => {
  if (process.env.NODE_ENV.includes('production')) {
    const discordUsers = discordBot.guilds.size > 0
      ? discordBot.guilds.find('name', guildName).members
      : undefined;

    if (discordUsers) {
      const discordOfflinePlayers = discordUsers
        .filter(player => player.presence.status === 'offline' && !player.user.bot)
        .map((player) => {
          return {
            name: player.nickname ? player.nickname : player.displayName,
            discordId: player.id
          };
        });

      const discordOnlinePlayers = discordUsers
        .filter(player => player.presence.status === 'online' && !player.user.bot
          || player.presence.status === 'idle' && !player.user.bot
          || player.presence.status === 'dnd' && !player.user.bot)
        .map((player) => {
          return {
            name: player.nickname ? player.nickname : player.displayName,
            discordId: player.id
          };
        });

      onlinePlayerList = onlinePlayerList.concat(discordOnlinePlayers)
        .filter((player, index, array) =>
          index === array.findIndex(p => (
            p.discordId === player.discordId
          ) && discordOfflinePlayers.findIndex(offlinePlayer => (offlinePlayer.discordId === player.discordId)) === -1));
    }
  }

  if (onlinePlayerList.length >= 50) {
    console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);
    minTimer = ((Number(minimalTimer) + (Math.floor(onlinePlayerList.length / 50))) * 1000) * 60;
    maxTimer = ((Number(maximumTimer) + (Math.floor(onlinePlayerList.length / 50))) * 1000) * 60;
  }

  onlinePlayerList.forEach((player) => {
    if (!player.timer) {
      const playerTimer = helper.randomBetween(minTimer, maxTimer);
      player.timer = setTimeout(() => {
        game.selectEvent(discordBot, player, onlinePlayerList, 'twitchBot');
        delete player.timer;
      }, playerTimer);
    }
  });

  processDetails();
};

discordBot.on('ready', () => {
  discordBot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'));
  discordBot.user.setActivity('Idle-RPG Game Master');
  discordBot.user.setStatus('idle');
  console.log('Idle RPG has been loaded!');

  console.log(`Interval delay: ${interval} minute(s)`);
  setInterval(heartBeat, 60000 * interval);
});

discordBot.on('error', (err) => {
  console.log(err);
  errorLog.error(err);
});

discordBot.on('message', (message) => {
  if (message.content.includes('(╯°□°）╯︵ ┻━┻')) {
    return message.reply('┬─┬ノ(ಠ_ಠノ)');
  }

  if (message.attachments && message.attachments.size > 0) {
    const { url } = message.attachments.array()[0];

    return VirusTotal.scanUrl(url)
      .then(VirusTotal.retrieveReport)
      .then((reportResults) => {
        infoLog.info(reportResults);
        if (reportResults.positives > 0) {
          message.delete();
          message.reply('This attachment has been flagged, if you believe this was a false-positive please contact one of the Admins.');
        }
      });
  }

  commandParser.parseUserCommand(game, discordBot, hook, message);
});

if (streamChannelId && process.env.NODE_ENV.includes('production')) {
  discordBot.on('presenceUpdate', (oldMember, newMember) => {
    if (newMember.presence.game && !oldMember.presence.game) {
      if (newMember.presence.game.streaming && !oldMember.presence.game) {
        newMember.guild.channels.find('id', streamChannelId).send(`${newMember.displayName} has started streaming \`${newMember.presence.game.name}\`! Go check the stream out if you're interested!\n<${newMember.presence.game.url}>`);
      }
    }
  });
}

discordBot.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('id', welcomeChannelId);
  if (!channel) {
    return;
  }

  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! If you have any questions check the <#${faqChannelId}> or PM me !help.`);
  welcomeLog.welcome(member);
});

discordBot.login(botLoginToken);
console.log(`MinTimer: ${(minTimer / 1000) / 60} - MaxTimer: ${(maxTimer / 1000) / 60}`);

new CronJob({
  cronTime: powerHourWarnTime,
  onTick: () => {
    game.powerHourBegin();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

new CronJob({
  cronTime: dailyLotteryTime,
  onTick: () => {
    game.dailyLottery(discordBot, guildName);
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

module.exports = discordBot;
