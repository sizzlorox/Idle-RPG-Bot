const moment = require('moment');
const Space = require('../modules/Space');
const Crypto = require('../modules/Crypto');
const maps = require('../../game/data/maps');
const helper = require('../../utils/helper');
const { commandChannel } = require('../../../settings');

const commands = [
  // RPG COMMANDS
  help = {
    command: '!help',
    operatorOnly: false,
    function: (game, message) => {
      const helpMsg = `\`\`\`You can private message me these commands except for checking other players!
        !top10 - Retrieves top 10 highest level players
        !top10 <gold, spells, level, stolen, stole, gambles> - Retrives top 10 highest of selected section
        !stats - Sends a PM with your stats
        !stats <@Mention of player> - Sends a PM with the players stats. (without < > and case-senstive).
        !equip - Sends a PM with your equipment
        !equip <@Mention of player> - Sends a PM with the players equipment. (without < > and case-senstive).
        !map - Displays the worlds locations.
        !castspell - Lists spells available to cast.
        !castspell <spell> - Casts a global spell onto Idle-RPG.
        !eventlog - Lists up to 25 past events.
        !eventlog <@Mention of player> - Lists up to 15 past events of mentioned player.
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
    function: (game, message, discordBot) => {
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
    function: (game, message, discordBot) => {
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
    function: (game, message, discordBot) => {
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
            mapInfo = mapInfo.concat(`\n${map.name} (${map.type}):\n`);
            players.forEach((player) => {
              if (player.map.name === map.name) {
                mapInfo = mapInfo.concat(`${player.name}, `);
              }
            });
            mapInfo = mapInfo.replace(/,\s*$/, '\n');
          });

          message.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
        });
    }
  },

  top10 = {
    command: '!top10',
    channelOnlyId: commandChannel,
    function: (game, message) => {
      switch ((message.content.split(' ')[1] === undefined) ? 'level' : message.content.split(' ')[1].toLowerCase()) {
        case 'gambles':
          game.top10(message.author, { gambles: -1 });
          break;
        case 'stolen':
          game.top10(message.author, { stolen: -1 });
          break;
        case 'stole':
          game.top10(message.author, { stole: -1 });
          break;
        case 'gold':
          game.top10(message.author, { gold: -1 });
          break;
        case 'spells':
          game.top10(message.author, { spells: -1 });
          break;
        default:
          game.top10(message.author, { level: -1 });
          break;
      }
    }
  },

  giveEquipmentToPlayer = {
    command: '!giveplayer',
    operatorOnly: true,
    function: (game, message) => {
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
    function: (game, message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        game.castSpell(message.author, discordHook, message.content.split(' ')[1].toLowerCase());
      } else {
        message.reply(`\`\`\`List of spells:
        bless - 1500 gold - Increases global EXP/GOLD multiplier by 1 for 30 minutes.
        \`\`\``);
      }
    }
  },

  eventLog = {
    command: '!eventlog',
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(' ');
        return game.playerEventLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 50)
          .then((result) => {
            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerEventLog(message.author.id, 15)
        .then((result) => {
          console.log(`\`\`\`${result}\`\`\``.length);
          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  // Bot Operator commands
  giveGold = {
    command: '!givegold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
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
    function: (game, message) => {
      if (message.content.includes(' ')) {
        game.deletePlayer(message.content.split(' ')[1])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  resetAll = {
    command: '!resetall',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        game.deleteAllPlayers(message.content.split(' ')[1])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  // MODULE COMMANDS
  nextLaunch = {
    command: '!nextlaunch',
    operatorOnly: false,
    function: (game, message) => {
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
    function: (game, message) => {
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
    function: (game, message) => {
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
