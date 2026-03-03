const { ChannelType } = require('discord.js');
const { randomBetween } = require('../../utils/helpers');
const monsters = require('../../../game/data/monsters');

async function invasionRandom(bot, game) {
  const mobTypeNames = monsters.type.filter(t => t.isSpawnable).map(t => t.name);

  for (const guild of bot.guilds.cache.values()) {
    const invasionDice = randomBetween(0, 99);
    const guildConfig = game.guildConfigs.get(guild.id) || await game.db.loadGame(guild.id);
    if (invasionDice <= 19 && !guildConfig.events.isInvasionActive) {
      const mobType = mobTypeNames[randomBetween(0, mobTypeNames.length - 1)];
      const actionChannel = guild.channels.cache.find(channel => channel && channel.name === 'actions' && channel.type === ChannelType.GuildText);
      if (actionChannel) actionChannel.send(`\`\`\`css\n A horde of ${mobType}s is invading the land!\`\`\``);
      guildConfig.events.isInvasionActive = true;
      guildConfig.events.invasionMobType = mobType;
      await game.db.updateGame(guild.id, guildConfig);
      game.guildConfigs.set(guild.id, guildConfig);
      setTimeout(async () => {
        if (actionChannel) actionChannel.send('```css\n The invasion has been repelled!```');
        guildConfig.events.isInvasionActive = false;
        guildConfig.events.invasionMobType = '';
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }, randomBetween(10800000, 28800000));
    }
  }
}

module.exports = { invasionRandom };
