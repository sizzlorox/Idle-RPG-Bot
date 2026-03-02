const { ChannelType } = require('discord.js');
const { infoLog, actionLog, moveLog } = require('../../utils/logger');
const enumHelper = require('../../utils/enumHelper');

class MessageRouter {

  constructor(bot) {
    this.bot = bot;
  }

  async sendMessage(guild, result) {
    try {
      if (!result || !result.msg || !result.pm) return;
      const message = result.msg.join('\n');
      const privateMessage = result.pm.join('\n');

      switch (result.type) {
        case 'actions': actionLog.info(message); break;
        case 'movement': moveLog.info(message); break;
      }

      const channelToSend = guild.channels.cache.find(channel => channel.name === result.type && channel.type === ChannelType.GuildText);
      if (channelToSend) await channelToSend.send(message);

      if (result.updatedPlayer.isPrivateMessage === enumHelper.pmMode.on
        || (result.updatedPlayer.isPrivateMessage === enumHelper.pmMode.filtered && result.type === 'actions')) {
        const guildMember = guild.members.cache.get(result.updatedPlayer.discordId);
        if (guildMember) await guildMember.user.send(privateMessage);
      }

      if (result.attackerObj
        && (result.attackerObj.isPrivateMessage === enumHelper.pmMode.on || result.attackerObj.isPrivateMessage === enumHelper.pmMode.filtered)
        && result.otherPlayerPmMsg) {
        const otherPlayerPrivateMessage = result.otherPlayerPmMsg.join('\n');
        const guildMember = guild.members.cache.get(result.attackerObj.discordId);
        if (guildMember) await guildMember.user.send(otherPlayerPrivateMessage);
      }
    } catch (err) {
      infoLog.info(err);
    }
  }

}

module.exports = MessageRouter;
