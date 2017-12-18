const moment = require('moment');
const Game = require('../../game/Game');
const Space = require('../modules/Space');
const Crypto = require('../modules/Crypto');
const maps = require('../../game/data/maps');
const helper = require('../../utils/helper');
const { commandChannel } = require('../../../settings');

const game = new Game();

const commands = [
  // RPG COMMANDS
  help = {
    command: '!help',
    operatorOnly: false,
    function: (message) => {
      const helpMsg = `\`\`\`You can private message me these commands except for checking other players!
        !stats - Sends a PM with your stats
        !stats <@Mention of player> - Sends a PM with the players stats. (without < > and case-senstive).
        !equip - Sends a PM with your equipment
        !equip <@Mention of player> - Sends a PM with the players equipment. (without < > and case-senstive).
        !map - Displays the worlds locations.
        !castspell - Lists spells available to cast.
        !castspell <spell> - Casts a global spell onto Idle-RPG.
        !eventlog - Lists up to 50 past events.
        !eventlog <@Mention of player> - Lists up to 50 past events of mentioned player.
        \`\`\``;
      /*

      !crypto - Displays some crypto currencies info.
      !nextlaunch - Displays next rocket launch info.
      !nextstreamlaunch - Displayes next rocket launch that will have a stream.
      
      */
      message.author.send(helpMsg);
    }
  },

  stats = {
    command: '!stats',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(' ')[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerStats) => {
            if (!playerStats) {
              return message.author.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const stats = helper.generateStatsString(playerStats);
            message.author.send(stats.replace('Here are your stats!', `Here is ${playerStats.name}s stats!`));
          });
      }

      game.playerStats(message.author)
        .then((playerStats) => {
          if (!playerStats) {
            return message.author.send('Your stats were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const stats = helper.generateStatsString(playerStats);
          message.author.send(stats);
        });
    }
  },

  equip = {
    command: '!equip',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(' ')[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerEquipment(playerObj.array()[0])
          .then((playerEquipment) => {
            if (!playerEquipment) {
              return message.author.send('This players equipment was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const equip = helper.generateEquipmentsString(playerEquipment);
            message.author.send(equip.replace('Heres your equipment!', `Here is ${playerEquipment.name}s equipment!`));
          });
      }

      game.playerEquipment(message.author)
        .then((playerEquipment) => {
          if (!playerEquipment) {
            return message.author.send('Your equipment was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const equip = helper.generateEquipmentsString(playerEquipment);
          message.author.send(equip);
        });
    }
  },

  map = {
    command: '!map',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (message, discordBot) => {
      const discordOnlinePlayers = discordBot.users
        .filter(player => player.presence.status === 'online' && !player.bot
          || player.presence.status === 'idle' && !player.bot
          || player.presence.status === 'dnd' && !player.bot)
        .map((player) => {
          return player.id;
        });

      game.getOnlinePlayerMaps(discordOnlinePlayers)
        .then((players) => {
          let mapInfo = '';
          maps.forEach((map) => {
            mapInfo = mapInfo.concat(`\n${map.name} (${map.type}) (`);
            players.forEach((player) => {
              if (player.map.name === map.name) {
                mapInfo = mapInfo.concat(`${player.name}, `);
              }
            });
            mapInfo = mapInfo.replace(/,\s*$/, '');
            mapInfo = mapInfo.concat(')');
          });

          message.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
        });
    }
  },

  giveEquipmentToPlayer = {
    command: '!giveplayer',
    operatorOnly: true,
    function: (message) => {
      if (message.content.includes(' ')) {
        const splitArray = message.content.split(' ');
        const playerId = splitArray[1];
        const position = splitArray[2];
        const equipment = JSON.parse(splitArray[3]);
        game.loadPlayer(playerId)
          .then((player) => {
            player.equipment[position] = equipment;
            game.savePlayer(player)
              .then(() => {
                message.author.send('Done.');
              });
          });
      }
    }
  },

  castSpell = {
    command: '!castspell',
    channelOnlyId: commandChannel,
    function: (message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        game.castSpell(message.author, discordHook, message.content.split(' ')[1].toLowerCase());
      } else {
        message.reply(`\`\`\`List of spells:
        bless - 1500 gold - Increases global EXP/GOLD multiplier by 1 for 15 minutes.
        \`\`\``);
      }
    }
  },

  eventLog = {
    command: '!eventlog',
    channelOnlyId: commandChannel,
    function: (message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(' ');
        return game.playerEventLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 50)
          .then((result) => {
            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerEventLog(message.author.id, 50)
        .then((result) => {
          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  // Bot Operator commands
  giveGold = {
    command: '!givegold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (message) => {
      if (message.content.includes(' ') && message.content.split(' ').length > 2) {
        const splitCommand = message.content.split(' ');
        game.giveGold(splitCommand[1], splitCommand[2])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  resetPlayer = {
    command: '!resetplayer',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (message) => {
      game.deletePlayer()
        .then(() => {
          message.author.send('Done.');
        });
    }
  },

  resetAll = {
    command: '!resetall',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (message) => {
      if (message.content.includes(' ')) {
        game.deleteAllPlayers(message.content.split(' ')[1])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  forceAttack = {
    command: '!forceattack',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        const attackPlayer = message.content.split(' ')[1];
        const otherAttackPlayer = message.content.split(' ')[2];
        if (!otherAttackPlayer) {
          return game.forcePvp(discordBot, discordHook, message.author, attackPlayer);
        }

        return game.forcePvp(discordBot, discordHook, message.author, attackPlayer, otherAttackPlayer);
      }
    }
  },

  // MODULE COMMANDS
  nextLaunch = {
    command: '!nextlaunch',
    operatorOnly: false,
    function: (message) => {
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
  },

  nextStreamlaunch = {
    command: '!nextstreamlaunch',
    operatorOnly: false,
    function: (message) => {
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
  },

  crypto = {
    command: '!crypto',
    operatorOnly: false,
    function: (message) => {
      let currency = 'BRL';
      if (message.content.includes(' ')) {
        currency = message.content.split(' ')[1];
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
  }
];
module.exports = commands;
