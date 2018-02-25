const express = require('express');

const router = express.Router();
const discord = require('../../idle-rpg/bots/discord');
const Database = require('../../idle-rpg/database/Database');

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/', (req, res) => {
  const onlineUsers = discord.users
    .filter(player => player.presence.status === 'online' && !player.bot
      || player.presence.status === 'idle' && !player.bot
      || player.presence.status === 'dnd' && !player.bot)
    .map((player) => {
      return player.id;
    });

  return Database.loadOnlinePlayerMaps(onlineUsers)
    .then((onlinePlayers) => {
      return res.render('index', {
        pageTitle: 'Idle-RPG Homepage',
        onlinePlayers
      });
    });
});

module.exports = router;
