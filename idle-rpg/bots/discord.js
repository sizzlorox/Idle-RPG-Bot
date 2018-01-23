const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const { randomBetween } = require('../utils/helper');
const { welcomeLog } = require('../utils/logger');
const { mockPlayers } = require('../utils/enumHelper');
const Game = require('../game/Game');
const VirusTotal = require('../bots/modules/VirusTotal');
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

const timeZone = 'America/Los_Angeles';

const minTimer = (minimalTimer * 1000) * 60;
const maxTimer = (maximumTimer * 1000) * 60;

const tickInMinutes = 2;
let onlinePlayerList = [];

discordBot.on('ready', () => {
  discordBot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'));
  discordBot.user.setGame('Idle-RPG Game Master');
  discordBot.user.setStatus('idle');
  console.log('Idle RPG has been loaded!');
});

discordBot.on('message', (message) => {
  if (message.content.includes('(╯°□°）╯︵ ┻━┻')) {
    message.reply('┬─┬ノ(ಠ_ಠノ)');
  }

  if (message.attachments && message.attachments.size > 0) {
    const attachment = message.attachments.array()[0];
    const url = attachment.url;

    return VirusTotal.scanUrl(url)
      .then(VirusTotal.retrieveReport)
      .then((reportResults) => {
        console.log(reportResults.verbose_msg);
        message.reply(`VirusTotal scan completed: ${reportResults.positives}/${reportResults.total}
${reportResults.permalink}`);
        if (reportResults.positives > 0) {
          message.delete();
          message.reply('This attachment has been flagged, if you believe this was a false-positive please contact one of the Admins.');
        }
      });
  }

  CommandParser.parseUserCommand(game, discordBot, hook, message);
});

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

const heartBeat = () => {
  const discordUsers = discordBot.users;
  if (process.env.NODE_ENV.includes('production')) {

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
        game.selectEvent(discordBot, player, onlinePlayerList, 'twitchBot');
        delete player.timer;
      }, playerTimer);
    }
  });
};

setInterval(heartBeat, 60000 * tickInMinutes);

new CronJob({
  cronTime: powerHourWarnTime,
  onTick: () => {
    game.powerHourBegin();
  },
  start: false,
  timeZone,
  runOnInit: false
}).start();

module.exports = discordBot;
