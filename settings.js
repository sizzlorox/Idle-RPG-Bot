const settings = {
  actionWebHookId: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_ACTION_WEBHOOK_ID
    : process.env.TEST_DISCORD_ACTION_WEBHOOK_ID,
  actionWebHookToken: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_ACTION_WEBHOOK_TOKEN
    : process.env.TEST_DISCORD_ACTION_WEBHOOK_TOKEN,
  moveWebHookId: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_MOVEMENT_WEBHOOK_ID
    : process.env.TEST_DISCORD_MOVEMENT_WEBHOOK_ID,
  moveWebHookToken: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_MOVEMENT_WEBHOOK_TOKEN
    : process.env.TEST_DISCORD_MOVEMENT_WEBHOOK_TOKEN,

  welcomeChannelId: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_RPG_WELCOME_CHANNEL_ID
    : process.env.TEST_DISCORD_RPG_WELCOME_CHANNEL_ID,
  faqChannelId: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_RPQ_FAQ_CHANNEL
    : process.env.TEST_DISCORD_RPQ_FAQ_CHANNEL,

  botLoginToken: process.env.NODE_ENV === 'production'
    ? process.env.DISCORD_BOT_LOGIN_TOKEN
    : process.env.TEST_DISCORD_BOT_LOGIN_TOKEN,

  minimalTimer: process.env.NODE_ENV === 'production' ? process.env.MIN_TIMER : process.env.TEST_MIN_TIMER,
  maximumTimer: process.env.NODE_ENV === 'production' ? process.env.MAX_TIMER : process.env.TEST_MAX_TIMER,

  botOperator: process.env.DISCORD_BOT_OPERATOR_ID,
  rpgChannel: process.env.DISCORD_RPG_CHANNEL_ID,
  commandChannel: process.env.DISCORD_RPG_COMMAND_CHANNEL_ID,
  mongoDBUri: process.env.MONGODB_URI,
  starterTown: 4,
  multiplier: 1
};
module.exports = settings;
