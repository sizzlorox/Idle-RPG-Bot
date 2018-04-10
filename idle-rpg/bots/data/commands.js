const moment = require('moment');
const Space = require('../modules/Space');
const Crypto = require('../modules/Crypto');
const Urban = require('../modules/Urban');
const maps = require('../../game/data/maps');
const { commandChannel } = require('../../../settings');

const commands = [
  // RPG COMMANDS
  help = {
    command: ['!help', '!h'],
    operatorOnly: false,
    function: (game, message) => {
      const helpMsg = `\`\`\`You can private message me these commands except for checking other players!
        !top10 - Retrieves top 10 highest level players
        !top10 <gold, spells, level, stolen, stole, gambles, events, bounty> - Retrieves top 10 highest of selected section
        !s, !stats - Sends a PM with your stats
        !s, !stats <@Mention of player> - Sends a PM with the players stats (without < > and case-sensitive)
        !e, !equip - Sends a PM with your equipment
        !e, !equip <@Mention of player> - Sends a PM with the players equipment (without < > and case-sensitive)
        !c, !char, !character - Sends PM with your stats and equipment
        !c, !char, !character <@Mention of player> - Sends a PM with the players equipment and stats (without < > and case-sensitive)
        !m, !map - Displays the worlds locations
        !cs, !castspell - Lists spells available to cast
        !cs, !castspell <spell> - Casts a global spell onto Idle-RPG
        !el, !eventlog - Lists up to 15 past events
        !el, !eventlog <@Mention of player> - Lists up to 15 past events of mentioned player
        !pl, !pvplog - Lists up to 15 past PvP events
        !pl, !pvplog <@Mention of player> - Lists up to 15 past PvP events of mentioned player
        !mention <on|off|action|move> - Change if events relating to you will @Mention you
        !pm <on|off|filtered> - Change if events relating to you will be private messaged to you
        !gender <male|female|neutral|neuter> - Change your character's gender
        !lore <Map Name> - Retrieves the lore of map selected
        !b, !bounty <@Mention of player> <Bounty Amount> - Puts a bounty on the death of a player
        !sb, !spellbook - Returns list of spells your character has learned
        !i, !inv, !inventory - Displays what your character has in his/her inventory
        \`\`\``;
      message.author.send(helpMsg);
    }
  },

  character = {
    command: ['!character', '!c', '!char'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, Helper) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerStats) => {
            if (!playerStats) {
              return message.author.send('This character was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const stats = Helper.generateStatsString(playerStats);
            const equip = Helper.generateEquipmentsString(playerStats);
            message.author.send(stats.replace('Here are your stats!', `Here is ${playerStats.name}s stats!`)
              .concat('\n')
              .concat(equip)
              .replace('Heres your equipment!', `Here is ${playerStats.name}s equipment!`));
          });
      }

      return game.playerStats(message.author)
        .then((playerStats) => {
          if (!playerStats) {
            return message.author.send('Your character was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const stats = Helper.generateStatsString(playerStats);
          const equip = Helper.generateEquipmentsString(playerStats);
          message.author.send(stats.concat('\n').concat(equip));
        });
    }
  },

  inventory = {
    command: ['!inventory', '!inv', '!i'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, Helper) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerInventory(playerObj.array()[0])
          .then((playerInventory) => {
            if (!playerInventory) {
              return message.author.send('This players inventory was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            return Helper.generateInventoryString(playerInventory)
              .then(inv => message.author.send(inv.replace('Here is your inventory!', `Here is ${playerInventory.name}s inventory!`)));
          });
      }

      game.playerInventory(message.author)
        .then((playerInventory) => {
          if (!playerInventory) {
            return message.author.send('Your inventory was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          Helper.generateInventoryString(playerInventory)
            .then(inv => message.author.send(inv));
        });
    }
  },

  stats = {
    command: ['!stats', '!s'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, Helper) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
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

            const stats = Helper.generateStatsString(playerStats);
            message.author.send(stats.replace('Here are your stats!', `Here is ${playerStats.name}s stats!`));
          });
      }

      game.playerStats(message.author)
        .then((playerStats) => {
          if (!playerStats) {
            return message.author.send('Your stats were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const stats = Helper.generateStatsString(playerStats);
          message.author.send(stats);
        });
    }
  },

  equip = {
    command: ['!equip', '!e'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, Helper) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
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

            const equip = Helper.generateEquipmentsString(playerEquipment)
            message.author.send(equip.replace('Heres your equipment!', `Here is ${playerEquipment.name}s equipment!`));
          });
      }

      game.playerEquipment(message.author)
        .then((playerEquipment) => {
          if (!playerEquipment) {
            return message.author.send('Your equipment was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const equip = Helper.generateEquipmentsString(playerEquipment);
          message.author.send(equip);
        });
    }
  },

  spellbook = {
    command: ['!spellbook', '!sb'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, Helper) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerSpells) => {
            if (!playerSpells) {
              return message.author.send('This players spellbook was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const spellBook = Helper.generateSpellBookString(playerSpells);
            message.author.send(spellBook.replace('Here\'s your spellbook!', `Here is ${playerSpells.name}'s spellbook!`));
          });
      }

      game.playerStats(message.author)
        .then((playerSpells) => {
          if (!playerSpells) {
            return message.author.send('Your spellbook was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const spellBook = Helper.generateSpellBookString(playerSpells);
          message.author.send(spellBook);
        });
    }
  },

  map = {
    command: ['!map', '!m'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      let mapInfo = '';
      maps.forEach((map) => {
        mapInfo = mapInfo.concat(`\n${map.name} (${map.biome.name}) Coordinates: ${map.coords}`);
      });

      message.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
    }
  },

  lore = {
    command: '!lore',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, Helper) => {
      if (message.content.includes(' ')) {
        const splitMessage = message.content.split(/ (.+)/)[1].toLowerCase();
        const requestedMap = maps.filter(map => map.name.toLowerCase() === splitMessage)
          .map(map => map.lore);

        if (requestedMap.length === 0) {
          return message.author.send(`${splitMessage} was not found. Did you type the map correctly?`);
        }

        return message.author.send(`\`\`\`${Helper.capitalizeFirstLetter(splitMessage)}: ${requestedMap[0]}\`\`\``);
      }

      return message.author.send('You must enter a map to retrieve its lore. Check `!help` for more info.');
    }
  },

  top10 = {
    command: '!top10',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      switch ((message.content.split(/ (.+)/)[1] === undefined) ? 'level' : message.content.split(/ (.+)/)[1].toLowerCase()) {
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
          game.top10(message.author, { 'gold.current': -1 });
          break;
        case 'spells':
          game.top10(message.author, { spellCast: -1 });
          break;
        case 'events':
          game.top10(message.author, { events: -1 });
          break;
        case 'bounty':
          game.top10(message.author, { currentBounty: -1 });
          break;
        default:
          game.top10(message.author, { level: -1 });
          break;
      }
    }
  },

  castSpell = {
    command: ['!castspell', '!cs'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        return game.castSpell(message.author, message.content.split(/ (.+)/)[1].toLowerCase());
      }

      return message.author.send(`\`\`\`List of spells:
        bless - 1200 gold - Increases global EXP/GOLD multiplier by 1 for 30 minutes.
        home - 500 gold - Teleports you back to Kindale.
        \`\`\``);
    }
  },

  /**
   * places a bounty on a specific player for a specific amount should work with @playername and then a gold amount
   */
  placeBounty = {
    command: ['!bounty', '!b'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];

        if (Number(amount) <= 0 || Number(amount) % 1 !== 0 || !amount.match(/^\d+$/)) {
          return message.author.send('Please use a regular amount of gold.');
        }
        if (Number(amount) < 100) {
          return message.author.send('You must place a bounty higher or equal to 100');
        }
        if (!recipient.match(/^\d+$/)) {
          return message.author.send('Please add a bounty to a player.');
        }
        return game.placeBounty(discordHook, message.author, recipient, Number(amount));
      }

      return message.author.send('Please specify a player and amount of gold you wish to place on their head. You need to have enough gold to put on their head');
    }
  },

  eventLog = {
    command: ['!eventlog', '!el'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        return game.playerEventLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 15)
          .then((result) => {
            if (!result || result.length === 0) {
              return message.author.send('This player has not activated any Events yet.');
            }

            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerEventLog(message.author.id, 15)
        .then((result) => {
          if (!result || result.length === 0) {
            return message.author.send('You have not activated any Events yet.');
          }

          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  pvpLog = {
    command: ['!pvplog', '!pl'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        return game.playerPvpLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 15)
          .then((result) => {
            if (!result || result.length === 0) {
              return message.author.send('This player has not had any PvP Events yet.');
            }

            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerPvpLog(message.author.id, 15)
        .then((result) => {
          if (!result || result.length === 0) {
            return message.author.send('You have not had any PvP Events yet.');
          }

          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  /**
   * Subscribe to PM messages
   */
  privateMessage = {
    command: '!pm',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
            return game.modifyPM(message.author, splitCommand[1] === 'on', false);
          case 'filtered':
            return game.modifyPM(message.author, true, true);
        }
      }

      return message.author.send(`\`\`\`Possible options:
      on - You will be pmed in events that include you
      off - You won't be pmed in events that include you
      filtered - You will be pmed certain important events that include you
      \`\`\``);
    }
  },

  /**
   * Modify if player will be @Mentioned in events
   */
  modifyMention = {
    command: '!mention',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
          case 'action':
          case 'move':
            return game.modifyMention(message.author, splitCommand[1].toLowerCase());
        }
      }

      return message.author.send(`\`\`\`Possible options:
        on - You will be tagged in events that include you
        off - You won't be tagged in events that include you
        action - You will be tagged in action events that include you
        move - You will be tagged in move events that include you
        \`\`\``);
    }
  },

  /**
   * Modify player's gender
   */
  modifyGender = {
    command: '!gender',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'male':
          case 'female':
          case 'neutral':
          case 'neuter':
            return game.modifyGender(message.author, splitCommand[1]);
        }
      }

      return message.author.send(`\`\`\`Possible options:
        male
        female
        neutral
        neuter
        \`\`\``);
    }
  },

  // Bot Operator commands
  setPlayerBounty = {
    command: '!setbounty',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        game.setPlayerBounty(recipient, Number(amount));
        return message.author.send('Done');
      }
    }
  },

  setPlayerGold = {
    command: '!setgold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        game.setPlayerGold(recipient, Number(amount));
        return message.author.send('Done');
      }
    }
  },

  sendChristmasFirstPreMessage = {
    command: '!xmasfirst',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      game.sendChristmasFirstPreEventMessage();
    }
  },

  sendChristmasSecondPreMessage = {
    command: '!xmassecond',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      game.sendChristmasSecondPreEventMessage();
    }
  },

  christmasEventCommand = {
    command: '!xmas',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        switch (message.content.split(/ (.+)/)[1].toLowerCase()) {
          case 'true':
            return game.updateChristmasEvent(true);
          case 'false':
            return game.updateChristmasEvent(false);
        }
      }
    }
  },

  activateBlizzard = {
    command: '!blizzard',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        const blizzardBoolean = game.blizzardSwitch(splitCommand[1]);
        switch (splitCommand) {
          case 'on':
            message.author.send(blizzardBoolean ? 'Blizzard is already activated!' : 'Blizzard activated.');
            break;
          case 'off':
            message.author.send(!blizzardBoolean ? 'Blizzard is already deactivated!' : 'Blizzard deactivated.');
            break;
        }
      }
    }
  },

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
        game.deletePlayer(message.content.split(/ (.+)/)[1])
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
      game.deleteAllPlayers()
        .then(() => {
          message.author.send('Done.');
        });
    }
  },

  aprilFools = {
    command: '!aprilfools',
    operatorOnly: true,
    function: (game, message, discordBot) => {
      const aprilfools = discordBot.guilds.find('name', 'Idle-RPG').members
        .filter(player => player.presence.status === 'online' && !player.user.bot
          || player.presence.status === 'idle' && !player.user.bot
          || player.presence.status === 'dnd' && !player.user.bot);
      aprilfools.forEach(player => player.send('Found a Mythical Alien Relic in Topscros Path'));
    }
  },

  // MODULE COMMANDS
  giveEquipmentToPlayer = {
    command: '!giveplayer',
    operatorOnly: true,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitArray = message.content.split(' ');
        const playerId = splitArray[1];
        const position = splitArray[2];
        const equipment = JSON.parse(splitArray.slice(3, splitArray.length).join(' '));
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
        currency = message.content.split(/ (.+)/)[1];
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
  },

  urban = {
    command: '!urban',
    operatorOnly: false,
    function: (game, message, Helper) => {
      if (message.content.includes(' ')) {
        const word = message.content.split(/ (.+)/)[1].toLowerCase().replace(' ', '+');

        return Urban.searchUrbanDictionary(word)
          .then((result) => {
            let definition = 'Urban Dictionary Definition of ****\n```';
            const wordDefinition = result.list.sort((item1, item2) => {
              return item2.thumbs_up - item1.thumbs_up;
            })[0];
            definition = definition.replace('****', `\`${Helper.capitalizeFirstLetter(wordDefinition.word).replace('+', ' ')}\``);

            return message.reply(definition.concat(`Definition:\n${wordDefinition.definition}\n\nExample:\n${wordDefinition.example}\`\`\`\n[:thumbsup::${wordDefinition.thumbs_up} / :thumbsdown::${wordDefinition.thumbs_down}]`));
          });
      }

      return message.reply('Please specify a word to look up.');
    }
  }
];
module.exports = commands;
