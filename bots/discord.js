const Discord = require('discord.js');
const fs = require('fs');
const helper = require('../utils/helper');
const { botOperator, rpgChannel } = require('../settings');
const Game = require('../game/Game');
const Space = require('./modules/Space');
const Crypto = require('./modules/Crypto');
const maps = require('../game/data/maps');
const logger = require('../utils/logger');
const moment = require('moment');

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
  const messageContent = message.content.toLocaleLowerCase();
  if (messageContent.startsWith('!crypto')) {
    let currency = 'BRL';
    if (messageContent.includes(' ')) {
      currency = messageContent.split(' ')[1];
    }

    Crypto.top5(currency)
      .then((cyrptoInfo) => {
        const codeBlock = '\`\`\`';
        const currencyVar = `price_${currency.toLocaleLowerCase()}`;
        let info = codeBlock;
        cyrptoInfo.forEach((c) => {
          info = info.concat(`${c.name} (${c.symbol})`);
          info = info.concat(`\nRank: ${c.rank}`);
          info = info.concat(`\nUSD: ${c.price_usd}`);
          info = info.concat(`\n${currency.toUpperCase()}: ${c[currencyVar]}`);
          info = info.concat(`\nPercent Change 1h: ${c.percent_change_1h}%`);
          info = info.concat(`\nPercent Change 24h: ${c.percent_change_24h}%`);
          info = info.concat(`\nPercent Change 7d: ${c.percent_change_7d}%\n\n`);
        });
        info = info.concat(codeBlock);
        message.reply(info);
      });
  }

  if (messageContent === '!nextlaunch') {
    Space.nextLaunch()
      .then((spaceInfo) => {
        const nextLaunch = spaceInfo.launches[0];
        const codeBlock = '\`\`\`';
        let info = codeBlock;
        info = info.concat(`${nextLaunch.provider}s ${nextLaunch.vehicle}`);
        info = info.concat(`\nPayLoad: ${nextLaunch.payload}`);
        info = info.concat(`\nLocation: ${nextLaunch.location}`);
        info = info.concat(`\nLaunch Time: ${moment(nextLaunch.launchtime).utc('br')}`);
        info = info.concat(`\nStream: ${nextLaunch.hasStream ? 'Yes' : 'No'}`);
        info = info.concat(`\nDelayed: ${nextLaunch.delayed ? 'Yes' : 'No'}`);
        info = info.concat(codeBlock);
        message.reply(info);
      });
  }

  if (messageContent === '!nextstreamlaunch') {
    Space.nextLaunch()
      .then((spaceInfo) => {
        let nextLaunch;
        for (let i = 0; i < spaceInfo.launches.length; i++) {
          if (spaceInfo.launches[i].hasStream) {
            nextLaunch = spaceInfo.launches[i];
            break;
          }
        }

        const codeBlock = '\`\`\`';
        let info = codeBlock;
        info = info.concat(`${nextLaunch.provider}s ${nextLaunch.vehicle}`);
        info = info.concat(`\nPayLoad: ${nextLaunch.payload}`);
        info = info.concat(`\nLocation: ${nextLaunch.location}`);
        info = info.concat(`\nLaunch Time: ${moment(nextLaunch.launchtime).utc('br')}`);
        info = info.concat(`\nStream: ${nextLaunch.hasStream ? 'Yes' : 'No'}`);
        info = info.concat(`\nDelayed: ${nextLaunch.delayed ? 'Yes' : 'No'}`);
        info = info.concat(codeBlock);
        message.reply(info);
      });
  }

  if (message.channel.id !== rpgChannel) {
    return;
  }

  //BOT OPERATOR COMMANDS
  if (message.author.id === botOperator) {
    if (messageContent === '!submode') {
      /*
      Under development, trying to get a list of subscribers
      const onlineUsers = discordBot.users.filter(player => player.presence.status === 'online' && !player.bot);
      console.log(discordBot.users.array()[5].role);
      */
    }

    if (messageContent === '!resetAll') {
      Game.deleteAllPlayers()
        .then(() => {
          message.author('Done.');
        });
    }
  }

  if (messageContent.includes('(╯°□°）╯︵ ┻━┻')) {
    message.reply('┬─┬ノ(ಠ_ಠノ)');
  }

  if (messageContent === '!help') {
    const helpMsg = `\`\`\`
    !me - Sends a PM with your characters stats.
    !onlineUsers - Displays users that are currently in idle-rpg.
    !check <Player Name> - Sends a PM with the players stats. (without < > and case-senstive).
    !map - Displays the worlds locations.
    !crypto - Displays some crypto currencies info.
    !nextlaunch - Displays next rocket launch info.
    !nextstreamlaunch - Displayes next rocket launch that will have a stream.\`\`\``;
    message.author.send(helpMsg);
  }

  if (messageContent === '!me') {
    Game.playerStats(message.author)
      .then((playerStats) => {
        if (!playerStats) {
          return message.author.send('Your stats were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
        }

        const stats = helper.generateStatsString(playerStats);
        message.author.send(stats);
      });
  }

  if (messageContent.startsWith('!map')) {
    const discordOnlinePlayers = discordBot.users
      .filter(player => player.presence.status === 'online' && !player.bot
        || player.presence.status === 'idle' && !player.bot)
      .map((player) => {
        return player.id;
      });

    Game.getOnlinePlayerMaps(discordOnlinePlayers)
      .then((players) => {
        let mapInfo = '';
        players.forEach((player) => {
          maps.forEach((map) => {
            mapInfo = mapInfo.concat(`\n${map.name} (`);
            if (player.map.name === map.name) {
              mapInfo = mapInfo.concat(`${player.name}, `);
            }
            mapInfo = mapInfo.replace(/,\s*$/, '');
            mapInfo = mapInfo.concat(')');
          });
        });

        message.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
      });
  }

  if (messageContent.startsWith('!check ')) {
    if (messageContent.includes(' ')) {
      const checkPlayer = messageContent.split(' ');
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

          const stats = helper.generateStatsString(playerStats);
          message.author.send(stats.replace('Here are your stats!', `Here is ${checkPlayer[1]}s stats!`));
        });
    }
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
