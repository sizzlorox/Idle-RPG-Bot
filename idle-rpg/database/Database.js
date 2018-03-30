const mongoose = require('mongoose');
const { playerSchema, newPlayerObj } = require('./schemas/player');
const { mongoDBUri } = require('../../settings');
const Map = require('../game/utils/Map');

const Player = mongoose.model('Player', playerSchema);
const enumHelper = require('../utils/enumHelper');

const MapClass = new Map();

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

/*
mongoose.connection.on('open', () => {
  // console.log('\nDATABASE: Connected!');
});

mongoose.connection.on('close', () => {
  // console.log('DATABASE: Disconnected!\n');
});
*/

process.on('close', () => {
  console.log('Database disconnecting on app termination');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(() => {
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

function connect() {
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoDBUri, { useMongoClient: true });
  }
}

function disconnect() {
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close();
  }
}

class Database {

  createNewPlayer(discordId, name) {
    connect();
    return new Promise((resolve, reject) => Player.create(newPlayerObj(discordId, name), (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      // console.log(`DATABASE: ${discordId} has been created.`);
      disconnect();
      return resolve(result);
    }));
  }

  loadOnlinePlayers(discordId) {
    connect();
    return new Promise((resolve, reject) => Player.find({}, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .where('discordId')
      .select({

      })
      .in(discordId));
  }

  loadOnlinePlayerMaps(discordIds) {
    connect();
    const removeNpcs = enumHelper.mockPlayers.map(npc => npc.name);

    return new Promise((resolve, reject) => Player.find({
      name: { $nin: removeNpcs, $exists: true }
    }, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      // console.log('DATABASE: Multiple IDs has been loaded from the Database.');
      disconnect();
      return resolve(result);
    })
      .where('discordId')
      .select({
        discordId: 1,
        name: 1,
        map: 1
      })
      .in(discordIds));
  }

  loadTop10(type) {
    connect();
    const select = {
      name: 1
    };
    const removeNpcs = enumHelper.roamingNpcs.map(npc => npc.name);
    enumHelper.mockPlayers.map(npc => npc.name).forEach(npc => removeNpcs.push(npc));

    select[Object.keys(type)[0]] = 1;

    if (Object.keys(type)[0] === 'level') {
      select['experience.current'] = 1;
      type['experience.current'] = -1;
    }
    const query = {
      name: { $nin: removeNpcs, $exists: true }
    };

    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .select(select)
      .sort(type)
      .limit(10));
  }

  loadPlayer(discordId, selectFields = {}) {
    connect();
    return new Promise((resolve, reject) => Player.findOne({ discordId }, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      // console.log(`DATABASE: ${discordId} has been loaded from the Database.`);
      disconnect();
      return resolve(result);
    })
      .select(selectFields));
  }

  savePlayer(player) {
    if (!player) {
      return;
    }

    connect();
    return new Promise((resolve, reject) => Player.findOneAndUpdate({ discordId: player.discordId }, player, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      // console.log(`DATABASE: ${player.discordId} has been saved into the Database.`);
      disconnect();
      return resolve(result);
    }));
  }

  getSameMapPlayers(playerMap) {
    if (!playerMap) {
      return;
    }

    connect();
    return new Promise((resolve, reject) => Player.find({ 'map.name': playerMap }, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      disconnect();
      return resolve(result);
    }));
  }

  deletePlayer(playerId) {
    connect();
    return new Promise((resolve, reject) => Player.remove({ discordId: playerId }, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      disconnect();
      return resolve(result);
    }));
  }

  resetAllPlayers() {
    connect();
    return new Promise((resolve, reject) => Player.update({},
      {
        $set: {
          class: 'Wanderer',
          health: 105,
          mana: 50,
          experience: {
            current: 0,
            lost: 0,
            total: 0
          },
          map: MapClass.getRandomTown(),
          level: 1,
          gold: {
            current: 0,
            lost: 0,
            stolen: 0,
            stole: 0,
            gamble: {
              won: 0,
              lost: 0
            },
            total: 0
          },
          'equipment.helmet': {
            name: 'Nothing',
            power: 0.15,
            previousOwners: []
          },
          'equipment.armor': {
            name: 'Linen Shirt',
            power: 0.75,
            position: 'armor',
            previousOwners: []
          },
          'equipment.weapon': {
            name: 'Training Sword',
            power: 0.75,
            position: 'weapon',
            attackType: 'melee',
            previousOwners: []
          },
          inventory: {
            equipment: [],
            items: []
          },
          stats: {
            str: 1,
            dex: 1,
            end: 1,
            int: 1,
            luk: 1
          },
          spells: [],
          isOnline: true,
          createdAt: new Date().getTime(),
          events: 0,
          gambles: 0,
          stole: 0,
          stolen: 0,
          spellCast: 0,
          currentBounty: 0,
          kills: {
            mob: 0,
            player: 0
          },
          battles: {
            won: 0,
            lost: 0,
            firstDeath: 0
          },
          deaths: {
            mob: 0,
            player: 0,
            firstDeath: 'never'
          },
          pastEvents: [],
          pastPvpEvents: []
        }
      },
      {
        multi: true
      }, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        disconnect();
        return resolve(result);
      }));
  }

  deleteAllPlayers() {
    connect();
    return new Promise((resolve, reject) => Player.remove({}, (err, result) => {
      if (err) {
        disconnect();
        return reject(err);
      }
      disconnect();
      return resolve(result);
    }));
  }

}
module.exports = new Database();
