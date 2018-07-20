const enumHelper = require('../../../utils/enumHelper');
const globalSpells = require('../../../game/data/globalSpells');
const { errorLog } = require('../../../utils/logger');

class Commands {

  constructor(params) {
    const { Helper, Database, Events, MapManager } = params;
    this.Helper = Helper;
    this.Database = Database;
    this.Events = Events;
    this.MapManager = MapManager;
  }

  playerStats(params) {
    const { author } = params;
    return this.Database.loadPlayer(author.id, enumHelper.statsSelectFields);
  }

  playerInventory(params) {
    const { author } = params;
    return this.Database.loadPlayer(author.id, enumHelper.inventorySelectFields);
  }

  async resetQuest(params) {
    const { author } = params;
    const loadedPlayer = await this.Database.loadPlayer(author);
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

  joinLottery(params) {
    const { Game, author } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        if (player.lottery.joined) {
          return 'You\'ve already joined todays daily lottery!';
        }
        player.lottery.joined = true;
        player.lottery.amount += 100;

        return this.Database.loadGame()
          .then((updatedConfig) => {
            updatedConfig.dailyLottery.prizePool += 100;
            Game.setConfig(updatedConfig);

            return this.Database.updateGame(updatedConfig)
              .then(() => this.Database.savePlayer(player))
              .then(() => 'You have joined todays daily lottery! Good luck!')
              .catch(err => errorLog.error(err));
          })
          .catch(err => errorLog.error(err));
      });
  }

  prizePool(params) {
    const { author } = params;
    return this.Database.loadLotteryPlayers()
      .then(async (lotteryPlayers) => {
        const config = await this.Database.loadGame();
        return author.send(`There are ${lotteryPlayers.length} contestants for a prize pool of ${config.dailyLottery.prizePool} gold!`);
      });
  }

  async checkMultiplier(params) {
    const { author } = params;
    const config = await this.Database.loadGame();
    return author.send(`Current Multiplier: ${config.multiplier}x\nActive Bless: ${config.spells.activeBless}x`);
  }

  top10(params) {
    const { author, type } = params;
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

        author.send(`\`\`\`Top 10 ${Object.keys(type)[0].includes('.') ? `${Object.keys(type)[0].split('.')[0]}` : `${Object.keys(type)[0].replace('currentBounty', 'Bounty')}`}:
${rankString}
        \`\`\``);
      });
  }

  getRank(params) {
    const { author, type } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
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
        }).findIndex(player => player.discordId === author.id))
      .then((rank) => {
        author.send(`You're currently ranked ${rank + 1} in ${Object.keys(type)[0].includes('.') ? Object.keys(type)[0].split('.')[0] : Object.keys(type)[0]}!`);
      });
  }

  castSpell(params) {
    const { Game, author, actionsChannel, spell } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        switch (spell) {
          case 'bless':
            if (castingPlayer.gold.current >= globalSpells.bless.spellCost) {
              castingPlayer.spellCast++;
              castingPlayer.gold.current -= globalSpells.bless.spellCost;
              this.Database.savePlayer(castingPlayer)
                .then(() => {
                  author.send('Spell has been cast!');
                });
              Game.setMultiplier(Game.getMultiplier() + 1);
              Game.setActiveBless(Game.getActiveBless() + 1);
              Game.updateConfig();
              actionsChannel.send(this.Helper.setImportantMessage(`${castingPlayer.name} just cast ${spell}!!\nCurrent Active Bless: ${Game.getConfig().spells.activeBless}\nCurrent Multiplier is: ${Game.getConfig().multiplier}x`));
              setTimeout(() => {
                Game.setMultiplier(Game.getMultiplier() - 1 <= 0 ? 1 : Game.getMultiplier() - 1);
                Game.setActiveBless(Game.getActiveBless() - 1 <= 0 ? 0 : Game.getActiveBless() - 1);
                Game.updateConfig();
                actionsChannel.send(this.Helper.setImportantMessage(`${castingPlayer.name}s ${spell} just wore off.\nCurrent Active Bless: ${Game.getConfig().spells.activeBless}\nCurrent Multiplier is: ${Game.getConfig().multiplier}x`));
              }, 1800000); // 30 minutes
            } else {
              author.send(`You do not have enough gold! This spell costs ${globalSpells.bless.spellCost} gold. You are lacking ${globalSpells.bless.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;

          case 'home':
            if (castingPlayer.gold.current >= globalSpells.home.spellCost) {
              castingPlayer.gold.current -= globalSpells.home.spellCost;
              const randomHome = this.MapManager.getRandomTown();
              castingPlayer.map = randomHome;
              actionsChannel.send(`${castingPlayer.name} just cast ${spell} and teleported back to ${randomHome.name}.`);
              author.send(`Teleported back to ${randomHome.name}.`);
              this.Database.savePlayer(castingPlayer)
                .then(() => {
                  author.send('Spell has been cast!');
                });
            } else {
              author.send(`You do not have enough gold! This spell costs ${globalSpells.home.spellCost} gold. You are lacking ${globalSpells.home.spellCost - castingPlayer.gold.current} gold.`);
            }
            break;
        }
      });
  }

  placeBounty(params) {
    const { author, actionsChannel, recipient, amount } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((placer) => {
        if (placer.gold.current >= amount) {
          placer.gold.current -= amount;

          return this.Database.savePlayer(placer)
            .then(() => {
              return this.Database.loadPlayer(recipient)
                .then((bountyRecipient) => {
                  if (!bountyRecipient) {
                    return author.send('This player does not exist.');
                  }
                  bountyRecipient.currentBounty += amount;
                  actionsChannel.send(this.Helper.setImportantMessage(`${placer.name} just put a bounty of ${amount} gold on ${bountyRecipient.name}'s head!`));

                  return this.Database.savePlayer(bountyRecipient)
                    .then(() => author.send(`Bounty of ${amount} gold has been placed`));
                });
            });
        }

        return author.send('You need more gold to place this bounty');
      });
  }

  playerEventLog(params) {
    const { author, amount } = params;
    return this.Database.loadActionLog(author.id)
      .then((playerLog) => {
        if (!playerLog.log.length) {
          return;
        }

        return this.Helper.generateLog(playerLog, amount);
      });
  }

  playerPvpLog(params) {
    const { author, amount } = params;
    return this.Database.loadPvpLog(author.id)
      .then((player) => {
        if (!player) {
          return;
        }

        return this.Helper.generatePvpLog(player, amount);
      });
  }

  modifyPM(params) {
    const { author, value, filtered } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.isPrivateMessage !== value || castingPlayer.isPrivateMessageImportant !== filtered) {
          castingPlayer.isPrivateMessage = value;
          castingPlayer.isPrivateMessageImportant = filtered;

          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Preference for being PMed has been updated.'));
        }

        return author.send('Your PM preference is already set to this value.');
      });
  }

  modifyMention(params) {
    const { author, value } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.isMentionInDiscord !== value) {
          castingPlayer.isMentionInDiscord = value;

          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Preference for being @mention has been updated.'));
        }

        return author.send('Your @mention preference is already set to this value.');
      });
  }

  modifyGender(params) {
    const { author, value } = params;
    return this.Database.loadPlayer(author.id, { pastEvents: 0, pastPvpEvents: 0 })
      .then((castingPlayer) => {
        if (!castingPlayer) {
          return author.send('Please set this after you have been born');
        }

        if (castingPlayer.gender !== value) {
          castingPlayer.gender = value;
          return this.Database.savePlayer(castingPlayer)
            .then(() => author.send('Gender has been updated.'));
        }

        return author.send('Your gender is already set to this value.');
      });
  }

  setPlayerBounty(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        player.currentBounty = amount;
        return this.Database.savePlayer(player);
      });
  }

  setPlayergold(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((player) => {
        player.gold.current = Number(amount);
        player.gold.total += Number(amount);
        return this.Database.savePlayer(player);
      });
  }

  deletePlayer(params) {
    const { recipient } = params;
    return this.Database.deletePlayer(recipient);
  }

  giveGold(params) {
    const { recipient, amount } = params;
    return this.Database.loadPlayer(recipient, { pastEvents: 0, pastPvpEvents: 0 })
      .then((updatingPlayer) => {
        updatingPlayer.gold.current += Number(amount);
        updatingPlayer.gold.total += Number(amount);
        this.Database.savePlayer(updatingPlayer);
      });
  }

}
module.exports = Commands;