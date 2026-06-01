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

process.on('close', () => {
  console.log('Database disconnecting on app termination');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close().then(() => process.exit(0));
  }
});

process.on('SIGINT', () => {
  mongoose.connection.close().then(() => process.exit(0));
});

function connect() {
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoDBUri);
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
  async loadGame(guildId) {
    try {
      let result = await Game.findOne({ guildId });
      if (!result) {
        result = await Game.create({
          guildId,
          multiplier: 1,
          spells: {
            bless: [],
          },
          dailyLottery: {
            prizePool: 1500,
          },
        });
      }
      return result;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async updateGame(guildId, newConfig) {
    try {
      return await Game.updateOne({ guildId }, newConfig);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async castBless(blessConfig, goldCost = 1500) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Player.updateOne(
        { discordId: blessConfig.castBy },
        {
          $inc: {
            spellCast: blessConfig.count,
            'gold.current': -goldCost,
          },
        },
      ).session(session);
      const result = await Game.findOneAndUpdate(
        { guildId: blessConfig.guildId },
        {
          $inc: { multiplier: blessConfig.count },
          $push: {
            'spells.bless': {
              ...blessConfig,
            },
          },
        },
        { new: true },
      ).session(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      errorLog.error(err);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  async expireBless(guildId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const now = Date.now();
      const gameConfig = await Game.findOne({ guildId }).session(session);
      const expiredBlesses = (gameConfig.spells.bless || []).filter((b) => b.expiresAt <= now);
      console.log('Expired blesses:', expiredBlesses);
      if (expiredBlesses.length === 0) {
        await session.commitTransaction();
        return;
      }
      const expiredCount = expiredBlesses.reduce((prev, curr) => prev + curr.count, 0);
      const currentMultiplier = gameConfig.multiplier ?? 1;
      const newMultiplier = Math.max(1, currentMultiplier - expiredCount);

      const updated = await Game.findOneAndUpdate(
        { guildId, 'spells.bless.expiresAt': { $lte: now } },
        [
          {
            $set: {
              multiplier: {
                $max: [1, { $subtract: ['$multiplier', expiredCount] }],
              },
              'spells.bless': {
                $filter: {
                  input: { $ifNull: ['$spells.bless', []] },
                  cond: { $gt: ['$$this.expiresAt', now] },
                },
              },
            },
          },
        ],
        { new: true },
      ).session(session);
      await session.commitTransaction();
      return { expiredBlesses, updated, originalMultiplier: currentMultiplier };
    } catch (err) {
      errorLog.error(err);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  async beginPowerHour() {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updated = await Game.updateMany({}, { $inc: { multiplier: 1 } }).session(session);
      await session.commitTransaction();
      infoLog.info(`Power Hour started, updated ${updated.nModified} guilds`);
    } catch (err) {
      errorLog.error(err);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  async endPowerHour() {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updated = await Game.updateMany({}, [
        { $set: { multiplier: { $max: [1, { $subtract: ['$multiplier', 1] }] } } },
      ]).session(session);
      await session.commitTransaction();
      infoLog.info(`Power Hour ended, updated ${updated.nModified} guilds`);
    } catch (err) {
      errorLog.error(err);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  // PLAYER
  async createNewPlayer(discordId, guildId, name) {
    try {
      return await Player.create(newPlayerObj(discordId, guildId, name));
    } catch (err) {
      errorLog.error(err);
    }
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

  async saveActionLog(discordId, updatedActionLog) {
    try {
      return await ActionLog.updateOne({ playerId: discordId }, updatedActionLog);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async appendActionLog(discordId, msg) {
    try {
      const event = msg.includes('`') ? msg.replace(/`/g, '') : msg;
      return await ActionLog.findOneAndUpdate(
        { playerId: discordId },
        { $push: { log: { $each: [{ event, timeStamp: Date.now() }], $slice: -25 } } },
        { upsert: true },
      );
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadPvpLog(discordId) {
    try {
      let result = await PvpLog.findOne({ playerId: discordId });
      if (!result) {
        result = await PvpLog.create({ playerId: discordId });
      }
      return result;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async savePvpLog(discordId, updatedPvpLog) {
    try {
      return await PvpLog.updateOne({ playerId: discordId }, updatedPvpLog);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async appendPvpLog(discordId, msg) {
    try {
      const event = msg.includes('`') ? msg.replace(/`/g, '') : msg;
      return await PvpLog.findOneAndUpdate(
        { playerId: discordId },
        { $push: { log: { $each: [{ event, timeStamp: Date.now() }], $slice: -25 } } },
        { upsert: true },
      );
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadMoveLog(discordId) {
    try {
      let result = await MoveLog.findOne({ playerId: discordId });
      if (!result) {
        result = await MoveLog.create({ playerId: discordId });
      }
      return result;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async saveMoveLog(discordId, updatedMoveLog) {
    try {
      return await MoveLog.updateOne({ playerId: discordId }, updatedMoveLog);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async appendMoveLog(discordId, msg) {
    try {
      const event = msg.includes('`') ? msg.replace(/`/g, '') : msg;
      return await MoveLog.findOneAndUpdate(
        { playerId: discordId },
        { $push: { log: { $each: [{ event, timeStamp: Date.now() }], $slice: -25 } } },
        { upsert: true },
      );
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadOnlinePlayers(discordId) {
    try {
      return await Player.find({})
        .where('discordId')
        .select({
          pastEvents: 0,
          pastPvpEvents: 0,
        })
        .in(discordId);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadOnlinePlayerMaps(discordIds) {
    const removeNpcs = enumHelper.mockPlayers.map((npc) => npc.name);
    try {
      return await Player.find({
        name: { $nin: removeNpcs, $exists: true },
      })
        .where('discordId')
        .select({
          discordId: 1,
          name: 1,
          map: 1,
        })
        .in(discordIds);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async removeLotteryPlayers(guildId) {
    const query = {
      'lottery.joined': true,
      guildId,
    };
    try {
      return await Player.updateMany(query, { lottery: { joined: false } });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadLotteryPlayers(
    guildId,
    selectFields = {
      pastEvents: 0,
      pastPvpEvents: 0,
    },
  ) {
    const query = {
      guildId,
      'lottery.joined': true,
    };
    try {
      return await Player.find(query).select(selectFields);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadTop10(type, guildId, botID) {
    const select = {
      name: 1,
    };
    const removeNpcs = enumHelper.roamingNpcs.map((npc) => npc.discordId).concat(botID);
    enumHelper.mockPlayers.map((npc) => npc.name).forEach((npc) => removeNpcs.push(npc));

    const fieldKey = Object.keys(type)[0];
    select[fieldKey] = 1;

    let sortType = type;
    if (fieldKey === 'level') {
      select['experience.current'] = 1;
      sortType = { ...type, 'experience.current': -1 };
    }
    const query = {
      discordId: { $nin: removeNpcs, $exists: true },
      guildId,
    };

    try {
      return await Player.find(query).select(select).sort(sortType).limit(10);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadCurrentRank(player, type) {
    const removeNpcs = enumHelper.roamingNpcs.map((npc) => npc.name);
    enumHelper.mockPlayers.map((npc) => npc.name).forEach((npc) => removeNpcs.push(npc));

    const fieldKey = Object.keys(type)[0];
    const playerValue = fieldKey.includes('.')
      ? player[fieldKey.split('.')[0]][fieldKey.split('.')[1]]
      : player[fieldKey];

    const query = { name: { $nin: removeNpcs, $exists: true } };
    query[fieldKey] = { $gt: playerValue };

    try {
      return await Player.countDocuments(query);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async loadPlayer(discordId, selectFields = {}) {
    try {
      const player = await Player.findOne({ discordId }).select(selectFields);

      return player ? player._doc : undefined;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async shouldBeInList(discordId, guildId) {
    try {
      const player = await Player.findOne({ discordId }).select({ guildId: 1 });
      if (!player) {
        return true;
      }

      return player.guildId === guildId;
    } catch (err) {
      errorLog.error(err);
    }
  }

  async setPlayerGuildId(guildId, player) {
    if (!player) {
      return;
    }

    try {
      return await Player.updateOne({ discordId: player.discordId }, { guildId });
    } catch (err) {
      errorLog.error(err);
    }
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

  async savePlayer(player) {
    if (!player) {
      return;
    }
    player.updated_at = Date.now();

    try {
      return await Player.findOneAndUpdate({ discordId: player.discordId }, player);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async getSameMapPlayers(guildId, playerMap, selectFields = {}) {
    if (!playerMap) {
      return;
    }

    try {
      return await Player.find({ 'map.name': playerMap, guildId }).select(selectFields);
    } catch (err) {
      errorLog.error(err);
    }
  }

  async deletePlayer(playerId) {
    try {
      return await Player.deleteOne({ discordId: playerId });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async resetSinglePlayer(playerId) {
    const resetObj = resetPlayerObj;
    try {
      return await Player.updateOne({ discordId: playerId }, { $set: resetObj });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async resetAllPlayersInGuild(guildId) {
    const resetObj = resetPlayerObj;
    resetObj.map = this.MapClass.getRandomTown();

    try {
      return await Player.updateMany({ guildId }, { $set: resetObj });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async resetPersonalMultipliers() {
    try {
      return await Player.updateMany({}, { $set: { personalMultiplier: 0 } });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async resetAllLogs(guildId) {
    try {
      await MoveLog.updateMany({ guildId }, {});
      return await ActionLog.updateMany({ guildId }, {});
    } catch (err) {
      errorLog.error(err);
    }
  }

  async deleteAllPlayersInGuild(guildId) {
    try {
      return await Player.deleteMany({ guildId });
    } catch (err) {
      errorLog.error(err);
    }
  }

  async getStolenEquip(player) {
    const guildPlayers = await Player.find({
      guildId: player.guildId,
      discordId: { $ne: player.discordId },
    });
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
