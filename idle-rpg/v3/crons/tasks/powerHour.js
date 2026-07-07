const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

async function powerHourBegin(bot, game) {
  console.log('Running powerHourBegin cron');
  await Promise.all(
    Array.from(bot.guilds.cache.values()).map(async (guild) => {
      const actionsChannel = guild.channels.cache.find(
        (channel) =>
          channel.name === 'actions' &&
          channel.type === ChannelType.GuildText &&
          channel.parent &&
          channel.parent.name === 'Idle-RPG',
      );
      if (actionsChannel) {
        actionsChannel.send(
          setImportantMessage(
            'Dark clouds are gathering in the sky. Something is about to happen...',
          ),
        );
      }
    }),
  );

  setTimeout(async () => {
    await Promise.all([
      ...Array.from(bot.guilds.cache.values()).map(async (guild) => {
        const actionsChannel = guild.channels.cache.find(
          (channel) =>
            channel.name === 'actions' &&
            channel.type === ChannelType.GuildText &&
            channel.parent &&
            channel.parent.name === 'Idle-RPG',
        );
        if (actionsChannel) {
          actionsChannel.send(
            setImportantMessage(
              'You suddenly feel energy building up within the sky, the clouds get darker, you hear monsters screeching nearby! Power Hour has begun!',
            ),
          );
        }
      }),
      game.db.beginPowerHour(),
    ]);
  }, 1800000);

}

// Ends power hour via a cron (runOnInit) instead of an in-memory timeout, so a Heroku
// restart during power hour cannot lose the decrement and leak the multiplier.
async function expirePowerHour(bot, game) {
  await Promise.all(
    Array.from(bot.guilds.cache.values()).map(async (guild) => {
      const guildConfig = await game.db.loadGame(guild.id);
      const powerHour = guildConfig.events && guildConfig.events.powerHour;
      if (!powerHour || !powerHour.isActive || powerHour.expiresAt > Date.now()) {
        return;
      }
      const ended = await game.db.endPowerHour(guild.id);
      if (!ended) return;
      const actionsChannel = guild.channels.cache.find(
        (channel) =>
          channel.name === 'actions' &&
          channel.type === ChannelType.GuildText &&
          channel.parent &&
          channel.parent.name === 'Idle-RPG',
      );
      if (actionsChannel) {
        actionsChannel.send(
          setImportantMessage(
            'The clouds are disappearing, soothing wind brushes upon your face. Power Hour has ended!',
          ),
        );
      }
    }),
  );
}

module.exports = { powerHourBegin, expirePowerHour };
