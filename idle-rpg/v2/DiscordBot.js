const DiscordJS = require('discord.js');
const fs = require('fs');
const Game = require('../v2/idle-rpg/Game');
const Helper = require('../utils/Helper');
const Discord = require('./Base/Discord');
const Antispam = require('../bots/modules/Antispam');
const CommandParser = require('../bots/utils/CommandParser');
const { minimalTimer, maximumTimer, botLoginToken } = require('../../settings');

class DiscordBot {

  // TODO remove discord.js from constructor and change to utilize shards
  constructor() {
    this.bot = new DiscordJS.Client();
    this.discord = new Discord(this.bot);
    this.Helper = new Helper();
    this.Game = new Game(this.Helper);
    this.CommandParser = new CommandParser({
      Game: this.Game,
      Helper: this.Helper,
      Bot: this.bot
    });
    this.loadEventListeners();
    this.bot.login(botLoginToken);
    this.minTimer = (minimalTimer * 1000) * 60;
    this.maxTimer = (maximumTimer * 1000) * 60;
    this.powerHourWarnTime = '00 30 13 * * 0-6'; // 1pm every day
    this.dailyLotteryTime = '00 00 10 * * 0-6';
    this.blizzardRandomTime = '00 00 9 * * 0-6';
    this.leadboardUpdateTime = '00 */10 * * * 0-6';
    this.timeZone = 'America/Los_Angeles';
    this.tickInMinutes = 2;
  }

  loadEventListeners() {
    this.bot.on('error', err => console.log(err));
    this.bot.once('ready', () => {
      // this.bot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'));
      this.bot.user.setActivity('Idle-RPG Game Master');
      this.bot.user.setStatus('idle');
      this.discord.loadGuilds();
      this.loadHeartBeat();
    });
    this.bot.on('message', async (message) => {
      if (message.author.id === this.bot.user.id) {
        return;
      }

      if (message.content.startsWith('!cs') || message.content.startsWith('!castspell')) {
        await Antispam.logAuthor(message.author.id);
        await Antispam.logMessage(message.author.id, message.content);
        const skip = await Antispam.checkMessageInterval(message);
        if (skip) {
          infoLog.info(`Spam detected by ${message.author.username}.`);
          return;
        }
      }

      if (message.content.includes('(╯°□°）╯︵ ┻━┻')) {
        return message.reply('┬─┬ノ(ಠ_ಠノ)');
      }

      if (message.content.includes('¯\_(ツ)_/¯')) {
        return message.reply('¯\_(ツ)_/¯');
      }

      // if (process.env.VIRUS_TOTAL_APIKEY && message.attachments && message.attachments.size > 0) {
      //   const { url } = message.attachments.array()[0];

      //   return VirusTotal.scanUrl(url)
      //     .then(VirusTotal.retrieveReport)
      //     .then((reportResults) => {
      //       if (reportResults.positives > 0) {
      //         message.delete();
      //         message.reply('This attachment has been flagged, if you believe this was a false-positive please contact one of the Admins.');
      //       }
      //     });
      // }

      return this.CommandParser.parseUserCommand(message);
    });
    this.bot.on('guildCreate', (guild) => {
      this.discord.manageGuildChannels(guild);
    });
  }

  loadHeartBeat() {
    const interval = process.env.NODE_ENV.includes('production') ? this.tickInMinutes : 1;
    setInterval(() => {
      this.bot.guilds.forEach((guild) => {
        const guildOnlineMembers = this.discord.getOnlinePlayers(guild);
        console.log(`MinTimer: ${(this.minTimer / 1000) / 60} - MaxTimer: ${(this.maxTimer / 1000) / 60}`);
        if (guildOnlineMembers.size >= 50) {
          this.minTimer = ((Number(minimalTimer) + (Math.floor(guildOnlineMembers.size / 50))) * 1000) * 60;
          this.maxTimer = ((Number(maximumTimer) + (Math.floor(guildOnlineMembers.size / 50))) * 1000) * 60;
        }
        guildOnlineMembers.forEach((player) => {
          if (!player.timer) {
            const playerTimer = this.Helper.randomBetween(this.minTimer, this.maxTimer);
            player.timer = setTimeout(async () => {
              const eventResult = await this.Game.activateEvent(player, guildOnlineMembers);
              delete player.timer;
              return this.discord.sendMessage(guild, eventResult);
            }, playerTimer);
          }
        });
      });
    }, 60000 * interval);
  }

}
module.exports = new DiscordBot();
