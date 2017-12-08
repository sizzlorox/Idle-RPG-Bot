const Discord = require('discord.js');
const fs = require('fs');
const Helper = require('../utils/Helper');
const { botOperator, rpgChannel } = require('../settings');
const Game = require('../game/Game');
const maps = require('../game/data/maps');
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
  if (message.channel.id !== rpgChannel) {
    return;
  }

  //BOT OPERATOR COMMANDS
  if (message.author.id === botOperator) {
    if (message.content === '!submode') {
      /*
      Under development, trying to get a list of subscribers
      const onlineUsers = discordBot.users.filter(player => player.presence.status === 'online' && !player.bot);
      console.log(discordBot.users.array()[5].role);
      */
    }

    if (message.content === '!resetAll') {
      Game.deleteAllPlayers()
        .then(() => {
          message.author('Done.');
        });
    }
  }

  if (message.content === '!help') {
    const helpMsg = `\`\`\`
    !me - Sends a PM with your characters stats.
    !onlineUsers - Displays users that are currently in idle-rpg.
    !check <Player Name> - Sends a PM with the players stats. (without < > and case-senstive).
    !map - Displays the worlds locations.\`\`\``;
    message.author.send(helpMsg);
  }

  if (message.content === '!map') {
    const map = maps.map(area => `\n  ${area.name}(${area.type})`);
    message.author.send(`\`\`\`Map of Idle-RPG:${map}\`\`\``);
  }

  if (message.content === '!me') {
    Game.playerStats(message.author)
      .then((playerStats) => {
        if (!playerStats) {
          return message.author.send('Your stats were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
        }

        const stats = Helper.generateStatsString(playerStats);
        message.author.send(stats);
      });
  }

  if (message.content.startsWith('!check ')) {
    const checkPlayer = message.content.split(' ');
    const playerObj = discordBot.users.filter(player => player.username === checkPlayer[1] && !player.bot);
    if (playerObj.size === 0) {
      message.author.send(`${checkPlayer[1]} was not found!`);
      return;
    }

    Game.playerStats(playerObj.array()[0])
      .then((playerStats) => {
        if (!playerStats) {
          return message.author.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
        }

        const stats = Helper.generateStatsString(playerStats);
        message.author.send(stats.replace('Here are your stats!', `Here is ${checkPlayer[1]}s stats!`));
      });
  }

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
