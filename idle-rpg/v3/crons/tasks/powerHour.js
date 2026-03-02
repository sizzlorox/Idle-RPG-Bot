const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

function powerHourBegin(bot, game) {
  for (const guild of bot.guilds.cache.values()) {
    const actionsChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText && channel.parent && channel.parent.name === 'Idle-RPG');
    if (actionsChannel) {
      actionsChannel.send(setImportantMessage('Dark clouds are gathering in the sky. Something is about to happen...'));
    }
  }

  setTimeout(async () => {
    for (const guild of bot.guilds.cache.values()) {
      const actionsChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText && channel.parent && channel.parent.name === 'Idle-RPG');
      if (actionsChannel) {
        actionsChannel.send(setImportantMessage('You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!'));
        const guildConfig = await game.db.loadGame(guild.id);
        guildConfig.multiplier++;
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }
    }
  }, 1800000);

  setTimeout(async () => {
    for (const guild of bot.guilds.cache.values()) {
      const actionsChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText && channel.parent && channel.parent.name === 'Idle-RPG');
      if (actionsChannel) {
        actionsChannel.send(setImportantMessage('The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!'));
        const guildConfig = await game.db.loadGame(guild.id);
        guildConfig.multiplier = Math.max(1, guildConfig.multiplier - 1);
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }
    }
  }, 5400000);
}

module.exports = { powerHourBegin };
