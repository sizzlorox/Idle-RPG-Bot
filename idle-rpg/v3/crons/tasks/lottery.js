const { ChannelType } = require('discord.js');
const enumHelper = require('../../../utils/enumHelper');
const { guildID } = require('../../../../settings');
const { setImportantMessage } = require('../../utils/messageHelpers');
const { randomBetween } = require('../../utils/helpers');

async function dailyLottery(bot, game) {
  if (!process.env.NODE_ENV.includes('production')) return;

  for (const guild of bot.guilds.cache.values()) {
    const guildLotteryPlayers = await game.db.loadLotteryPlayers(guild.id);
    if (!guildLotteryPlayers || guildLotteryPlayers.length <= 1) continue;

    const guildConfig = game.guildConfigs.get(guild.id) || await game.db.loadGame(guild.id);
    const randomWinner = randomBetween(0, guildLotteryPlayers.length - 1);
    const winner = guildLotteryPlayers[randomWinner];
    const eventMsg = setImportantMessage(`Out of ${guildLotteryPlayers.length} contestants, ${winner.name} has won the daily lottery of ${guildConfig.dailyLottery.prizePool} gold!`);
    const eventLog = `Congratulations! Out of ${guildLotteryPlayers.length} contestants, you just won ${guildConfig.dailyLottery.prizePool} gold from the daily lottery!`;
    const newPrizePool = randomBetween(1500, 10000);

    if (guild.id === guildID) {
      const lotteryChannel = guild.channels.cache.get(enumHelper.channels.lottery);
      if (lotteryChannel) {
        let lotteryMessages = await lotteryChannel.messages.fetch({ limit: 10 });
        lotteryMessages = lotteryMessages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp);
        const msgs = [...lotteryMessages.values()];
        const header = `Idle-RPG Lottery - You must pay 100 gold to enter! PM me \`!lottery\` to join!\nOut of ${guildLotteryPlayers.length} contestants, ${winner.name} has won the previous daily lottery of ${guildConfig.dailyLottery.prizePool} gold!`;
        if (lotteryMessages.size <= 0) {
          await lotteryChannel.send(header);
          await lotteryChannel.send(`Current lottery prize pool: ${newPrizePool}`);
          await lotteryChannel.send('Contestants:');
        } else {
          await msgs[0].edit(header);
          await msgs[1].edit(`Current lottery prize pool: ${newPrizePool}`);
          await msgs[2].edit('Contestants:');
        }
      }
    }

    winner.gold.current += guildConfig.dailyLottery.prizePool;
    winner.gold.total += guildConfig.dailyLottery.prizePool;
    winner.gold.dailyLottery += guildConfig.dailyLottery.prizePool;

    for (const player of guildLotteryPlayers) {
      const discordUser = guild.members.cache.get(player.discordId);
      if (!discordUser) continue;
      if (player.discordId !== winner.discordId) {
        discordUser.user.send(`Thank you for participating in the lottery! Unfortunately ${winner.name} has won the prize of ${guildConfig.dailyLottery.prizePool} out of ${guildLotteryPlayers.length} people.`);
      } else {
        discordUser.user.send(`Thank you for participating in the lottery! You have won the prize of ${guildConfig.dailyLottery.prizePool} out of ${guildLotteryPlayers.length} people.`);
      }
    }

    guildConfig.dailyLottery.prizePool = newPrizePool;
    const actionsChannel = guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === ChannelType.GuildText);
    if (actionsChannel) actionsChannel.send(eventMsg);
    await game.db.updateGame(guild.id, guildConfig);
    game.guildConfigs.set(guild.id, guildConfig);
    game.player.logEvent(winner, eventLog, enumHelper.logTypes.action);
    await game.db.savePlayer(winner);
    await game.db.removeLotteryPlayers(guild.id);
  }
}

module.exports = { dailyLottery };
