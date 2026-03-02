const enumHelper = require('../../../utils/enumHelper');
const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

module.exports = [
  {
    aliases: ['!reset'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const targetGuildId = args[1] || guildId;
      const guild = bot.guilds.cache.get(targetGuildId);
      if (!guild) return author.send('No guild with that id');

      const defaultConfig = { multiplier: 1, spells: { activeBless: 0 }, dailyLottery: { prizePool: 1500 } };
      await game.db.resetAllPlayersInGuild(targetGuildId);
      await game.db.resetAllLogs(targetGuildId);
      await game.db.updateGame(targetGuildId, defaultConfig);
      await game.db.removeLotteryPlayers(targetGuildId);
      game.guildConfigs.set(targetGuildId, defaultConfig);

      const actionChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText);
      const movementChannel = guild.channels.cache.find(channel => channel.name === 'movement' && channel.type === ChannelType.GuildText);
      if (actionChannel) await actionChannel.send('```RESET -----------------------------------```');
      if (movementChannel) await movementChannel.send('```RESET -----------------------------------```');
      return author.send('Reset complete...');
    }
  },
  {
    aliases: ['!setgold'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      const args = message.content.split(' ');
      const amount = parseInt(args[args.length - 1]);
      if (!mentionedUser) return author.send('Please mention a player. Usage: `!setgold @Player <amount>`');
      if (isNaN(amount)) return author.send('Please specify a valid amount.');
      const player = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('Player not found.');
      player.gold.current = Number(amount);
      player.gold.total += Number(amount);
      await game.db.savePlayer(player);
      return author.send(`Set ${player.name}'s gold to ${amount}.`);
    }
  },
  {
    aliases: ['!updateholiday'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const whichHoliday = args[1];
      const isStarting = args[2] === 'start';
      if (!whichHoliday) return author.send('Usage: `!updateholiday <holiday> <start|end>`');

      if (isStarting) {
        game.monsterGen.monsters.forEach((mob) => { if (mob.holiday === whichHoliday) mob.isSpawnable = true; });
        game.itemGen.items.forEach((type) => { type.forEach((item) => { if (item.holiday === whichHoliday) item.isDroppable = true; }); });
      } else {
        game.monsterGen.monsters.forEach((mob) => { if (mob.holiday === whichHoliday) mob.isSpawnable = false; });
        game.itemGen.items.forEach((type) => { type.forEach((item) => { if (item.holiday === whichHoliday) item.isDroppable = false; }); });
      }

      bot.guilds.cache.forEach(guild => {
        const actionChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText);
        if (actionChannel) actionChannel.send(`Holiday ${whichHoliday} has ${isStarting ? 'started' : 'ended'}!`);
      });
      return author.send(`Holiday ${whichHoliday} ${isStarting ? 'start' : 'end'} processed.`);
    }
  },
  {
    aliases: ['!prefix'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const value = args[1];
      if (!value) return author.send('Usage: `!prefix <new_prefix>`');
      const loadedConfig = await game.db.loadGame(guildId);
      loadedConfig.commandPrefix = value;
      await game.db.updateGame(guildId, loadedConfig);
      game.guildConfigs.set(guildId, loadedConfig);
      return author.send(`Changed server command prefix to ${value}.`);
    }
  },
  {
    aliases: ['!additem'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) return author.send('Please mention a player. Usage: `!additem @Player`');
      const player = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('Player not found.');
      const item = await game.itemGen.generateItem(player);
      player.inventory.equipment.push(item);
      await game.db.savePlayer(player);
      return author.send(`Added \`${item.name}\` to ${player.name}'s inventory.`);
    }
  },
  {
    aliases: ['!addspell'],
    operatorOnly: true,
    channelOnly: false,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) return author.send('Please mention a player. Usage: `!addspell @Player`');
      const player = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!player) return author.send('Player not found.');
      const spell = game.spellGen.generateSpell(player);
      player.spells.push(spell);
      await game.db.savePlayer(player);
      return author.send(`Added spell \`${spell.name}\` to ${player.name}'s spellbook.`);
    }
  }
];
