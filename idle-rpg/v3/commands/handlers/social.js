const enumHelper = require('../../../utils/enumHelper');
const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');
const maps = require('../../../game/data/maps');
const pkg = require('../../../../package.json');

const typeMap = {
  gold: { 'gold.current': -1 },
  level: { level: -1 },
  spells: { spellCast: -1 },
  stolen: { stolen: -1 },
  stole: { stole: -1 },
  gambles: { gambles: -1 },
  events: { events: -1 },
  bounty: { currentBounty: -1 },
  'kills.player': { 'kills.player': -1 },
  'deaths.mob': { 'deaths.mob': -1 }
};

module.exports = [
  {
    aliases: ['!help', '!h'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const helpMsg = `You can private message me these commands except for checking other players!
\`\`\`!top10 - Retrieves top 10 highest level players
!top10 <gold, spells, level, stolen, stole, gambles, events, bounty> - Top 10 of selected section
!rank <gold, spells, level, stolen, stole, gambles, events, bounty> - Your current rank
!s, !stats - Sends a PM with your stats
!s, !stats @Player - Sends a PM with the player's stats
!e, !equip - Sends a PM with your equipment
!e, !equip @Player - Sends a PM with the player's equipment
!c, !char, !character - Sends PM with your stats and equipment
!inv, !inventory - Sends PM with your inventory
!m, !map - Displays the world's locations
!multi, !multiplier - Displays current multiplier
!cs, !castspell - Lists available global spells
!cs, !castspell <spell> [amount] - Casts a global spell
!t, !titles - Lists your unlocked titles
!st, !settitle <title> - Sets your active title
!sb, !spellbook - Sends PM with your spellbook
!l, !lottery - Join the daily lottery (costs 100 gold)
!q, !quest - Reset your current quest (must be 2 days old)
!el, !eventlog [amount] - Shows your event log
!pl, !pvplog [amount] - Shows your PvP log
!ml, !movelog [amount] - Shows your movement log
!cl, !clearlog - Clears all your logs
!equips <index> - Equip item from inventory
!unequips <slot> - Unequip item to inventory
!sells - Sell all inventory items
!buys - Buy a random item from town
!bounty @Player - Checks a player's bounty
!pb, !placeBounty @Player <amount> - Place bounty on a player
!top10 - See leaderboards
!rank - See your rank
!version - Shows bot version\`\`\``;
      return author.send(helpMsg);
    }
  },
  {
    aliases: ['!top10'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const typeArg = args[1] ? args[1].toLowerCase() : 'level';
      const type = typeMap[typeArg] || typeMap['level'];
      const fieldKey = Object.keys(type)[0];
      const isNested = fieldKey.includes('.');
      const fieldKeys = isNested ? fieldKey.split('.') : null;
      const loadedTop10 = await game.db.loadTop10(type, guildId, bot.user.id);
      const rankString = loadedTop10
        .filter(player => isNested ? player[fieldKeys[0]][fieldKeys[1]] : player[fieldKey] > 0)
        .sort((p1, p2) => {
          if (fieldKey === 'level') return p2.experience.current - p1.experience.current && p2.level - p1.level;
          if (isNested) return p2[fieldKeys[0]][fieldKeys[1]] - p1[fieldKeys[0]][fieldKeys[1]];
          return p2[fieldKey] - p1[fieldKey];
        })
        .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${isNested ? `${fieldKeys[0]}: ${player[fieldKeys[0]][fieldKeys[1]]}` : `${fieldKey.replace('currentBounty', 'Bounty')}: ${player[fieldKey]}`}`)
        .join('\n');
      return author.send(`\`\`\`Top 10 ${typeArg}:\n${rankString}\`\`\``);
    }
  },
  {
    aliases: ['!rank'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const typeArg = args[1] ? args[1].toLowerCase() : 'level';
      const type = typeMap[typeArg] || typeMap['level'];
      const player = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('You have not been born yet!');
      const rank = await game.db.loadCurrentRank(player, type);
      return author.send(`You're currently ranked ${rank + 1} in ${typeArg}!`);
    }
  },
  {
    aliases: ['!bounty'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) return author.send('Please mention a player to check bounty. Usage: `!bounty @Player`');
      const player = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('Player not found.');
      return author.send(`${player.name}'s current bounty is ${player.currentBounty} gold.`);
    }
  },
  {
    aliases: ['!placebounty', '!pb'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const mentionedUser = message.mentions.users.first();
      const amount = parseInt(args[args.length - 1]);
      if (!mentionedUser) return author.send('Please mention a player. Usage: `!placeBounty @Player <amount>`');
      if (isNaN(amount) || amount <= 0) return author.send('Please specify a valid gold amount.');
      const bountyPlacer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!bountyPlacer) return author.send('You have not been born yet!');
      if (bountyPlacer.gold.current < amount) return author.send('You need more gold to place this bounty.');
      const bountyRecipient = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!bountyRecipient) return author.send('This player does not exist.');
      bountyPlacer.gold.current -= Number(amount);
      bountyRecipient.currentBounty += Number(amount);
      const actionsChannel = bot.guilds.cache.get(bountyPlacer.guildId) && bot.guilds.cache.get(bountyPlacer.guildId).channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText);
      await game.db.savePlayer(bountyPlacer);
      await game.db.savePlayer(bountyRecipient);
      if (actionsChannel) {
        await actionsChannel.send(setImportantMessage(`${bountyPlacer.name} just put a bounty of ${amount} gold on ${bountyRecipient.name}'s head!`));
      }
      return author.send(`Bounty of ${amount} placed on ${bountyRecipient.name}'s head!`);
    }
  },
  {
    aliases: ['!version'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      return author.send(`Idle-RPG Bot v${pkg.version || '3.0.0'}`);
    }
  },
  {
    aliases: ['!patreon'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      return author.send('If you would like to show your support you can become a patron!\nKeep in mind that you gain no advantage over the others, this is purely to show your support to the developer!\n<https://www.patreon.com/sizzlorox>');
    }
  },
  {
    aliases: ['!invite'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      return author.send('Official Server: <https://discord.gg/nAEBTcj>\nInvite Bot Link: <https://discordapp.com/oauth2/authorize?client_id=385539681460420612&scope=bot&permissions=27664>\n1. You\'ll need `Manage Server` Permission in order to see the server within the invite dropbox.\n2. Once invited the bot will create the leaderboards, command, actions, move channel once joining.\n3. Since multiple bots use ! as their command prefix do not forget to change your prefix if you want. (eg. !prefix ?)');
    }
  },
  {
    aliases: ['!bugreport', '!br'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(/ (.+)/);
      const report = args[1] ? args[1].trim() : null;
      if (!report) {
        return author.send('You must have a message included in the bugreport. Usage: `!bugreport <message>`\nAlternatively, open an issue directly at <https://github.com/sizzlorox/Idle-RPG-Bot/issues>');
      }
      return author.send('Please open an issue directly at <https://github.com/sizzlorox/Idle-RPG-Bot/issues>');
    }
  },
  {
    aliases: ['!prizepool'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const player = await game.db.loadPlayer(author.id, { guildId: 1 });
      if (!player) return author.send('You have not been born yet!');
      const lotteryPlayers = await game.db.loadLotteryPlayers(player.guildId);
      const guildConfig = await game.db.loadGame(player.guildId);
      return author.send(`There are ${lotteryPlayers.length} contestants for a prize pool of ${guildConfig.dailyLottery.prizePool} gold!`);
    }
  },
  {
    aliases: ['!lore'],
    operatorOnly: false,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(/ (.+)/);
      if (!args[1]) {
        return author.send('You must enter a map name to retrieve its lore. Usage: `!lore <Map Name>`');
      }
      const mapName = args[1].trim().toLowerCase();
      const matchedMap = maps.find(m => m.name.toLowerCase() === mapName);
      if (!matchedMap) {
        return author.send(`${args[1].trim()} was not found. Did you type the map name correctly?`);
      }
      if (!matchedMap.lore) {
        return author.send(`\`\`\`${matchedMap.name}: No lore available for this location.\`\`\``);
      }
      return author.send(`\`\`\`${matchedMap.name}: ${matchedMap.lore}\`\`\``);
    }
  }
];
