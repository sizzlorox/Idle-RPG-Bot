const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const logger = require('../utils/logger');

const discordBot = new Discord.Client();
const hook = new Discord.WebhookClient(
  process.env.DISCORD_WEBHOOK_ID,
  process.env.DISCORD_WEBHOOK_TOKEN,
);

discordBot.on('ready', () => {
  discordBot.user.setAvatar(fs.readFileSync('./res/hal.jpg'), (err) => {
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

  CommandParser.parseUserCommand(discordBot, message);
});

discordBot.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('name', 'member-log');
  if (!channel) {
    return;
  }
  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! Please type into #idle-rpg channel !help for a list of commands or DM me!`);
});

discordBot.login(process.env.DISCORD_BOT_LOGIN_TOKEN);

module.exports = { discordBot, hook };
