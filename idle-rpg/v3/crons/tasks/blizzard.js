const { ChannelType } = require('discord.js');
const { randomBetween } = require('../../utils/helpers');

async function blizzardRandom(bot, game) {
  await Promise.all(
    Array.from(bot.guilds.cache.values()).map(async (guild) => {
      const blizzardDice = randomBetween(0, 99);
      const guildConfig = await game.db.loadGame(guild.id);
      if (blizzardDice > 15) {
        return;
      }
      if (guildConfig.events.blizzard.isActive) {
        return;
      }
      const actionChannel = guild.channels.cache.find(
        (channel) =>
          channel && channel.name === 'actions' && channel.type === ChannelType.GuildText,
      );
      if (actionChannel) actionChannel.send('```css\n A blizzard has just begun!```');
      guildConfig.events.blizzard = {
        isActive: true,
        expiresAt: randomBetween(7200000, 72000000),
      };
      await game.db.updateGame(guild.id, guildConfig);
    }),
  );
}

async function expireBlizzard(bot, game) {
  await Promise.all(
    Array.from(bot.guilds.cache.values()).map(async (guild) => {
      const guildConfig = await game.db.loadGame(guild.id);
      if (!guildConfig.events.blizzard.isActive) {
        return;
      }
      const actionChannel = guild.channels.cache.find(
        (channel) =>
          channel && channel.name === 'actions' && channel.type === ChannelType.GuildText,
      );
      if (actionChannel) actionChannel.send('```css\n The blizzard has ended!```');
      guildConfig.events.blizzard = {
        isActive: false,
        expiresAt: 0,
      };
      await game.db.updateGame(guild.id, guildConfig);
    }),
  );
}

module.exports = { blizzardRandom, expireBlizzard };
