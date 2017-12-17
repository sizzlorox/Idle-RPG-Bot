const Discord = require('discord.js');
const CommandParser = require('./utils/CommandParser');
const fs = require('fs');
const logger = require('../utils/logger');

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

  CommandParser.parseUserCommand(discordBot, hook, message);
});

discordBot.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('id', process.env.DISCORD_RPG_WELCOME_CHANNEL_ID);
  if (!channel) {
    return;
  }

  channel.send(`Welcome ${member}! This channel has an Idle-RPG bot! If you have any questions check the <#${process.env.DISCORD_RPQ_FAQ_CHANNEL}> or PM me !help.`);
});

discordBot.login(process.env.DISCORD_BOT_LOGIN_TOKEN);

module.exports = { discordBot, hook };
