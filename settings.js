const settings = {
  rootPath: __dirname,
  battleDebug: false,
  eventDebug: false,
  pvpLevelRestriction: 5,
  guildID: process.env.GUILD_ID,
  botLoginToken: process.env.NODE_ENV.includes('production')
    ? process.env.DISCORD_BOT_LOGIN_TOKEN
    : process.env.TEST_DISCORD_BOT_LOGIN_TOKEN,
  minimalTimer: process.env.NODE_ENV.includes('production') ? process.env.MIN_TIMER : process.env.TEST_MIN_TIMER,
  maximumTimer: process.env.NODE_ENV.includes('production') ? process.env.MAX_TIMER : process.env.TEST_MAX_TIMER,
  botOperators: process.env.DISCORD_BOT_OPERATORS_ID.replace(' ', '').split(','),
  mongoDBUri: process.env.MONGODB_URI ? process.env.JAWSDB_URL,
  starterTown: [3, 5],
  multiplier: 1
};
module.exports = settings;
