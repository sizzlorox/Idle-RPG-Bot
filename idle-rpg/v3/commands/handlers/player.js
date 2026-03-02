const enumHelper = require('../../../utils/enumHelper');
const titles = require('../../../v2/idle-rpg/data/titles');
const { objectContainsName } = require('../../utils/helpers');
const { generateStatsString, generateEquipmentsString, generateInventoryString, generateSpellBookString } = require('../../utils/formatters');

module.exports = [
  {
    aliases: ['!stats', '!s'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      const playerToCheck = mentionedUser || author;
      const loadedPlayer = await game.db.loadPlayer(playerToCheck.id, enumHelper.statsSelectFields);
      if (!loadedPlayer) {
        return mentionedUser && mentionedUser.id !== author.id
          ? author.send('This character was not found! This player probably was not born yet.')
          : author.send('Your character was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
      }
      const result = generateStatsString(loadedPlayer);
      return mentionedUser && mentionedUser.id !== author.id
        ? author.send(result.replace('Here are your stats!', `Here are ${loadedPlayer.name}'s stats!`))
        : author.send(result);
    }
  },
  {
    aliases: ['!equip', '!e'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      const playerToCheck = mentionedUser || author;
      const loadedPlayer = await game.db.loadPlayer(playerToCheck.id, enumHelper.equipSelectFields);
      if (!loadedPlayer) {
        return mentionedUser && mentionedUser.id !== author.id
          ? author.send('This players equipment was not found! This player probably was not born yet.')
          : author.send('Your equipment was not found! You probably were not born yet.');
      }
      const result = generateEquipmentsString(loadedPlayer);
      return mentionedUser && mentionedUser.id !== author.id
        ? author.send(result.replace('Here is your equipment!', `Here is ${loadedPlayer.name}'s equipment!`))
        : author.send(result);
    }
  },
  {
    aliases: ['!character', '!char', '!c'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      const playerToCheck = mentionedUser || author;
      const loadedPlayer = await game.db.loadPlayer(playerToCheck.id, enumHelper.statsSelectFields);
      if (!loadedPlayer) {
        return mentionedUser && mentionedUser.id !== author.id
          ? author.send('This character was not found!')
          : author.send('Your character was not found!');
      }
      const statsResult = generateStatsString(loadedPlayer);
      const equipResult = generateEquipmentsString(loadedPlayer);
      const combined = mentionedUser && mentionedUser.id !== author.id
        ? statsResult.replace('Here are your stats!', `Here are ${loadedPlayer.name}'s stats!`)
        : statsResult;
      await author.send(combined);
      return author.send(equipResult);
    }
  },
  {
    aliases: ['!inventory', '!inv'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const loadedPlayer = await game.db.loadPlayer(author.id, enumHelper.inventorySelectFields);
      if (!loadedPlayer) return author.send('Your character was not found!');
      const result = generateInventoryString(loadedPlayer);
      return author.send(result);
    }
  },
  {
    aliases: ['!titles', '!t'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const loadedPlayer = await game.db.loadPlayer(author.id, { titles: -1 });
      if (!loadedPlayer || loadedPlayer.titles.unlocked.length <= 0) {
        return author.send('I\'m sorry, you currently do not have any titles unlocked.');
      }
      return author.send(`You currently have ${loadedPlayer.titles.unlocked.join(', ')} unlocked!\nUse \`!st\` or \`!settitle <title>\` to change titles.`);
    }
  },
  {
    aliases: ['!settitle', '!st'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const args = message.content.split(' ');
      const value = args.slice(1).join(' ');
      if (!value || !objectContainsName(titles, value)) {
        return author.send(`${value || '(nothing)'} is not a title.`);
      }
      const loadedPlayer = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
      if (!loadedPlayer || loadedPlayer.titles.unlocked.length <= 0) {
        return author.send('I\'m sorry, but you have no titles unlocked as of yet.');
      }
      if (!loadedPlayer.titles.unlocked.includes(value)) {
        return author.send('You do not have this title unlocked!');
      }
      loadedPlayer.titles.current = value;
      await game.db.savePlayer(loadedPlayer);
      return author.send(`Title has been set to ${value}, you're now known as ${loadedPlayer.name} the ${value}.`);
    }
  },
  {
    aliases: ['!spellbook', '!sb'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      const playerToCheck = mentionedUser || author;
      const loadedPlayer = await game.db.loadPlayer(playerToCheck.id, enumHelper.statsSelectFields);
      if (!loadedPlayer) {
        return mentionedUser && mentionedUser.id !== author.id
          ? author.send('This players spellbook was not found!')
          : author.send('Your spellbook was not found!');
      }
      const result = generateSpellBookString(loadedPlayer);
      return mentionedUser && mentionedUser.id !== author.id
        ? author.send(result.replace('Here\'s your spellbook!', `Here\'s ${loadedPlayer.name}'s spellbook!`))
        : author.send(result);
    }
  },
  {
    aliases: ['!stolenequip', '!se'],
    operatorOnly: false,
    channelOnly: true,
    handler: async ({ game, bot, message, guildId, author }) => {
      const mentionedUser = message.mentions.users.first();
      let recipient;
      let header;
      if (mentionedUser && mentionedUser.id !== author.id) {
        recipient = await game.db.loadPlayer(mentionedUser.id, { pastEvents: 0, pastPvpEvents: 0 });
        if (!recipient) return author.send('This player was not found! They probably have not been born yet.');
        header = `Here is ${recipient.name}'s stolen equipment!`;
      } else {
        recipient = await game.db.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 });
        if (!recipient) return author.send('You have not been born yet!');
        header = 'Here is your stolen equipment!';
      }
      const stolenEquip = await game.db.getStolenEquip(recipient);
      if (stolenEquip && stolenEquip.length > 0) {
        return author.send(`\`\`\`${header}\n${stolenEquip}\`\`\``);
      }
      return author.send(`${author.id === recipient.discordId ? 'You have' : `${recipient.name} has`} no stolen equipment.`);
    }
  }
];
