const DiscordJS = require('discord.js');
const fs = require('fs');
const { botLoginToken } = require('../../settings');

class DiscordBot {

  constructor() {
    this.bot = new DiscordJS.Client();
    this.loadEventListeners();
    this.bot.login(botLoginToken);
  }

  loadEventListeners() {
    this.bot.once('ready', () => {
      // this.bot.user.setAvatar(fs.readFileSync('./idle-rpg/res/hal.jpg'));
      this.bot.user.setActivity('Idle-RPG Game Master');
      this.bot.user.setStatus('idle');
      this.loadGuilds();
    });
  }

  loadGuilds() {
    console.log('Idle RPG is loading guilds');
    this.bot.guilds.forEach(async (guild) => {
      this.manageGuildChannels(guild);
    });
  }

  async manageGuildChannels(guild) {
    const hasCategoryChannel = guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG');
    const hasLeaderboardsChannel = guild.channels.find(channel => channel.name === 'leaderboards' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
    const hasCommandsChannel = guild.channels.find(channel => channel.name === 'commands' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
    const hasFAQChannel = guild.channels.find(channel => channel.name === 'faq' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
    const hasActionsChannel = guild.channels.find(channel => channel.name === 'actions' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
    const hasMovementChannel = guild.channels.find(channel => channel.name === 'movement' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
    if (!hasCategoryChannel) {
      console.log(`Creating Idle-RPG Category Channel for ${guild.name}`);
      try {
        await guild.createChannel('Idle-RPG', 'category', {}, 'Creating channels for Idle-RPG-Bot');
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasLeaderboardsChannel) {
      console.log(`Creating Idle-RPG Leaderboards Channel for Guild: ${guild.name}`);
      try {
        const leaderboardsChannel = await guild.createChannel('leaderboards', 'text', {}, 'Creating channels for Idle-RPG-Bot');
        await leaderboardsChannel.setParent(guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG'));
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasCommandsChannel) {
      console.log(`Creating Idle-RPG Commands Channel for Guild: ${guild.name}`);
      try {
        const commandsChannel = await guild.createChannel('commands', 'text', {}, 'Creating channels for Idle-RPG-Bot');
        await commandsChannel.setParent(guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG'));
        await commandsChannel.setTopic('In order to easier check other players stats/equip, a command channel was created. You can check others with @mentions.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasFAQChannel) {
      console.log(`Creating Idle-RPG FAQ Channel for Guild: ${guild.name}`);
      try {
        const faqChannel = await guild.createChannel('faq', 'text', {}, 'Creating channels for Idle-RPG-Bot');
        await faqChannel.setParent(guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG'));
        await faqChannel.setTopic('Frequently asked questions', 'Setting up Idle-RPG Channels');
        await faqChannel.send(`
• **I'm not born yet, what should I do?**
Once an event is fired for your character you will be born.

• **How do I play?**
As long as you are in the online list you will be playing the game. Does not matter what status you set as long as you are not "Invisible".

• **Will my character be reset?**
The game is in super early development right now so resets are expected. Once the game is complete resets will most likely be a yearly thing with leaderboards.

• **How can I help with the development?**
Suggestions are always welcome, if you have experience with NodeJS you're welcome to become a contributor and develop along side with us!

• **The bot is offline. Now what?**
The bot has been a bad boy and decided to sleep. Mention the @Admin role and we will get to it as fast as we can.

• **My event counter goes up but I did not see anything in the event channels**
There are some events such as luck events which fail. When they do it does not print anything but your event counter goes up.

• **Is there a way to turn off all the spam from events?**
Yes, you can either right click the channel to mute and select the mute checkbox, click the bell on top right of discord or mute the whole server by clicking on the servers icon to the left side of discord and selecting the mute checkbox.

• **Is this open source?**
Yes, <https://github.com/sizzlorox/Idle-RPG-Bot>

• **Do you guys have a trello board?**
Yes, <https://trello.com/b/OnpWqvlp/idle-rpg>

• **Can I control my character?**
No.`);
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasActionsChannel) {
      console.log(`Creating Idle-RPG Action Channel for Guild: ${guild.name}`);
      try {
        const actionChannel = await guild.createChannel('actions', 'text', {}, 'Creating channels for Idle-RPG-Bot');
        await actionChannel.setParent(guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG'));
        await actionChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasMovementChannel) {
      console.log(`Creating Idle-RPG Movement Channel for Guild: ${guild.name}`);
      try {
        const movementChannel = await guild.createChannel('movement', 'text', {}, 'Creating channels for Idle-RPG-Bot');
        await movementChannel.setParent(guild.channels.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG'));
        await movementChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
  }

}
module.exports = new DiscordBot();
