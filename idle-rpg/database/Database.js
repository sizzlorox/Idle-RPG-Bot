const mongoose = require('mongoose');
const { playerSchema, newPlayerObj } = require('./schemas/player');
const { mongoDBUri } = require('../../settings');

const Player = mongoose.model('Player', playerSchema);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

mongoose.connection.on('open', () => {
  // console.log('\nDATABASE: Connected!');
});

mongoose.connection.on('close', () => {
  // console.log('DATABASE: Disconnected!\n');
});

process.on('close', () => {
  // console.log('Database disconnecting on app termination');
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
    return new Promise((resolve, reject) => {
      return Player.create(newPlayerObj(discordId, name), (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        // console.log(`DATABASE: ${discordId} has been created.`);
        disconnect();
        return resolve(result);
      });
    });
  }

  loadOnlinePlayers(discordId) {
    connect();
    return new Promise((resolve, reject) => {
      return Player.find({}, (err, result) => {
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
        .in(discordId);
    });
  }

  loadOnlinePlayerMaps(discordIds) {
    connect();
    return new Promise((resolve, reject) => {
      return Player.find({}, (err, result) => {
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
        .in(discordIds);
    });
  }

  loadTop10(type) {
    connect();
    const select = {
      name: 1
    };
    select[Object.keys(type)[0]] = 1;

    if (Object.keys(type)[0] === 'level') {
      select.experience = 1;
      type.experience = -1;
    }

    return new Promise((resolve, reject) => {
      return Player.find({}, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }

        disconnect();
        return resolve(result);
      })
        .select(select)
        .sort(type)
        .limit(10);
    });
  }

  loadPlayer(discordId) {
    connect();
    return new Promise((resolve, reject) => {
      return Player.findOne({ discordId }, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        // console.log(`DATABASE: ${discordId} has been loaded from the Database.`);
        disconnect();
        return resolve(result);
      });
    });
  }

  savePlayer(player) {
    if (!player) {
      return;
    }

    connect();
    return new Promise((resolve, reject) => {
      return Player.findOneAndUpdate({ discordId: player.discordId }, player, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        // console.log(`DATABASE: ${player.discordId} has been saved into the Database.`);
        disconnect();
        return resolve(result);
      });
    });
  }

  getSameMapPlayers(playerMap) {
    if (!playerMap) {
      return;
    }

    connect();
    return new Promise((resolve, reject) => {
      return Player.find({ 'map.name': playerMap }, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        disconnect();
        return resolve(result);
      });
    });
  }

  deletePlayer(playerId) {
    connect();
    return new Promise((resolve, reject) => {
      return Player.remove({ discordId: playerId }, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        disconnect();
        return resolve(result);
      })
    });
  }

  deleteAllPlayers() {
    connect();
    return new Promise((resolve, reject) => {
      return Player.remove({}, (err, result) => {
        if (err) {
          disconnect();
          return reject(err);
        }
        disconnect();
        return resolve(result);
      });
    });
  }

}
module.exports = new Database();
