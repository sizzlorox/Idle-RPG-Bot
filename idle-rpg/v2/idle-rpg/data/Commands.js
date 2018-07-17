const enumHelper = require('../../../utils/enumHelper');
const globalSpells = require('../../../game/data/globalSpells');
const { errorLog } = require('../../../utils/logger');

class Commands {

  constructor(params) {
    const { Database, Events, Config, MapManager } = params;
    this.Database = Database;
    this.Events = Events;
    this.config = Config;
    this.MapManager = MapManager;
  }

  playerStats(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, enumHelper.statsSelectFields);
  }

  playerInventory(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, enumHelper.inventorySelectFields);
  }

  async resetQuest(commandAuthor) {
    const loadedPlayer = await this.Database.loadPlayer(commandAuthor);
    try {
      if (!loadedPlayer || !loadedPlayer.quest) {
        return 'I\'m sorry but you have no quest.';
      }
      if (((new Date() - loadedPlayer.quest.updated_at) / (1000 * 60 * 60 * 24)) >= 2) {
        return 'I\'m sorry but you must have a quest at least 2 days old';
      }
      const oldQuestMob = loadedPlayer.quest.questMob.name;
      const updatedPlayer = await this.Events.retrieveNewQuest(loadedPlayer);
      await this.Database.savePlayer(updatedPlayer);
      return `Quest ${oldQuestMob} has been changed to ${updatedPlayer.quest.questMob.name} Count: ${updatedPlayer.quest.questMob.count}`;
    } catch (err) {
      errorLog.error(err);
    }
  }

  joinLottery(commandAuthor) {
    return this.Database.loadPlayer(commandAuthor.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        if (player.lottery.joined) {
          return 'You\'ve already joined todays daily lottery!';
        }
        player.lottery.joined = true;
        player.lottery.amount += 100;

        return this.Database.loadGame()
          .then((updatedConfig) => {
            updatedConfig.dailyLottery.prizePool += 100;
            this.config = updatedConfig;

            return this.Database.updateGame(updatedConfig)
              .then(() => this.Database.savePlayer(player))
              .then(() => 'You have joined todays daily lottery! Good luck!')
              .catch(err => errorLog.error(err));
          })
          .catch(err => errorLog.error(err));
      });
  }

  prizePool() {
    return this.Database.loadLotteryPlayers()
      .then((lotteryPlayers) => {
        return `There are ${lotteryPlayers.length} contestants for a prize pool of ${this.config.dailyLottery.prizePool} gold!`;
      });
  }

  checkMultiplier() {
    return `Current Multiplier: ${this.config.multiplier}x\nActive Bless: ${this.config.spells.activeBless}x`;
  }

  top10(commandAuthor, type) {
    return this.Database.loadTop10(type)
      .then((top10) => {
        const rankString = `${top10.filter(player => Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] > 0)
          .sort((player1, player2) => {
            if (Object.keys(type)[0] === 'level') {
              return player2.experience.current - player1.experience.current && player2.level - player1.level;
            }

            if (Object.keys(type)[0].includes('.')) {
              const keys = Object.keys(type)[0].split('.');
              return player2[keys[0]][keys[1]] - player1[keys[0]][keys[1]];
            }

            return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
          })
          .map((player, rank) => `Rank ${rank + 1}: ${player.name} - ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}: ${player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}: ${player[Object.keys(type)[0]]}`}`)
          .join('\n')}`;

        commandAuthor.send(`\`\`\`Top 10 ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}`}:
${rankString}
        \`\`\``);
      });
  }

  getRank(commandAuthor, type) {
    return this.Database.loadPlayer(commandAuthor.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then(player => this.Database.loadCurrentRank(player, type))
      .then(currentRank => currentRank.filter(player => Object.keys(type)[0].includes('.') ? player[Object.keys(type)[0].split('.')[0]][Object.keys(type)[0].split('.')[1]] : player[Object.keys(type)[0]] > 0)
        .sort((player1, player2) => {
          if (Object.keys(type)[0] === 'level') {
            return player2.experience.current - player1.experience.current && player2.level - player1.level;
          }

          if (Object.keys(type)[0].includes('.')) {
            const keys = Object.keys(type)[0].split('.');
            return player2[keys[0]][keys[1]] - player1[keys[0]][keys[1]];
          }

          return player2[Object.keys(type)[0]] - player1[Object.keys(type)[0]];
        }).findIndex(player => player.discordId === commandAuthor.id))
      .then((rank) => {
        commandAuthor.send(`You're currently ranked ${rank + 1} in ${Object.keys(type)[0].includes('.') ? Object.keys(type)[0].split('.')[0] : Object.keys(type)[0]}!`);
      });
  }

  castSpell(commandAuthor, spell) {
    return this.Database.loadPlayer(commandAuthor.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        const guildActionsChannel = commandAuthor.guild.channels.find(channel => channel.name === 'actions' && channel.type === 'text' && channel.parent.name === 'Idle-RPG');
        switch (spell) {
          case 'bless':
            if (castingPlayer.gold.current >= globalSpells.bless.spellCost) {
              castingPlayer.spellCast++;
              castingPlayer.gold.current -= globalSpells.bless.spellCost;
              this.Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been cast!');
                })
                .then(() => this.Database.updateGame(this.config));
              this.config.multiplier += 1;
              this.config.spells.activeBless++;
              guildActionsChannel.send(this.Helper.setImportantMessage(`${castingPlayer.name} just cast ${spell}!!\nCurrent Active Bless: ${this.config.spells.activeBless}\nCurrent Multiplier is: ${this.config.multiplier}x`));
              setTimeout(() => {
                this.config.multiplier -= 1;
                this.config.multiplier = this.config.multiplier <= 0 ? 1 : this.config.multiplier;
                this.config.spells.activeBless--;
                this.Database.updateGame(this.config);

                guildActionsChannel.send(this.Helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off.\nCurrent Active Bless: ${this.config.spells.activeBless}\nCurrent Multiplier is: ${this.config.multiplier}x`));
              }, 1800000); // 30 minutes
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${globalSpells.bless.spellCost} gold. You are lacking ${globalSpells.bless.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;

          case 'home':
            if (castingPlayer.gold.current >= globalSpells.home.spellCost) {
              castingPlayer.gold.current -= globalSpells.home.spellCost;
              const randomHome = this.MapManager.getRandomTown();
              castingPlayer.map = randomHome;
              guildActionsChannel.send(`${castingPlayer.name} just cast ${spell}!\nTeleported back to ${randomHome.name}.`);
              this.Database.savePlayer(castingPlayer)
                .then(() => {
                  commandAuthor.send('Spell has been cast!');
                });
            } else {
              commandAuthor.send(`You do not have enough gold! This spell costs ${globalSpells.home.spellCost} gold. You are lacking ${globalSpells.home.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;
        }
      });
  }

}
module.exports = Commands;