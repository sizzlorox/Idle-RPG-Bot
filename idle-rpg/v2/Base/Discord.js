const { infoLog, actionLog, moveLog } = require('../../utils/logger');
const enumHelper = require('../../utils/enumHelper');

class Discord {

  constructor(bot) {
    this.bot = bot;
  }

  loadGuilds() {
    console.log('Idle RPG is loading guilds');
    this.bot.guilds.cache.forEach(async (guild) => {
      this.manageGuildChannels(guild);
    });
  }

  async manageGuildChannels(guild) {
    const botGuildMember = await guild.members.cache.get(this.bot.user.id);
    if (!botGuildMember.permissions.has('MANAGE_CHANNELS')) {
      return;
    }
    const hasCategoryChannel = await guild.channels.cache.find(channel => channel.type === 'category' && channel.name === 'Idle-RPG');
    const hasLeaderboardsChannel = await guild.channels.cache.find(channel => channel.name === 'leaderboards' && channel.type === 'text' && channel.parent && channel.parent.name === 'Idle-RPG');
    const hasCommandsChannel = await guild.channels.cache.find(channel => channel.name === 'commands' && channel.type === 'text' && channel.parent && channel.parent.name === 'Idle-RPG');
    const hasFAQChannel = await guild.channels.cache.find(channel => channel.name === 'faq' && channel.type === 'text' && channel.parent && channel.parent.name === 'Idle-RPG');
    const hasActionsChannel = await guild.channels.cache.find(channel => channel.name === 'actions' && channel.type === 'text' && channel.parent && channel.parent.name === 'Idle-RPG');
    const hasMovementChannel = await guild.channels.cache.find(channel => channel.name === 'movement' && channel.type === 'text' && channel.parent && channel.parent.name === 'Idle-RPG');
    if (!hasCategoryChannel) {
      console.log(`Creating Idle-RPG Category Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Category Channel for Guild: ${guild.name}`);
      try {
        await guild.channels.create('Idle-RPG', [{ type: 'category', reason: 'Creating Idle-RPG Category' }]);
      } catch (err) {
        console.log(err);
      }
    }
    const parentChannel = guild.channels.cache.find(channel => channel.type === 'category' && channel.parent.name === 'Idle-RPG');
    if (!hasLeaderboardsChannel && parentChannel) {
      console.log(`Creating Idle-RPG Leaderboards Channel for Guild: ${guild.name}`);
      try {
        const leaderboardsChannel = await guild.channels.create('leaderboards', [{
          id: guild.id,
          type: 'text',
          deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'ADD_REACTIONS'],
          allow: [],
          reason: 'Creating Idle-RPG leaderboards channel',
        },
        {
          id: this.bot.user.id,
          deny: ['SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'ADD_REACTIONS'],
          allow: ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
          reason: 'Creating Idle-RPG leaderboards channel',
        }]);
        await leaderboardsChannel.setParent(parentChannel);
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasCommandsChannel && parentChannel) {
      console.log(`Creating Idle-RPG Commands Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Commands Channel for Guild: ${guild.name}`);
      try {
        const commandsChannel = await guild.channels.create('commands', [{
          id: guild.id,
          type: 'text',
          deny: ['SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE'],
          allow: ['SEND_MESSAGES', 'ADD_REACTIONS'],
          reason: 'Creating Idle-RPG commands channel',
        }]);
        await commandsChannel.setParent(parentChannel);
        await commandsChannel.setTopic('In order to easier check other players stats/equip, a command channel was created. You can check others with @mentions.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasFAQChannel && parentChannel) {
      console.log(`Creating Idle-RPG FAQ Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG FAQ Channel for Guild: ${guild.name}`);
      try {
        const faqChannel = await guild.channels.create('faq', [{
          id: guild.id,
          type: 'text',
          deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'ADD_REACTIONS'],
          allow: [],
          reason: 'Creating Idle-RPG FAQ channel',
        },
        {
          id: this.bot.user.id,
          deny: ['SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE'],
          allow: ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
          reason: 'Creating Idle-RPG FAQ channel',
        }]);
        await faqChannel.setParent(parentChannel);
        await faqChannel.setTopic('Frequently asked questions', 'Setting up Idle-RPG Channels');
        // TODO move FAQ message somewhere else so I dont have to look everywhere to update these messages
        await faqChannel.send(`
• **I'm not born yet, what should I do?**
Once an event is fired for your character you will be born.

• **How do I play?**
As long as you are in the online list you will be playing the game. Does not matter what status you set as long as you are not "Invisible".

• **Will my character be reset?**
The game is in super early development right now so resets are expected. Once the game is complete resets will most likely be a yearly thing with leaderboards.

• **How can I help with the development?**
Suggestions are always welcome, if you have experience with NodeJS you're welcome to become a contributor and develop along side with us!
You can also support with development by becoming a patron! Keep in mind that you will not gain any advantage over the others and its simply a method of showing your support to the developer!
Command: !patreon

• **My event counter goes up but I did not see anything in the event channels**
There are some events such as luck events which fail. When they do it does not print anything but your event counter goes up.

• **Is there a way to turn off all the spam from events?**
Yes, you can right click the channel to mute and select the mute checkbox.

• **Is this open source?**
Yes, <https://github.com/sizzlorox/Idle-RPG-Bot>

• **Do you guys have a trello board?**
Yes, <https://trello.com/b/OnpWqvlp/idle-rpg>

• **Can I control my character?**
No.

• **What's the command prefix for this bot?**
The prefix is ! (eg: !help).

• **Can I host this in my server?**
There's a command to get the invite link !invite`);
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasActionsChannel && parentChannel) {
      console.log(`Creating Idle-RPG Action Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Action Channel for Guild: ${guild.name}`);
      try {
        const actionChannel = await guild.channels.create('actions', 'text', [{
          id: guild.id,
          deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE'],
          allow: ['ADD_REACTIONS']
        },
        {
          id: this.bot.user.id,
          deny: ['SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'ADD_REACTIONS'],
          allow: ['SEND_MESSAGES']
        }], 'Creating channels for Idle-RPG-Bot');
        await actionChannel.setParent(parentChannel);
        await actionChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
    if (!hasMovementChannel && parentChannel) {
      console.log(`Creating Idle-RPG Movement Channel for Guild: ${guild.name}`);
      infoLog.info(`Creating Idle-RPG Movement Channel for Guild: ${guild.name}`);
      try {
        const movementChannel = await guild.channels.create('movement', 'text', [{
          id: guild.id,
          deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE'],
          allow: ['ADD_REACTIONS']
        },
        {
          id: this.bot.user.id,
          deny: ['SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'ADD_REACTIONS'],
          allow: ['SEND_MESSAGES']
        }], 'Creating channels for Idle-RPG-Bot');
        await movementChannel.setParent(parentChannel);
        await movementChannel.setTopic('Muting this channel is recommended in order to not get spammed.', 'Setting up Idle-RPG Channels');
      } catch (err) {
        console.log(err);
      }
    }
  }

  getOnlinePlayers(guild) {
    return guild.members.cache
      .filter(member => !member.presence.status.includes('offline') && !member.user.bot && member.id !== this.bot.user.id)
      .map(member => Object.assign({}, {
        discordId: member.id,
        name: member.nickname ? member.nickname : member.displayName,
        guildId: guild.id
      }));
  }

  getOfflinePlayers(guild) {
    return guild.members.cache
      .filter(member => member.presence.status.includes('offline') && !member.user.bot && member.id !== this.bot.user.id)
      .map(member => Object.assign({}, {
        discordId: member.id,
        name: member.nickname ? member.nickname : member.displayName,
        guildId: guild.id
      }));
  }

  getMembers(guild) {
    const guildOnlineMembers = [];
    const guildOfflineMembers = [];
    guild.members.cache.forEach((member) => {
      if (!member.user.bot && member.id !== this.bot.user.id) {
        const player = Object.assign({}, {
          discordId: member.id,
          name: member.nickname ? member.nickname : member.displayName,
          guildId: guild.id
        });
        if (member.presence.status.includes('offline')) {
          guildOfflineMembers.push(player);
        } else {
          guildOnlineMembers.push(player);
        }
      }
    });
    return { guildOnlineMembers, guildOfflineMembers };
  }

  async sendMessage(guild, result) {
    try {
      if (!result || result && !result.msg || result && !result.pm) {
        return;
      }
      const message = result.msg.join('\n');
      const privateMessage = result.pm.join('\n');

      switch (result.type) {
        case 'actions':
          actionLog.info(message);
          break;
        case 'movement':
          moveLog.info(message);
          break;
      }
      // TODO add check to parent once you find out why its still null
      const channelToSend = await guild.channels.cache.find(channel => channel.name === result.type && channel.type === 'text' /*&& channel.parent.name === 'Idle-RPG'*/);
      if (channelToSend) {
        await channelToSend.send(message, { split: true });
      }
      if (result.updatedPlayer.isPrivateMessage === enumHelper.pmMode.on
        || (result.updatedPlayer.isPrivateMessage === enumHelper.pmMode.filtered
          && result.type === 'actions')) {
        const guildMember = await guild.members.cache.get(result.updatedPlayer.discordId);
        await guildMember.send(privateMessage, { split: true });
      }
      // Usually used for PVP messages to message player that got attacked that is not owner of event
      if (result.attackerObj
        && (result.attackerObj.isPrivateMessage === enumHelper.pmMode.on || result.attackerObj.isPrivateMessage === enumHelper.pmMode.filtered)
        && result.otherPlayerPmMsg) {
        const otherPlayerPrivateMessage = result.otherPlayerPmMsg.join('\n');
        const guildMember = await guild.members.cache.get(result.attackerObj.discordId);
        await guildMember.send(otherPlayerPrivateMessage, { split: true });
      }
    } catch (err) {
      infoLog.info(err);
    }
  }

}
module.exports = Discord;
