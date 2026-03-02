const { ChannelType } = require('discord.js');
const { randomBetween } = require('../../utils/helpers');

async function blizzardRandom(bot, game) {
  for (const guild of bot.guilds.cache.values()) {
    const blizzardDice = randomBetween(0, 99);
    const guildConfig = game.guildConfigs.get(guild.id) || await game.db.loadGame(guild.id);
    if (blizzardDice <= 15 && !guildConfig.events.isBlizzardActive) {
      const actionChannel = guild.channels.cache.find(channel => channel && channel.name === 'actions' && channel.type === ChannelType.GuildText);
      if (actionChannel) actionChannel.send('```css\n A blizzard has just begun!```');
      guildConfig.events.isBlizzardActive = true;
      await game.db.updateGame(guild.id, guildConfig);
      game.guildConfigs.set(guild.id, guildConfig);
      setTimeout(async () => {
        if (actionChannel) actionChannel.send('```css\n The blizzard has ended!```');
        guildConfig.events.isBlizzardActive = false;
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }, randomBetween(7200000, 72000000));
    }
  }
}

module.exports = { blizzardRandom };
