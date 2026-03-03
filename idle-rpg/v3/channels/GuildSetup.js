const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { infoLog } = require('../../utils/logger');

class GuildSetup {

  constructor(bot) {
    this.bot = bot;
  }

  async loadGuilds() {
    console.log('Idle RPG is loading guilds');
    for (const guild of this.bot.guilds.cache.values()) {
      await this.manageGuildChannels(guild);
    }
  }

  async manageGuildChannels(guild) {
    const botGuildMember = await guild.members.fetch(this.bot.user.id);
    if (!botGuildMember) return;
    if (!botGuildMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      console.log(`Idle RPG does not have permission to manage channels in guild: ${guild.name} (${guild.id})`);
      return;
    }
    let categoryChannel = null;
    let hasLeaderboardsChannel = null;
    let hasCommandsChannel = null;
    let hasFAQChannel = null;
    let hasActionsChannel = null;
    let hasMovementChannel = null;
    for (const channel of guild.channels.cache.values()) {
      if (channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === 'idle-rpg') {
        categoryChannel = channel;
      } else if (channel.type === ChannelType.GuildText && channel.parent && channel.parent.name.toLowerCase() === 'idle-rpg') {
        switch (channel.name.toLowerCase()) {
          case 'leaderboards': hasLeaderboardsChannel = channel; break;
          case 'commands': hasCommandsChannel = channel; break;
          case 'faq': hasFAQChannel = channel; break;
          case 'actions': hasActionsChannel = channel; break;
          case 'movement': hasMovementChannel = channel; break;
        }
      }
    }

    if (!categoryChannel) {
      console.log(`Creating Idle-RPG Category Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Category Channel for Guild: ${guild.name}`);
      try {
        await guild.channels.create({ name: 'Idle-RPG', type: ChannelType.GuildCategory });
        categoryChannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'idle-rpg');
      } catch (err) { console.log(err); }
    }
    if (!hasLeaderboardsChannel && categoryChannel) {
      console.log(`Creating Idle-RPG Leaderboards Channel for Guild: ${guild.name}`);
      try {
        const leaderboardsChannel = await guild.channels.create({
          name: 'leaderboards', type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.AddReactions], allow: [] },
            { id: this.bot.user.id, deny: [PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.AddReactions], allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }
          ],
          reason: 'Creating Idle-RPG leaderboards channel'
        });
        await leaderboardsChannel.setParent(categoryChannel);
      } catch (err) { console.log(err); }
    }
    if (!hasCommandsChannel && categoryChannel) {
      console.log(`Creating Idle-RPG Commands Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Commands Channel for Guild: ${guild.name}`);
      try {
        const commandsChannel = await guild.channels.create({
          name: 'commands', type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone], allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }
          ],
          reason: 'Creating Idle-RPG commands channel'
        });
        await commandsChannel.setParent(categoryChannel);
        await commandsChannel.setTopic('In order to easier check other players stats/equip, a command channel was created.', 'Setting up Idle-RPG Channels');
      } catch (err) { console.log(err); }
    }
    if (!hasFAQChannel && categoryChannel) {
      console.log(`Creating Idle-RPG FAQ Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG FAQ Channel for Guild: ${guild.name}`);
      try {
        const faqChannel = await guild.channels.create({
          name: 'faq', type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.AddReactions], allow: [] },
            { id: this.bot.user.id, deny: [PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone], allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }
          ],
          reason: 'Creating Idle-RPG FAQ channel'
        });
        await faqChannel.setParent(categoryChannel);
        await faqChannel.setTopic('Frequently asked questions', 'Setting up Idle-RPG Channels');
        await faqChannel.send(`• **How do I play?**\nAs long as you are online (not Invisible) you will be playing.\n\n• **What commands can I use?**\nPM the bot \`!help\` for a full list.\n\n• **Is this open source?**\nYes, <https://github.com/sizzlorox/Idle-RPG-Bot>`);
      } catch (err) { console.log(err); }
    }
    if (!hasActionsChannel && categoryChannel) {
      console.log(`Creating Idle-RPG Action Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Action Channel for Guild: ${guild.name}`);
      try {
        const actionChannel = await guild.channels.create({
          name: 'actions', type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone], allow: [PermissionFlagsBits.AddReactions] },
            { id: this.bot.user.id, deny: [PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.AddReactions], allow: [PermissionFlagsBits.SendMessages] }
          ],
          reason: 'Creating channels for Idle-RPG-Bot'
        });
        await actionChannel.setParent(categoryChannel);
        await actionChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) { console.log(err); }
    }
    if (!hasMovementChannel && categoryChannel) {
      console.log(`Creating Idle-RPG Movement Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Movement Channel for Guild: ${guild.name}`);
      try {
        const movementChannel = await guild.channels.create({
          name: 'movement', type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone], allow: [PermissionFlagsBits.AddReactions] },
            { id: this.bot.user.id, deny: [PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.AddReactions], allow: [PermissionFlagsBits.SendMessages] }
          ],
          reason: 'Creating channels for Idle-RPG-Bot'
        });
        await movementChannel.setParent(categoryChannel);
        await movementChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) { console.log(err); }
    }
  }

}

module.exports = GuildSetup;
