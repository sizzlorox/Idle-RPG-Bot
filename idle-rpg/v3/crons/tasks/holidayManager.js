const { ChannelType } = require('discord.js');

// Date windows are inclusive. Month is 0-indexed (JS convention).
const HOLIDAYS = {
  xmas: {
    label: 'Christmas',
    // Dec 15 – Jan 5 (wraps over year boundary)
    active: (month, day) => (month === 11 && day >= 15) || (month === 0 && day <= 5)
  },
  halloween: {
    label: 'Halloween',
    // Oct 24 – Nov 2
    active: (month, day) => (month === 9 && day >= 24) || (month === 10 && day <= 2)
  }
};

function _applyHoliday(game, key, isActive) {
  game.monsterGen.monsters.forEach(mob => { if (mob.holiday === key) mob.isSpawnable = isActive; });
  game.itemGen.items.forEach(type => { type.forEach(item => { if (item.holiday === key) item.isDroppable = isActive; }); });
}

function _isActive(key) {
  const now = new Date();
  return HOLIDAYS[key].active(now.getMonth(), now.getDate());
}

// Called once on bot startup — silently sets holiday state, no announcements.
function initHolidays(game) {
  if (!game._holidayState) game._holidayState = {};
  for (const key of Object.keys(HOLIDAYS)) {
    const active = _isActive(key);
    _applyHoliday(game, key, active);
    game._holidayState[key] = active;
  }
}

// Called by daily cron — announces transitions.
function checkHolidays(bot, game) {
  if (!game._holidayState) game._holidayState = {};
  for (const key of Object.keys(HOLIDAYS)) {
    const wasActive = game._holidayState[key] ?? false;
    const isActive = _isActive(key);
    _applyHoliday(game, key, isActive);
    game._holidayState[key] = isActive;

    if (isActive === wasActive) continue;
    const msg = isActive
      ? `\`\`\`css\n The ${HOLIDAYS[key].label} event has begun! Special mobs and items are now available!\`\`\``
      : `\`\`\`css\n The ${HOLIDAYS[key].label} event has ended.\`\`\``;

    bot.guilds.cache.forEach(guild => {
      const actionChannel = guild.channels.cache.find(ch => ch && ch.name === 'actions' && ch.type === ChannelType.GuildText);
      if (actionChannel) actionChannel.send(msg);
    });
  }
}

module.exports = { initHolidays, checkHolidays };
