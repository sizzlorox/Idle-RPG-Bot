const { ChannelType, PermissionFlagsBits } = require('discord.js');
const enumHelper = require('../../../utils/enumHelper');
const { formatLeaderboards } = require('../../utils/formatters');

async function updateLeaderboards(bot, game) {
  const types = enumHelper.leaderboardStats;
  for (const guild of bot.guilds.cache.values()) {
    try {
      const botGuildMember = guild.members.cache.get(bot.user.id);
      if (!botGuildMember || !botGuildMember.permissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels])) continue;
      const leaderboardChannel = guild.channels.cache.find(channel => channel && channel.name === 'leaderboards' && channel.type === ChannelType.GuildText);
      if (!leaderboardChannel || !leaderboardChannel.manageable) continue;

      const fetched = await leaderboardChannel.messages.fetch({ limit: 10 });
      const msgs = [...fetched.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const top10Results = await Promise.all(types.map(type => game.db.loadTop10(type, guild.id, bot.user.id)));

      for (let i = 0; i < types.length; i++) {
        const top10 = top10Results[i];
        if (!top10) continue;
        const fieldKey = Object.keys(types[i])[0];
        const isNested = fieldKey.includes('.');
        const fieldParts = isNested ? fieldKey.split('.') : null;
        const subjectTitle = formatLeaderboards(fieldKey);
        const rankString = top10
          .filter(player => {
            const val = isNested ? player[fieldParts[0]][fieldParts[1]] : player[fieldKey];
            return val > 0;
          })
          .map((player, rank) => {
            const val = isNested ? player[fieldParts[0]][fieldParts[1]] : player[fieldKey];
            return `Rank ${rank + 1}: ${player.name} - ${subjectTitle}: ${val}`;
          })
          .join('\n');

        const msg = `\`\`\`Top 10 ${subjectTitle}:\n${rankString}\`\`\``;

        if (fetched.size < types.length) {
          await leaderboardChannel.send(msg);
          continue;
        }
        if (msgs[i] && msgs[i].author.id === bot.user.id && msgs[i].content !== msg) {
          await msgs[i].edit(msg);
        }
      }
    } catch (err) {
      // continue to next guild
    }
  }
}

module.exports = { updateLeaderboards };
