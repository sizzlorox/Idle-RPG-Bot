const moment = require('moment');
const Space = require('../modules/Space');
const Crypto = require('../modules/Crypto');
const Urban = require('../modules/Urban');
const GitHub = require('../modules/Github');
const maps = require('../../game/data/maps');
const spells = require('../../game/data/globalSpells');
const enumHelper = require('../../utils/enumHelper');
const { commandChannel } = require('../../../settings');
const { infoLog } = require('../../utils/logger');

const commands = [
  // RPG COMMANDS
  help = {
    command: ['!help', '!h'],
    operatorOnly: false,
    function: (params) => {
      const { messageObj } = params;
      const helpMsg = `You can private message me these commands except for checking other players!
!top10 - Retrieves top 10 highest level players
!top10 <gold, spells, level, stolen, stole, gambles, events, bounty> - Retrieves top 10 highest of selected section
!rank <gold, spells, level, stolen, stole, gambles, events, bounty> - Returns your current rank of selected section
!s, !stats - Sends a PM with your stats
!s, !stats <@Mention of player> - Sends a PM with the players stats (without < > and case-sensitive)
!e, !equip - Sends a PM with your equipment
!e, !equip <@Mention of player> - Sends a PM with the players equipment (without < > and case-sensitive)
!c, !char, !character - Sends PM with your stats and equipment
!c, !char, !character <@Mention of player> - Sends a PM with the players equipment and stats (without < > and case-sensitive)
!m, !map - Displays the worlds locations
!multi, !multiplier - Displays current multiplier
!cs, !castspell - Lists spells available to cast
!cs, !castspell <spell> - Casts a global spell onto Idle-RPG
!t, !titles - Lists current unlocked titles
!st, !settitle <title> - Sets your title to <title> (without < > and case-sensitive)
!el, !eventlog - Lists up to 15 past events
!el, !eventlog <@Mention of player> - Lists up to 15 past events of mentioned player
!pl, !pvplog - Lists up to 15 past PvP events
!pl, !pvplog <@Mention of player> - Lists up to 15 past PvP events of mentioned player
!nq, !newquest - Changes the quest mob if quest has not been updated for more than 2 days
!mention <on|off|action|move> - Change if events relating to you will @Mention you
!pm <on|off|filtered> - Change if events relating to you will be private messaged to you
!gender <male|female|neutral|neuter> - Change your character's gender
!lottery - Joins Daily Lottery (100 gold for entry)
!prizepool - Displays how many players have joined the lottery and the prize pool
!lore <Map Name> - Retrieves the lore of map selected
!b, !bounty <@Mention of player> <Bounty Amount> - Puts a bounty on the death of a player
!sb, !spellbook - Returns list of spells your character has learned
!i, !inv, !inventory - Displays what your character has in his/her inventory
!invite - Sends you invite to the official server
!setserver <Server ID> - Sets primary server (If your in more than one server that contains this bot).
!bugreport <Message> - Sends a bug report message to the official server.
!patreon - Sends patreon link to show your support!
!prefix <Command prefix to use> - Changes server command prefix (Must have Manage Guild permission to use) eg: !prefix ?
!prefix <Server ID> <Command prefix to use> - Changes server command prefix (Must have Manage Guild permission to use) eg: !prefix 1111 ?`;
      messageObj.author.send(helpMsg, { split: true });
    }
  },

  // Lists titles
  titles = {
    command: ['!t', '!titles'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      return Game.fetchCommand({
        command: 'listTitles',
        author: messageObj.author
      });
    }
  },

  // Set title
  setTitle = {
    command: ['!st', '!settitle'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      if (!messageObj.content.includes(' ')) {
        return messageObj.author.send('You must select a title to set. (eg. !st <title>)');
      }

      const titleToSet = messageObj.content.split(/ (.+)/)[1];
      return Game.fetchCommand({
        command: 'setTitle',
        author: messageObj.author,
        value: titleToSet
      });
    }
  },

  character = {
    command: ['!character', '!c', '!char'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: async (params) => {
      const { Game, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        let checkPlayer = messageObj.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = await Bot.users.filter(player => player.id === checkPlayer && !player.bot).array();
        if (playerObj.length === 0 && process.env.NODE_ENV.includes('production')) {
          messageObj.author.send(`${checkPlayer} was not found!`);
          return;
        } else if (process.env.NODE_ENV.includes('development')) {
          playerObj.push({
            id: checkPlayer
          });
        }

        await Game.fetchCommand({
          command: 'playerStats',
          author: messageObj.author,
          playerToCheck: playerObj[0]
        });
        return Game.fetchCommand({
          command: 'playerEquipment',
          author: messageObj.author,
          playerToCheck: playerObj[0]
        });
      }

      await Game.fetchCommand({
        command: 'playerStats',
        author: messageObj.author
      });
      return Game.fetchCommand({
        command: 'playerEquipment',
        author: messageObj.author
      });
    }
  },

  inventory = {
    command: ['!inventory', '!inv', '!i'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Helper, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        let checkPlayer = messageObj.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = Bot.users.filter(player => player.id === checkPlayer && !player.bot).array();
        if (playerObj.length === 0 && process.env.NODE_ENV.includes('production')) {
          messageObj.author.send(`${checkPlayer} was not found!`);
          return;
        } else if (process.env.NODE_ENV.includes('development')) {
          playerObj.push({
            id: checkPlayer
          });
        }

        return Game.fetchCommand({
          command: 'playerInventory',
          author: playerObj[0]
        })
          .then((playerInventory) => {
            if (!playerInventory) {
              return messageObj.author.send('This players inventory was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            return Helper.generateInventoryString(playerInventory)
              .then(inv => messageObj.author.send(inv.replace('Here is your inventory!', `Here is ${playerInventory.name}s inventory!`)));
          });
      }

      Game.fetchCommand({
        command: 'playerInventory',
        author: messageObj.author
      })
        .then((playerInventory) => {
          if (!playerInventory) {
            return messageObj.author.send('Your inventory was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          Helper.generateInventoryString(playerInventory)
            .then(inv => messageObj.author.send(inv));
        });
    }
  },

  resetQuest = {
    command: ['!newquest', '!nq'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: async (params) => {
      const { Game, messageObj } = params;
      const result = await Game.fetchCommand({
        command: 'resetQuest',
        author: messageObj.author
      });
      return messageObj.author.send(result);
    }
  },

  stats = {
    command: ['!stats', '!s'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        let checkPlayer = messageObj.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = Bot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          messageObj.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return Game.fetchCommand({
          command: 'playerStats',
          author: messageObj.author,
          playerToCheck: playerObj[0]
        });
      }

      return Game.fetchCommand({
        command: 'playerStats',
        author: messageObj.author
      });
    }
  },

  equip = {
    command: ['!equip', '!e'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        let checkPlayer = messageObj.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = Bot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          messageObj.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return Game.fetchCommand({
          command: 'playerEquipment',
          author: messageObj.author,
          playerToCheck: playerObj[0]
        });
      }

      return Game.fetchCommand({
        command: 'playerEquipment',
        author: messageObj.author
      });
    }
  },

  spellbook = {
    command: ['!spellbook', '!sb'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        let checkPlayer = messageObj.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = Bot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          messageObj.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return Game.fetchCommand({
          command: 'playerSpellBook',
          author: messageObj.author,
          playerToCheck: playerObj[0]
        });
      }

      return Game.fetchCommand({
        command: 'playerSpellBook',
        author: messageObj.author
      });
    }
  },

  lottery = {
    command: ['!lottery'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Bot, messageObj } = params;
      return Game.fetchCommand({
        command: 'joinLottery',
        author: messageObj.author,
        Bot
      });
    }
  },

  prizePool = {
    command: ['!prizepool'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      return Game.fetchCommand({
        command: 'prizePool',
        author: messageObj.author
      });
    }
  },

  patreon = {
    command: ['!patreon'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { messageObj } = params;
      messageObj.author.send('If you would like to show your support you can become a patron!\
      \nKeep in mind that you gain no advantage from the others, this is purely to show your support to the developer!\
      \n<https://www.patreon.com/sizzlorox>');
    }
  },

  multi = {
    command: ['!multiplier', '!multi'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      return Game.fetchCommand({ command: 'checkMultiplier', author: messageObj.author });
    }
  },

  setServer = {
    command: ['!setserver'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Bot, Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const value = messageObj.content.split(/ (.+)/)[1].replace(/([\<\@\!\>])/g, '');
        return Game.fetchCommand({
          command: 'setServer',
          author: messageObj.author,
          Bot,
          value
        });
      }

      return messageObj.author.send('Please input server ID after the command. (ex: !setserver 11111111)');
    }
  },

  map = {
    command: ['!map', '!m'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { messageObj } = params;
      let mapInfo = '';
      maps.forEach((map) => {
        mapInfo = mapInfo.concat(`\n${map.name} (${map.biome.name}) Coordinates: ${map.coords}`);
      });

      messageObj.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
    }
  },

  lore = {
    command: '!lore',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitMessage = messageObj.content.split(/ (.+)/)[1].toLowerCase();
        const requestedMap = maps.filter(map => map.name.toLowerCase() === splitMessage)
          .map(map => map.lore);

        if (requestedMap.length === 0) {
          return messageObj.author.send(`${splitMessage} was not found. Did you type the map correctly?`);
        }

        return messageObj.author.send(`\`\`\`${splitMessage}: ${requestedMap[0]}\`\`\``);
      }

      return messageObj.author.send('You must enter a map to retrieve its lore. Check `!help` for more info.');
    }
  },

  bugreport = {
    command: '!bugreport',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { messageObj, Bot } = params;
      if (messageObj.content.includes(' ')) {
        const report = messageObj.content.split(/ (.+)/)[1];
        const mainServer = Bot.guilds.find(guild => guild.id === '390509935097675777');
        if (mainServer.members.find(member => member.id === messageObj.author.id)) {
          return messageObj.author.send('Just send this in the bug reports channel. You\'re already in the official server');
        }

        return mainServer.channels
          .find(channel => channel.id === '392360791245848586')
          .send(`Bug Report:\n${report}`)
          .then((message) => {
            const guild = message.guild ? message.guild.name : '';
            const author = messageObj.author.id;
            infoLog.info({ type: 'bugreport', from: author, guild, report });
            return messageObj.author.send('Message has been sent to official server.');
          });
      }

      return messageObj.author.send('You must have a message included in the bugreport.');
    }
  },

  top10 = {
    command: '!top10',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj, guildId, Bot } = params;
      switch ((messageObj.content.split(/ (.+)/)[1] === undefined) ? 'level' : messageObj.content.split(/ (.+)/)[1].toLowerCase()) {
        case 'gambles':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { gambles: -1 },
            guildId,
            Bot
          });
          break;
        case 'stolen':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { stolen: -1 },
            guildId,
            Bot
          });
          break;
        case 'stole':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { stole: -1 },
            guildId,
            Bot
          });
          break;
        case 'gold':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { 'gold.current': -1 },
            guildId,
            Bot
          });
          break;
        case 'spells':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { spellCast: -1 },
            guildId,
            Bot
          });
          break;
        case 'events':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { events: -1 },
            guildId,
            Bot
          });
          break;
        case 'bounty':
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { currentBounty: -1 },
            guildId,
            Bot
          });
          break;
        default:
          Game.fetchCommand({
            command: 'top10',
            author: messageObj.author,
            type: { level: -1 },
            guildId,
            Bot
          });
          break;
      }
    }
  },

  rank = {
    command: '!rank',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj, guildId, Bot } = params;
      switch ((messageObj.content.split(/ (.+)/)[1] === undefined) ? 'level' : messageObj.content.split(/ (.+)/)[1].toLowerCase()) {
        case 'gambles':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { gambles: -1 },
            guildId,
            Bot
          });
          break;
        case 'stolen':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { stolen: -1 },
            guildId,
            Bot
          });
          break;
        case 'stole':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { stole: -1 },
            guildId,
            Bot
          });
          break;
        case 'gold':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { 'gold.current': -1 },
            guildId,
            Bot
          });
          break;
        case 'spells':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { spellCast: -1 },
            guildId,
            Bot
          });
          break;
        case 'events':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { events: -1 },
            guildId,
            Bot
          });
          break;
        case 'bounty':
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { currentBounty: -1 },
            guildId,
            Bot
          });
          break;
        default:
          Game.fetchCommand({
            command: 'getRank',
            author: messageObj.author,
            type: { level: -1 },
            guildId,
            Bot
          });
          break;
      }
    }
  },

  castSpell = {
    command: ['!castspell', '!cs'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Bot, Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const amount = messageObj.content.split(' ')[2];
        return Game.fetchCommand({
          Game,
          command: 'castSpell',
          author: messageObj.author,
          Bot,
          amount: amount ? amount : 1,
          spell: messageObj.content.split(' ')[1].toLowerCase()
        });
      }
      let spellsString = '```List of Spells:\n  ';
      spellsString = spellsString.concat(Object.keys(spells).map(spell => `${spell} - ${spells[spell].spellCost} gold - ${spells[spell].description}`).join('\n  '));

      return messageObj.author.send(spellsString.concat('```'));
    }
  },

  changeServerPrefix = {
    command: ['!prefix'],
    operatorOnly: false,
    serverOperatorOnly: true,
    function: async (params) => {
      const { Game, Bot, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitArray = messageObj.content.split(' ');
        if (splitArray.length === 3) {
          const guildToUpdate = Bot.guilds.find(guild => guild.id === splitArray[1]);
          if (!guildToUpdate) {
            return messageObj.author.send('No guild found with this ID');
          }
          const memberToCheckPermission = guildToUpdate.find(member => member.id === messageObj.author.id);
          if (!memberToCheckPermission) {
            return messageObj.author.send('You were not found within this guild');
          }
          if (!memberToCheckPermission.hasPermission('MANAGE_GUILD')) {
            return messageObj.author.send('You do not have the permission to change the prefix for this guild');
          }

          const newPrefix = splitArray[2];
          if (newPrefix.includes(' ') || newPrefix.includes('\n')) {
            return messageObj.author.send('Please do not use a whitespace inside the prefix');
          }
          const result = await Game.fetchCommand({
            Bot,
            command: 'modifyServerPrefix',
            author: messageObj.author,
            guildId: guildToUpdate.id,
            value: newPrefix
          });
          if (result) {
            Game.getGuildCommandPrefix(guildToUpdate.id).prefix = newPrefix;
          }
        } else if (splitArray.length === 2) {
          const guildToUpdate = Bot.guilds.find(guild => guild.id === messageObj.guild.id);
          if (!guildToUpdate) {
            return messageObj.author.send('No guild found with this ID');
          }
          const memberToCheckPermission = guildToUpdate.members.find(member => member.id === messageObj.author.id);
          if (!memberToCheckPermission) {
            return messageObj.author.send('You were not found within this guild');
          }
          if (!memberToCheckPermission.hasPermission('MANAGE_GUILD')) {
            return messageObj.author.send('You do not have the permission to change the prefix for this guild');
          }

          const newPrefix = splitArray[1];
          if (newPrefix.includes(' ') || newPrefix.includes('\n')) {
            return messageObj.author.send('Please do not use a whitespace inside the prefix');
          }
          const result = await Game.fetchCommand({
            Bot,
            command: 'modifyServerPrefix',
            author: messageObj.author,
            guildId: guildToUpdate.id,
            value: newPrefix
          });
          if (result) {
            Game.getGuildCommandPrefix(guildToUpdate.id).prefix = newPrefix;
          }
        }
      }
    }
  },

  /**
   * places a bounty on a specific player for a specific amount should work with @playername and then a gold amount
   */
  placeBounty = {
    command: ['!bounty', '!b'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, Bot, messageObj } = params;
      const splitArray = messageObj.content.split(' ');
      if (messageObj.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];

        if (Number(amount) <= 0 || Number(amount) % 1 !== 0 || !amount.match(/^\d+$/)) {
          return messageObj.author.send('Please use a regular amount of gold.');
        }
        if (Number(amount) < 100) {
          return messageObj.author.send('You must place a bounty higher or equal to 100');
        }
        if (!recipient.match(/^\d+$/)) {
          return messageObj.author.send('Please add a bounty to a player.');
        }
        if (recipient === messageObj.author.id) {
          return messageObj.author.send('You can\'t give yourself a bounty.');
        }
        return Game.fetchCommand({
          command: 'placeBounty',
          author: messageObj.author,
          Bot,
          recipient,
          amount: Number(amount)
        });
      }

      return messageObj.author.send('Please specify a player and amount of gold you wish to place on their head. You need to have enough gold to put on their head');
    }
  },

  eventLog = {
    command: ['!eventlog', '!el'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitCommand = messageObj.content.split(/ (.+)/);
        return Game.fetchCommand({
          command: 'playerEventLog',
          author: splitCommand[1].replace(/([\<\@\!\>])/g, ''),
          amount: 15
        })
          .then((result) => {
            if (!result || result.length === 0) {
              return messageObj.author.send('This player has not activated any Events yet.');
            }

            return messageObj.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return Game.fetchCommand({
        command: 'playerEventLog',
        author: messageObj.author.id,
        amount: 15
      })
        .then((result) => {
          if (!result || result.length === 0) {
            return messageObj.author.send('You have not activated any Events yet.');
          }

          return messageObj.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  pvpLog = {
    command: ['!pvplog', '!pl'],
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitCommand = messageObj.content.split(/ (.+)/);
        return Game.fetchCommand({
          command: 'playerPvpLog',
          author: splitCommand[1].replace(/([\<\@\!\>])/g, ''),
          amount: 15
        })
          .then((result) => {
            if (!result || result.length === 0) {
              return messageObj.author.send('This player has not had any PvP Events yet.');
            }

            return messageObj.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return Game.fetchCommand({
        command: 'playerPvpLog',
        author: messageObj.author.id,
        amount: 15
      })
        .then((result) => {
          if (!result || result.length === 0) {
            return messageObj.author.send('You have not had any PvP Events yet.');
          }

          return messageObj.author.send(`\`\`\`${result}\`\`\``);
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
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitCommand = messageObj.content.split(/ (.+)/);
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
            return Game.fetchCommand({
              command: 'modifyPM',
              author: messageObj.author,
              value: splitCommand[1] === 'on',
              filtered: false
            });
          case 'filtered':
            return Game.fetchCommand({
              command: 'modifyPM',
              author: messageObj.author,
              value: true,
              filtered: true
            });
        }
      }

      return messageObj.author.send(`\`\`\`Possible options:
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
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitCommand = messageObj.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
          case 'action':
          case 'move':
            return Game.fetchCommand({
              command: 'modifyMention',
              author: messageObj.author,
              value: splitCommand[1].toLowerCase()
            });
        }
      }

      return messageObj.author.send(`\`\`\`Possible options:
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
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        const splitCommand = messageObj.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'male':
          case 'female':
          case 'neutral':
          case 'neuter':
            return Game.fetchCommand({
              command: 'modifyGender',
              author: messageObj.author,
              value: splitCommand[1]
            });
        }
      }

      return messageObj.author.send(`\`\`\`Possible options:
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
    function: (params) => {
      const { Game, messageObj } = params;
      const splitArray = messageObj.content.split(' ');
      if (messageObj.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        Game.fetchCommand({
          command: 'setPlayerBounty',
          recipient,
          amount: Number(amount)
        });
        return messageObj.author.send('Done');
      }
    }
  },

  setPlayerGold = {
    command: '!setgold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      const splitArray = messageObj.content.split(' ');
      if (messageObj.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        Game.fetchCommand({
          command: 'setPlayerGold',
          recipient,
          amount: Number(amount)
        });
        return messageObj.author.send('Done');
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
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ') && messageObj.content.split(' ').length > 2) {
        const splitCommand = messageObj.content.split(' ');
        Game.fetchCommand({
          command: 'giveGold',
          recipient: splitCommand[1],
          amount: splitCommand[2]
        })
          .then(() => {
            messageObj.author.send('Done.');
          });
      }
    }
  },

  resetPlayer = {
    command: '!resetplayer',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        Game.fetchCommand({
          command: 'deletePlayer',
          recipient: messageObj.content.split(/ (.+)/)[1]
        })
          .then(() => {
            messageObj.author.send('Done.');
          });
      }
    }
  },

  removeLotteryPlayers = {
    command: '!resetlottery',
    operatorOnly: true,
    function: (params) => {
      const { Game, messageObj } = params;
      if (messageObj.content.includes(' ')) {
        Game.fetchCommand({
          command: 'resetLotteryPlayers',
          author: messageObj.author,
          recipient: messageObj.content.split(/ (.+)/)[1]
        });
      }
    }
  },

  resetAll = {
    command: '!resetall',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      game.deleteAllPlayers(discordBot)
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

  invite = {
    command: '!invite',
    operatorOnly: false,
    function: (params) => {
      const { messageObj } = params;
      messageObj.author.send('Official Server: <https://discord.gg/nAEBTcj>\
\nInvite Bot Link: <https://discordapp.com/oauth2/authorize?client_id=385539681460420612&scope=bot&permissions=27664>\
\n1. You\'ll need `Manage Server` Permission in order to see the server within the invite dropbox.\
\n2. Once invited the bot will create the leaderboards, command, actions, move channel once joining.\
\n3. Since multiple bots use ! as their command prefix do not forget to change your prefix if you want. (eg. !prefix ?)');
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

  randomRepo = {
    command: '!ranrepo',
    function: (game, message) => {
      GitHub.randomRepo()
        .then((repoList) => {
          const ranIndex = game.helperGetter().randomBetween(0, repoList.length);
          const randomRepo = repoList[ranIndex];
          message.reply(`\nRepo: ${randomRepo.name}\nOwner: ${randomRepo.owner.login}\n${randomRepo.url.replace('api.', '').replace('/repos', '')}`);
        });
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
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const word = message.content.split(/ (.+)/)[1].toLowerCase().replace(' ', '+');

        return Urban.searchUrbanDictionary(word)
          .then((result) => {
            let definition = 'Urban Dictionary Definition of ****\n```';
            const wordDefinition = result.list.sort((item1, item2) => {
              return item2.thumbs_up - item1.thumbs_up;
            })[0];
            definition = definition.replace('****', `\`${game.helperGetter().capitalizeFirstLetter(wordDefinition.word).replace('+', ' ')}\``);

            if (definition.length >= 2000) {
              return message.reply('The result of this search was more than 2000 characters (Discords message limit) and I`m too lazy to split it for you. Have a nice day.');
            }

            return message.reply(definition.concat(`Definition:\n${wordDefinition.definition}\n\nExample:\n${wordDefinition.example}\`\`\`\n[:thumbsup::${wordDefinition.thumbs_up} / :thumbsdown::${wordDefinition.thumbs_down}]`));
          });
      }

      return message.reply('Please specify a word to look up.');
    }
  }
];
module.exports = commands;
