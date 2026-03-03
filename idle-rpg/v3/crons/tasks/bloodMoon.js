const { ChannelType } = require('discord.js');
const { randomBetween } = require('../../utils/helpers');

async function bloodMoonRandom(bot, game) {
  for (const guild of bot.guilds.cache.values()) {
    const bloodMoonDice = randomBetween(0, 99);
    const guildConfig = game.guildConfigs.get(guild.id) || await game.db.loadGame(guild.id);
    if (bloodMoonDice <= 14 && !guildConfig.events.isBloodMoonActive && !guildConfig.events.isInvasionActive) {
      const actionChannel = guild.channels.cache.find(channel => channel && channel.name === 'actions' && channel.type === ChannelType.GuildText);
      if (actionChannel) actionChannel.send('```css\n A blood moon rises! Monsters are empowered but their loot is richer.```');
      guildConfig.events.isBloodMoonActive = true;
      await game.db.updateGame(guild.id, guildConfig);
      game.guildConfigs.set(guild.id, guildConfig);
      setTimeout(async () => {
        if (actionChannel) actionChannel.send('```css\n The blood moon has faded. The night returns to normal.```');
        guildConfig.events.isBloodMoonActive = false;
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }, randomBetween(7200000, 21600000));
    }
  }
}

module.exports = { bloodMoonRandom };
