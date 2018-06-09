const mongoose = require('mongoose');
const { mongoDBUri } = require('../../settings');
const Map = require('../game/utils/Map');
const enumHelper = require('../utils/enumHelper');

const gameSchema = require('./schemas/game');
const { playerSchema, newPlayerObj, resetPlayerObj } = require('./schemas/player');
const actionLogSchema = require('./schemas/actionLog');
const moveLogSchema = require('./schemas/moveLog');
const pvpLogSchema = require('./schemas/pvpLog');

const Game = mongoose.model('Game', gameSchema);
const Player = mongoose.model('Player', playerSchema);
const ActionLog = mongoose.model('ActionLog', actionLogSchema);
const MoveLog = mongoose.model('MoveLog', moveLogSchema);
const PvpLog = mongoose.model('PvpLog', pvpLogSchema);

// mongoose.connection.on('open', () => {
//   console.log('\nDATABASE: Connected!');
// });

// mongoose.connection.on('close', () => {
//   console.log('DATABASE: Disconnected!\n');
// });

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

mongoose.connection.on('error', (err) => {
  console.log(err);
  disconnect();
});

class Database {

  constructor(Helper) {
    this.MapClass = new Map(Helper);
  }

  // GAME SETTINGS
  loadGame() {
    connect();
    return new Promise((resolve, reject) => Game.find({}, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }
      if (!result || !result.length) {
        return Game.create({
          multiplier: 1,
          dailyLottery: {
            prizePool: 1500
          }
        }, (error, newGame) => {
          if (error) {

            disconnect();
            return reject(error);
          }

          disconnect();
          return resolve(newGame[0]);
        });
      }

      disconnect();
      return resolve(result[0]);
    }));
  }

  updateGame(newConfig) {
    connect();
    return new Promise((resolve, reject) => Game.update({}, newConfig, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  // PLAYER
  createNewPlayer(discordId, name) {
    connect();
    return new Promise((resolve, reject) => Player.create(newPlayerObj(discordId, name), (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  loadActionLog(discordId) {
    connect();
    return new Promise((resolve, reject) => ActionLog.findOne({ playerId: discordId }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }
      if (!result) {

        disconnect();
        return ActionLog.create({ playerId: discordId });
      }

      disconnect();
      return resolve(result);
    }));
  }

  saveActionLog(discordId, updatedActionLog) {
    connect();
    return new Promise((resolve, reject) => ActionLog.updateOne({ playerId: discordId }, updatedActionLog, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  loadPvpLog(discordId) {
    connect();
    return new Promise((resolve, reject) => PvpLog.findOne({ playerId: discordId }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }
      if (!result) {

        disconnect();
        return PvpLog.create({ playerId: discordId });
      }

      disconnect();
      return resolve(result);
    }));
  }

  savePvpLog(discordId, updatedPvpLog) {
    connect();
    return new Promise((resolve, reject) => PvpLog.updateOne({ playerId: discordId }, updatedPvpLog, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  loadMoveLog(discordId) {
    connect();
    return new Promise((resolve, reject) => MoveLog.findOne({ playerId: discordId }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }
      if (!result) {

        disconnect();
        return MoveLog.create({ playerId: discordId });
      }

      disconnect();
      return resolve(result);
    }));
  }

  saveMoveLog(discordId, updatedMoveLog) {
    connect();
    return new Promise((resolve, reject) => MoveLog.updateOne({ playerId: discordId }, updatedMoveLog, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

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
        pastEvents: 0,
        pastPvpEvents: 0
      })
      .in(discordId));
  }

  loadOnlinePlayerMaps(discordIds) {
    const removeNpcs = enumHelper.mockPlayers.map(npc => npc.name);

    connect();
    return new Promise((resolve, reject) => Player.find({
      name: { $nin: removeNpcs, $exists: true }
    }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .where('discordId')
      .select({
        discordId: 1,
        name: 1,
        map: 1,
        pastEvents: 0,
        pastPvpEvents: 0
      })
      .in(discordIds));
  }

  removeLotteryPlayers() {
    const query = {
      'lottery.joined': true
    };
    connect();
    return new Promise((resolve, reject) => Player.update(query, { lottery: { joined: false } }, { multi: true }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  loadLotteryPlayers(selectFields = {
    pastEvents: 0,
    pastPvpEvents: 0
  }) {
    const query = {
      'lottery.joined': true
    };

    connect();
    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .select(selectFields));
  }

  loadTop10(type) {
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

    connect();
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

  loadCurrentRank(player, type) {
    const select = {
      name: 1
    };
    const removeNpcs = enumHelper.roamingNpcs.map(npc => npc.name);
    enumHelper.mockPlayers.map(npc => npc.name).forEach(npc => removeNpcs.push(npc));

    select[Object.keys(type)[0]] = 1;
    select.discordId = 1;

    if (Object.keys(type)[0] === 'level') {
      select['experience.current'] = 1;
      type['experience.current'] = -1;
    }
    const query = {
      name: { $nin: removeNpcs, $exists: true }
    };
    query[Object.keys(type)[0]] = { $gte: Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] };

    connect();
    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .select(select)
      .sort(type));
  }

  loadPlayer(discordId, selectFields = {}) {
    connect();
    return new Promise((resolve, reject) => Player.findOne({ discordId }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    })
      .select(selectFields));
  }

  savePlayer(player) {
    if (!player) {
      return;
    }
    player.updated_at = Date.now();

    connect();
    return new Promise((resolve, reject) => Player.findOneAndUpdate({ discordId: player.discordId }, player, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(result);
    }));
  }

  getSameMapPlayers(playerMap, selectFields = {}) {
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
    })
      .select(selectFields));
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
    const resetObj = resetPlayerObj;
    resetObj.map = this.MapClass.getRandomTown();

    connect();
    return new Promise((resolve, reject) => Player.update({},
      {
        $set: resetObj
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

  resetAllLogs() {
    connect();
    return new Promise((resolve, reject) => MoveLog.update({}, {}, { mulit: true }, (err, result) => {
      if (err) {

        disconnect();
        return reject(err);
      }

      disconnect();
      return resolve(ActionLog.update({}, {}, { multi: true }));
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
module.exports = Database;
