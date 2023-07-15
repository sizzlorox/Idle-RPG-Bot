const express = require('express');
const NodeCache = require('node-cache');
const path = require('path');

const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const router = express.Router();
const DiscordBot = require('../../idle-rpg/v2/DiscordBot');

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/map', async (req, res) => {
  const onlinePlayersDiscordIdList = DiscordBot.onlinePlayers.array().reduce((list, player) => {
    if (player.guildId !== '390509935097675777') return list;

    return list.concat(player.discordId);
  }, []);
  let maps = {};
  if (!cache.has('mapResult')) {
    console.log('Fetching players for map...');
    const players = await DiscordBot.Game.Database.loadOnlinePlayerMaps(onlinePlayersDiscordIdList);
    maps = DiscordBot.Game.Map.maps.reduce((hashMap, map) => {
      hashMap[map.id] = { ...map, players: [] };
      return hashMap;
    }, {});
    players.forEach((player) => {
      maps[player.map.id].players.push(player.name);
    });
    cache.set('mapResult', maps);
  } else {
    maps = cache.get('mapResult');
  }
  console.log('Fetched players');

  res.status(200).send({
    maps,
  });
});

router.get('/', (req, res) => {
  console.log(path.join(__dirname, '..', '..', 'web', 'build', 'index.html'));
  res.sendFile(path.join(__dirname, '..', '..', 'web', 'build', 'index.html'));
});

module.exports = router;
