const fs = require('fs');
const moment = require('moment');
const helper = require('../helper');
const Map = require('../../game/utils/Map');
const logger = require('../logger');

const playerDir = `${__dirname}/players`;
const starterTown = 4;

class LocalDatabase {

  create(player) {
    return helper.countDirectoryFiles(playerDir)
      .then((id) => {
        if (!player.id) {
          player.id = player.discordId;
          player.username = player.name;
        }

        const newPlayer = {
          id,
          discordId: player.id,
          name: player.username,
          health: 105,
          experience: 0,
          map: Map.getMapByIndex(starterTown),
          level: 1,
          gold: 0,
          equipment: {
            helmet: {
              name: 'Nothing',
              str: 0,
              dex: 0,
              end: 0,
              int: 0
            },
            armor: {
              name: 'Nothing',
              str: 0,
              dex: 0,
              end: 0,
              int: 0
            },
            weapon: {
              name: 'Fist',
              str: 1,
              dex: 1,
              end: 1,
              int: 0
            },
            relic: {
              name: 'Nothing',
              str: 0,
              dex: 0,
              end: 0,
              int: 0,
              luk: 0
            }
          },
          stats: {
            str: 1,
            dex: 1,
            end: 1,
            int: 1,
            luk: 1
          },
          isOnline: true,
          lastLogin: moment().toISOString(),
          createdAt: moment().toISOString(),
          events: 0,
          kills: {
            mob: 0,
            player: 0
          },
          deaths: {
            mob: 0,
            player: 0
          }
        };
        this.write(newPlayer);
        return newPlayer;
      })
      .catch(error => logger.error(error));
  }

  write(player) {
    fs.writeFile(`${playerDir}/${player.discordId}.json`, JSON.stringify(player), 'utf8', (err) => {
      if (err) {
        console.log(err);
      }
      console.log(`${player.name} has been updated successfully!`);
    });
  }

  load(player) {
    return new Promise((resolve, reject) => {
      try {
        return resolve(require(`${playerDir}/${player.discordId}.json`));
      } catch (error) {
        return resolve(this.create(player));
      }
    });
  }

}
module.exports = new LocalDatabase();
