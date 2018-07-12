const DiscordJS = require('discord.js');
const fs = require('fs');
const Game = require('../game/Game');
const Helper = require('../utils/Helper');
const Discord = require('./Base/Discord');
const { minimalTimer, maximumTimer, botLoginToken } = require('../../settings');

class DiscordBot {

  // TODO remove discord.js from constructor and change to utilize shards
  constructor() {
    this.bot = new DiscordJS.Client();
    this.discord = new Discord(this.bot);
    this.helper = new Helper();
    this.game = new Game(this.helper);
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
      const interval = process.env.NODE_ENV.includes('production') ? this.tickInMinutes : 1;
      setInterval(this.heartBeat, 60000 * interval);
    });
    this.bot.on('guildCreate', (guild) => {
      this.discord.manageGuildChannels(guild);
    });
  }

  heartBeat() {
    this.bot.guilds.forEach((guild) => {
      const guildOnlineMembers = this.discord.getOnlinePlayers(guild);
      if (guildOnlineMembers.size >= 50) {
        console.log(`MinTimer: ${(this.minTimer / 1000) / 60} - MaxTimer: ${(this.maxTimer / 1000) / 60}`);
        this.minTimer = ((Number(minimalTimer) + (Math.floor(guildOnlineMembers.size / 50))) * 1000) * 60;
        this.maxTimer = ((Number(maximumTimer) + (Math.floor(guildOnlineMembers.size / 50))) * 1000) * 60;
      }
      console.log(guildOnlineMembers);
      guildOnlineMembers.forEach((player, index) => {
        if (!player.timer) {
          const playerTimer = this.helper.randomBetween(this.minTimer, this.maxTimer);
          player.timer = setTimeout(async () => {
            const eventResult = await this.game.selectEvent(player, guildOnlineMembers);
            delete player.timer;
            return this.discord.sendMessage(guild, eventResult);
          }, playerTimer);
        }
        if (process.env.NODE_ENV.includes('production') && discordOnlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) === -1) {
          onlinePlayerList.splice(index, 1);
        }
      });
    });
  }

}
module.exports = new DiscordBot();
