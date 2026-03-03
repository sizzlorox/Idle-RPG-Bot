const { ChannelType } = require('discord.js');
const { randomBetween } = require('../../utils/helpers');

const BIOME_WEATHER = {
  forest:    ['fog', 'rain', 'thunderstorm'],
  mountains: ['snowfall', 'storm', 'blizzard-like cold'],
  desert:    ['sandstorm', 'heatwave'],
  coast:     ['storm', 'fog', 'sea mist'],
  swamp:     ['fog', 'torrential rain'],
  plains:    ['thunderstorm', 'gusty winds'],
  haunted:   ['eerie mist', 'supernatural fog'],
  caves:     ['damp chill', 'eerie stillness'],
  plateau:   ['gusty winds', 'storm'],
  moors:     ['fog', 'rain'],
  grassland: ['rain', 'warm sunshine'],
};

const SPAWNABLE_BIOMES = Object.keys(BIOME_WEATHER);

async function weatherEventRandom(bot, game) {
  for (const guild of bot.guilds.cache.values()) {
    const weatherDice = randomBetween(0, 99);
    const guildConfig = game.guildConfigs.get(guild.id) || await game.db.loadGame(guild.id);
    if (weatherDice <= 39) {
      const biome = SPAWNABLE_BIOMES[randomBetween(0, SPAWNABLE_BIOMES.length - 1)];
      const weatherOptions = BIOME_WEATHER[biome];
      const weatherType = weatherOptions[randomBetween(0, weatherOptions.length - 1)];
      const actionChannel = guild.channels.cache.find(channel => channel && channel.name === 'actions' && channel.type === ChannelType.GuildText);
      if (actionChannel) actionChannel.send(`\`\`\`css\n A ${weatherType} has settled over the ${biome} region!\`\`\``);
      guildConfig.events.weather = { biome, type: weatherType };
      await game.db.updateGame(guild.id, guildConfig);
      game.guildConfigs.set(guild.id, guildConfig);
      setTimeout(async () => {
        if (actionChannel) actionChannel.send(`\`\`\`css\n The ${weatherType} over the ${biome} region has cleared.\`\`\``);
        guildConfig.events.weather = { biome: '', type: '' };
        await game.db.updateGame(guild.id, guildConfig);
        game.guildConfigs.set(guild.id, guildConfig);
      }, randomBetween(7200000, 21600000));
    }
  }
}

module.exports = { weatherEventRandom, BIOME_WEATHER };
