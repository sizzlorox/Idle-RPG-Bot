const { ChannelType, PermissionFlagsBits } = require('discord.js');
const enumHelper = require('../../../utils/enumHelper');
const { formatLeaderboards } = require('../../utils/formatters');

async function updateLeaderboards(bot, game) {
  const types = enumHelper.leaderboardStats;
  for (const guild of bot.guilds.cache.values()) {
    const botGuildMember = guild.members.cache.get(bot.user.id);
    if (!botGuildMember || !botGuildMember.permissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels])) continue;
    const leaderboardChannel = guild.channels.cache.find(channel => channel && channel.name === 'leaderboards' && channel.type === ChannelType.GuildText);
    if (!leaderboardChannel || !leaderboardChannel.manageable) continue;

    const msgCount = await leaderboardChannel.messages.fetch({ limit: 10 });
    const msgs = [...msgCount.values()];

    for (let i = 0; i < types.length; i++) {
      const top10 = await game.db.loadTop10(types[i], guild.id, bot.user.id);
      const fieldKey = Object.keys(types[i])[0];
      const isNested = fieldKey.includes('.');
      const fieldParts = isNested ? fieldKey.split('.') : null;
      const rankString = `${top10.filter(player => isNested ? player[fieldParts[0]][fieldParts[1]] : player[fieldKey] > 0)
        .sort((p1, p2) => {
          if (fieldKey === 'level') return p2.experience.current - p1.experience.current && p2.level - p1.level;
          if (isNested) return p2[fieldParts[0]][fieldParts[1]] - p1[fieldParts[0]][fieldParts[1]];
          return p2[fieldKey] - p1[fieldKey];
        })
        .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${isNested ? `${fieldParts[0]}: ${player[fieldParts[0]][fieldParts[1]]}` : `${fieldKey.replace('currentBounty', 'Bounty')}: ${player[fieldKey]}`}`)
        .join('\n')}`;

      const subjectTitle = formatLeaderboards(fieldKey);
      const msg = `\`\`\`Top 10 ${subjectTitle}:\n${rankString}\`\`\``;

      if (msgCount.size < types.length) {
        await leaderboardChannel.send(msg);
        continue;
      }
      if (!msg.includes(msgs[i].toString()) && msgs[i].author.id === bot.user.id) {
        await msgs[i].edit(msg);
      }
    }
  }
}

module.exports = { updateLeaderboards };
