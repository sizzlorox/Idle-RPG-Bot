const { Client, GatewayIntentBits, Partials, ActivityType, ChannelType } = require('discord.js');
const fs = require('fs');

const Game = require('../game/Game');
const CommandHandler = require('./CommandHandler');
const PresenceTracker = require('./PresenceTracker');
const GuildSetup = require('../channels/GuildSetup');
const MessageRouter = require('../channels/MessageRouter');
const CronManager = require('../crons/CronManager');
const Antispam = require('../../bots/modules/Antispam');
const enumHelper = require('../../utils/enumHelper');
const { minimalTimer, maximumTimer, botLoginToken, guildID } = require('../../../settings');
const { errorLog, welcomeLog, infoLog } = require('../../utils/logger');
const { randomBetween } = require('../utils/helpers');
const { secondsToTimeFormat } = require('../utils/helpers');

class DiscordBot {

  constructor() {
    this.bot = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });
    this.game = new Game();
    this.commandHandler = new CommandHandler({ game: this.game, bot: this.bot });
    this.presenceTracker = new PresenceTracker();
    this.guildSetup = new GuildSetup(this.bot);
    this.messageRouter = new MessageRouter(this.bot);
    this.crons = new CronManager({ bot: this.bot, game: this.game });
    this.minTimer = (minimalTimer * 1000) * 60;
    this.maxTimer = (maximumTimer * 1000) * 60;
    this.tickInMinutes = 2;
    this.eventCount = 0;
    this._loadEventListeners();
    this.bot.login(botLoginToken);
  }

  _loadEventListeners() {
    this.bot.on('error', err => errorLog.error(err));

    this.bot.once('clientReady', async () => {
      if (!this.bot.user.avatarURL()) {
        this.bot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'));
      }
      this.bot.user.setPresence({ status: 'idle' });
      this.guildSetup.loadGuilds();
      this._loadHeartBeat();
      this.crons.loadCrons();

      for (const guild of this.bot.guilds.cache.values()) {
        await this.game.loadGuildConfig(guild.id);
        await guild.members.fetch();
        guild.members.cache
          .filter(member => !member.user.bot && (member.presence?.status ?? 'offline') !== 'offline' && this.game.db.shouldBeInList(member.id, member.guild.id))
          .forEach(member => this.presenceTracker.add({
            name: member.nickname ? member.nickname : member.displayName,
            discordId: member.id,
            guildId: guild.id,
          }));
      }
      console.log('Reset all personal multipliers');
    });

    this.bot.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      if (message.guild && message.guild.id === guildID && message.content.includes('┻━┻')) {
        return message.reply(' ┬─┬ノ(ಠ\\_ಠノ)'.repeat(message.content.split('┻━┻').length - 1));
      }

      if (message.channel.parent && message.channel.parent.name.toLowerCase() !== 'idle-rpg') return;

      if (message.content.startsWith('!cs') || message.content.startsWith('!castspell')) {
        await Antispam.logAuthor(message.author.id);
        await Antispam.logMessage(message.author.id, message.content);
        const skip = Antispam.checkMessageInterval(message);
        if (skip) {
          infoLog.info(`Spam detected by ${message.author.username}.`);
          return;
        }
      }

      return this.commandHandler.parseUserCommand(message);
    });

    this.bot.on('guildCreate', async (guild) => {
      await this.game.loadGuildConfig(guild.id);
      await this.guildSetup.manageGuildChannels(guild);
      await guild.members.fetch();
      guild.members.cache
        .filter(member => !member.user.bot && (member.presence?.status ?? 'offline') !== 'offline')
        .forEach(member => this.presenceTracker.add({
          name: member.nickname ? member.nickname : member.displayName,
          discordId: member.id,
          guildId: guild.id,
        }));
    });

    this.bot.on('guildDelete', async (guild) => {
      guild.members.cache.forEach(member => this.presenceTracker.remove(member.id, member.guild.id));
    });

    this.bot.on('guildUnavailable', async (guild) => {
      guild.members.cache.forEach(member => this.presenceTracker.remove(member.id, member.guild.id));
    });

    this.bot.on('presenceUpdate', async (oldM, newM) => {
      const newMember = newM && newM.member;
      if (!newMember || newMember.user.bot) return;
      if ((newM?.status ?? 'offline') !== 'offline') {
        // Skip DB check if already tracked — add() is idempotent so no double-tracking
        if (!this.presenceTracker.has(newMember.id, newMember.guild.id)) {
          if (await this.game.db.shouldBeInList(newMember.id, newMember.guild.id)) {
            this.presenceTracker.add({
              name: newMember.nickname ? newMember.nickname : newMember.displayName,
              discordId: newMember.id,
              guildId: newMember.guild.id,
            });
          }
        }
      } else {
        // remove() is a no-op if the player isn't tracked — no DB check needed
        this.presenceTracker.remove(newMember.id, newMember.guild.id);
      }
    });

    this.bot.on('guildMemberAdd', async (member) => {
      if ((member.presence?.status ?? 'offline') !== 'offline') {
        this.presenceTracker.add({
          name: member.nickname ? member.nickname : member.displayName,
          discordId: member.id,
          guildId: member.guild.id,
        });
      }
      if (member.guild.id !== guildID) return;
      const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'newcomers' && channel.type === ChannelType.GuildText);
      if (welcomeChannel) {
        if (/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi.test(member.displayName)) return;
        const faqChannel = member.guild.channels.cache.find(channel => channel.name === 'faq' && channel.type === ChannelType.GuildText);
        welcomeChannel.send(`Welcome ${member}! This server has an Idle-RPG bot! If you have any questions check <#${faqChannel ? faqChannel.id : 'faq'}> or PM me !help.`);
        welcomeLog.info(member);
      }
    });

    this.bot.on('guildMemberRemove', (member) => {
      this.presenceTracker.remove(member.id, member.guild.id);
    });

    this.bot.on('rateLimit', infoLog.info);
  }

  _loadHeartBeat() {
    const interval = process.env.NODE_ENV.includes('production') ? this.tickInMinutes : 1;

    setInterval(() => {
      this._processDetails();
      this.bot.guilds.cache.forEach(async (guild) => {
        let guildMinTimer = this.minTimer;
        let guildMaxTimer = this.maxTimer;

        if (process.env.NODE_ENV.includes('production')) {
          const guildOnlineMembers = this.presenceTracker.getAll()
            .filter(p => p.guildId === guild.id);

          if (guildOnlineMembers.length >= 50) {
            guildMinTimer = ((Number(minimalTimer) + Math.floor(guildOnlineMembers.length / 50)) * 1000) * 60;
            guildMaxTimer = ((Number(maximumTimer) + Math.floor(guildOnlineMembers.length / 50)) * 1000) * 60;
          }

          guildOnlineMembers
            .filter(player => !player.timer)
            .forEach((player) => {
              const playerTimer = randomBetween(guildMinTimer, guildMaxTimer);
              player.timer = setTimeout(async () => {
                if (!this.presenceTracker.has(player.discordId, player.guildId)) {
                  delete player.timer;
                  return;
                }
                const eventResult = await this.game.activateEvent(guild.id, player, guildOnlineMembers);
                this.eventCount++;
                delete player.timer;
                return this.messageRouter.sendMessage(guild, eventResult);
              }, playerTimer);
            });
        } else {
          const realOnlineMembers = guild.members.cache
            .filter(member => !member.user.bot && (member.presence?.status ?? 'offline') !== 'offline')
            .map(member => ({
              name: member.nickname ? member.nickname : member.displayName,
              discordId: member.id,
              guildId: guild.id,
            }));
          const devPlayers = [...enumHelper.mockPlayers, ...realOnlineMembers];
          devPlayers.forEach((player) => {
            if (!player.timer) {
              const playerTimer = randomBetween(guildMinTimer, guildMaxTimer);
              player.timer = setTimeout(async () => {
                const eventResult = await this.game.activateEvent(guild.id, player, devPlayers);
                this.eventCount++;
                delete player.timer;
                return this.messageRouter.sendMessage(guild, eventResult);
              }, playerTimer);
            }
          });
        }
      });

      const onlineCount = process.env.NODE_ENV.includes('production') ? this.presenceTracker.size : enumHelper.mockPlayers.length;
      this.bot.user.setActivity(`${onlineCount} idlers in ${this.bot.guilds.cache.size} guilds`, { type: ActivityType.Watching });
    }, 60000 * interval);
  }

  _processDetails() {
    const interval = process.env.NODE_ENV.includes('production') ? this.tickInMinutes : 1;
    console.log('------------');
    console.log(`Current Up Time: ${secondsToTimeFormat(Math.floor(process.uptime()))}\n`);
    console.log(`Events per ${interval} minute(s): ${this.eventCount}`);
    console.log('------------');
    this.eventCount = 0;
  }

}

module.exports = new DiscordBot();
