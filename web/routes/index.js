const express = require('express');

const router = express.Router();
const DiscordBot = require('../../idle-rpg/v2/DiscordBot');

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/', (req, res) => {
  return DiscordBot.onlinePlayers.array();
});

module.exports = router;
