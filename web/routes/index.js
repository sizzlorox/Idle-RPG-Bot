const express = require('express');

const router = express.Router();
const DiscordBot = require('../../idle-rpg/v2/DiscordBot');

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/', (req, res) => {
  res.status(200).send({
    onlinePlayers: DiscordBot.onlinePlayers.array().reduce((list, player) => {
      if (player.guildId !== '390509935097675777') return list;

      return list.concat(player.name);
    }, []).join(', ');
  });
});

module.exports = router;
