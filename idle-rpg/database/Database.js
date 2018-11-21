const mongoose = require('mongoose');
const { mongoDBUri } = require('../../settings');
const Map = require('../game/utils/Map');
const enumHelper = require('../utils/enumHelper');
const { infoLog, errorLog } = require('../utils/logger');

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

  constructor() {
    this.MapClass = new Map();
    connect();
  }

  // GAME SETTINGS
  loadGame(guildId) {
    return new Promise((resolve, reject) => Game.find({ guildId }, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (!result || !result.length) {
        return Game.create({
          guildId,
          multiplier: 1,
          spells: {
            activeBless: 0
          },
          dailyLottery: {
            prizePool: 1500
          }
        }, (error, newGame) => {
          if (error) {
            return reject(error);
          }

          return resolve(newGame);
        });
      }

      return resolve(result[0]);
    }));
  }

  updateGame(guildId, newConfig) {
    return new Promise((resolve, reject) => Game.update({ guildId }, newConfig, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  // PLAYER
  createNewPlayer(discordId, guildId, name) {
    return new Promise((resolve, reject) => Player.create(newPlayerObj(discordId, guildId, name), (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  async loadActionLog(discordId) {
    try {
      const result = await ActionLog.findOne({ playerId: discordId });

      if (!result) {
        ActionLog.create({ playerId: discordId });
      }
      return result;
    } catch (err) {
      errorLog.error(err);
    }
  }

  saveActionLog(discordId, updatedActionLog) {
    return new Promise((resolve, reject) => ActionLog.updateOne({ playerId: discordId }, updatedActionLog, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  loadPvpLog(discordId) {
    return new Promise((resolve, reject) => PvpLog.findOne({ playerId: discordId }, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (!result) {
        return PvpLog.create({ playerId: discordId });
      }

      return resolve(result);
    }));
  }

  savePvpLog(discordId, updatedPvpLog) {
    return new Promise((resolve, reject) => PvpLog.updateOne({ playerId: discordId }, updatedPvpLog, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  loadMoveLog(discordId) {
    return new Promise((resolve, reject) => MoveLog.findOne({ playerId: discordId }, (err, result) => {
      if (err) {
        return reject(err);
      }
      if (!result) {
        return MoveLog.create({ playerId: discordId });
      }

      return resolve(result);
    }));
  }

  saveMoveLog(discordId, updatedMoveLog) {
    return new Promise((resolve, reject) => MoveLog.updateOne({ playerId: discordId }, updatedMoveLog, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  loadOnlinePlayers(discordId) {
    return new Promise((resolve, reject) => Player.find({}, (err, result) => {
      if (err) {
        return reject(err);
      }

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

    return new Promise((resolve, reject) => Player.find({
      name: { $nin: removeNpcs, $exists: true }
    }, (err, result) => {
      if (err) {
        return reject(err);
      }

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

  removeLotteryPlayers(guildId) {
    const query = {
      'lottery.joined': true,
      guildId
    };
    return new Promise((resolve, reject) => Player.update(query, { lottery: { joined: false } }, { multi: true }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  loadLotteryPlayers(guildId, selectFields = {
    pastEvents: 0,
    pastPvpEvents: 0
  }) {
    const query = {
      guildId,
      'lottery.joined': true
    };

    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    })
      .select(selectFields));
  }

  loadTop10(type, guildId, botID) {
    const select = {
      name: 1
    };
    const removeNpcs = enumHelper.roamingNpcs.map(npc => npc.discordId).concat(botID);
    enumHelper.mockPlayers.map(npc => npc.name).forEach(npc => removeNpcs.push(npc));

    select[Object.keys(type)[0]] = 1;

    if (Object.keys(type)[0] === 'level') {
      select['experience.current'] = 1;
      type['experience.current'] = -1;
    }
    const query = {
      discordId: { $nin: removeNpcs, $exists: true },
      guildId
    };

    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {
        return reject(err);
      }

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

    return new Promise((resolve, reject) => Player.find(query, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    })
      .select(select)
      .sort(type));
  }

  async loadPlayer(discordId, selectFields = {}) {
    try {
      const player = await Player.findOne({ discordId })
        .select(selectFields);

      return player ? player._doc : undefined;
    } catch (err) {
      errorLog.error(err);
    }
  }

  // TODO: Change to use Base DB commands Update(Query, Value);
  setPlayerGuildId(guildId, player) {
    if (!player) {
      return;
    }

    return new Promise((resolve, reject) => Player.update({ discordId: player.discordId }, { guildId }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  async getPlayerGuildId(player) {
    if (!player) {
      return;
    }

    try {
      return this.loadPlayer(player, { guildId: 1 });
    } catch (err) {
      errorLog.error(err);
    }
  }

  savePlayer(player) {
    if (!player) {
      return;
    }
    player.updated_at = Date.now();

    return new Promise((resolve, reject) => Player.findOneAndUpdate({ discordId: player.discordId }, player, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  getSameMapPlayers(guildId, playerMap, selectFields = {}) {
    if (!playerMap) {
      return;
    }

    return new Promise((resolve, reject) => Player.find({ 'map.name': playerMap, guildId }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    })
      .select(selectFields));
  }

  deletePlayer(playerId) {
    return new Promise((resolve, reject) => Player.remove({ discordId: playerId }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  resetAllPlayersInGuild(guildId) {
    const resetObj = resetPlayerObj;
    resetObj.map = this.MapClass.getRandomTown();

    return new Promise((resolve, reject) => Player.update({ guildId },
      {
        $set: resetObj
      },
      {
        multi: true
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      }));
  }

  resetPersonalMultipliers() {
    return new Promise((resolve, reject) => Player.update({},
      {
        $set: {
          personalMultiplier: 0
        }
      },
      {
        multi: true
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      }));
  }

  resetAllLogs(guildId) {
    return new Promise((resolve, reject) => MoveLog.update({ guildId }, {}, { mulit: true }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(ActionLog.update({ guildId }, {}, { multi: true }));
    }));
  }

  deleteAllPlayersInGuild(guildId) {
    return new Promise((resolve, reject) => Player.remove({ guildId }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    }));
  }

  async getStolenEquip(player) {
    const guildPlayers = await Player.find({ guildId: player.guildId, discordId: { $ne: player.discordId } });
    const slots = ['weapon', 'helmet', 'armor'];
    let stolenEquips = '';

    guildPlayers.forEach((member) => {
      slots.forEach((slot) => {
        member.equipment[slot].previousOwners.forEach((owner) => {
          if (player.name === owner) {
            stolenEquips += `    ${member.name} - ${member.equipment[slot].name}\n`;
          }
        });
      });
    });

    return stolenEquips;
  }

  getGuildPlayers(guild) {
    try {
      return Player.find({ guildId: guild.id }, { discordId: 1, guildId: 1 });
    } catch (err) {
      errorLog.log(err);
    }
  }

}
module.exports = Database;
