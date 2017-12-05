const Helper = require('../utils/Helper');
const LocalDatabase = require('../utils/local-database/LocalDatabase');
const Monster = require('./utils/Monster');
const Item = require('./utils/Item');
const Event = require('./utils/Event');
const Battle = require('./utils/Battle');
const logger = require('../utils/logger');

function checkExperience(selectedPlayer, discordHook, twitchBot) {
  if (selectedPlayer.experience >= selectedPlayer.level * 15) {
    selectedPlayer.level++;
    selectedPlayer.experience = 0;
    selectedPlayer.health = 100 + (selectedPlayer.level * 5);
    selectedPlayer.stats.str++;
    selectedPlayer.stats.dex++;
    selectedPlayer.stats.end++;
    selectedPlayer.stats.int++;
    Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** is now level ${selectedPlayer.level}!`);
  }
}

class Game {
  selectEvent(onlinePlayers, discordHook, twitchBot) {
    if (onlinePlayers.size === 0) {
      return;
    }

    let randomPlayerIndex = Helper.randomInt(0, onlinePlayers.size - 1);
    console.log(`\nRandom Player Index: ${randomPlayerIndex}`);
    if (onlinePlayers.size === 1) {
      randomPlayerIndex = 0;
    }

    const randomPlayer = onlinePlayers.array()[randomPlayerIndex];
    const randomEvent = Helper.randomInt(0, 2);
    const gamePlayer = {
      name: randomPlayer.username,
      discordId: randomPlayer.id
    };

    LocalDatabase.load(gamePlayer)
      .then((selectedPlayer) => {
        selectedPlayer.events++;
        selectedPlayer = Helper.passiveHeal(selectedPlayer);
        console.log(`\nRandom Event ID: ${randomEvent}`);

        switch (randomEvent) {
          case 0:
            console.log(`${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer, discordHook, twitchBot);
            LocalDatabase.write(selectedPlayer);
            break;
          case 1:
            console.log(`${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot);
            LocalDatabase.write(selectedPlayer);
            break;
          case 2:
            console.log(`${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, discordHook, twitchBot);
            LocalDatabase.write(selectedPlayer);
            break;
        }

        if (selectedPlayer.events % 100 === 0) {
          Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** has encountered ${selectedPlayer.events} events!`);
        }
      });
  }

  moveEvent(selectedPlayer, discordHook, twitchBot) {
    const map = ['Beach', 'Plains', 'Forest', 'Mountains', 'Town'];
    const randomMapIndex = Helper.randomInt(0, map.length - 1);
    const luckDice = Helper.randomInt(0, 100);

    if (selectedPlayer.map === map[randomMapIndex]) {
      if (luckDice <= 15 + (selectedPlayer.stats.luk / 2)) {
        const item = Item.generateItem(selectedPlayer);
        switch (item.position) {
          case 'helmet':
            if (Helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
              return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.helmet.name} is better.`);
            }

            selectedPlayer.equipment.helmet.name = item.name;
            selectedPlayer.equipment.helmet.str = item.stats.str;
            selectedPlayer.equipment.helmet.dex = item.stats.dex;
            selectedPlayer.equipment.helmet.end = item.stats.end;
            selectedPlayer.equipment.helmet.int = item.stats.int;
            break;
          case 'armor':
            if (Helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
              return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.armor.name} is better.`);
            }

            selectedPlayer.equipment.armor.name = item.name;
            selectedPlayer.equipment.armor.str = item.stats.str;
            selectedPlayer.equipment.armor.dex = item.stats.dex;
            selectedPlayer.equipment.armor.end = item.stats.end;
            selectedPlayer.equipment.armor.int = item.stats.int;
            break;
          case 'weapon':
            if (Helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
              return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.weapon.name} is better.`);
            }

            selectedPlayer.equipment.weapon.name = item.name;
            selectedPlayer.equipment.weapon.str = item.stats.str;
            selectedPlayer.equipment.weapon.dex = item.stats.dex;
            selectedPlayer.equipment.weapon.end = item.stats.end;
            selectedPlayer.equipment.weapon.int = item.stats.int;
            break;
        }

        return Helper.sendMessage(discordHook, twitchBot, Event.generateItemEventMessage(selectedPlayer, item));
      }

      return false;
    }
    selectedPlayer.map = map[randomMapIndex];

    return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** has moved to ${selectedPlayer.map}.`);
  }

  attackEvent(selectedPlayer, onlinePlayers, discordHook, twitchBot) {
    const luckDice = Helper.randomInt(0, 100);
    if (selectedPlayer.map === 'Town' && luckDice <= 15 + (selectedPlayer.stats.luk / 2)) {
      const item = Item.generateItem(selectedPlayer);
      switch (item.position) {
        case 'helmet':
          if (Helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.helmet.name} is better.`);
          }

          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          break;

        case 'armor':
          if (Helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.armor.name} is better.`);
          }

          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          break;

        case 'weapon':
          if (Helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.weapon.name} is better.`);
          }

          selectedPlayer.equipment.weapon.name = item.name;
          selectedPlayer.equipment.weapon.str = item.stats.str;
          selectedPlayer.equipment.weapon.dex = item.stats.dex;
          selectedPlayer.equipment.weapon.end = item.stats.end;
          selectedPlayer.equipment.weapon.int = item.stats.int;
          break;
      }

      if (selectedPlayer.gold >= item.gold) {
        selectedPlayer.gold -= item.gold;

        return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just purchased ${item.name} from Town for ${item.gold} Gold!`);
      }

      return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** was going to purchase ${item.name} from Town for ${item.gold} Gold but did not have enough.`);
    }

    if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      if (selectedPlayer.map !== 'Town') {
        const mappedPromises = onlinePlayers.map((player) => {
          return LocalDatabase.load({
            name: player.username,
            discordId: player.id
          });
        });

        return Promise.all(mappedPromises)
          .then((mappedPlayers) => {
            const sameMapPlayers = mappedPlayers.filter(player => player.map === selectedPlayer.map && player.name !== selectedPlayer.name);
            console.log(`${selectedPlayer.map} - ${sameMapPlayers.length}`);

            if (sameMapPlayers.length > 0) {
              const randomPlayerIndex = Helper.randomInt(0, sameMapPlayers.length - 1);
              const randomPlayer = sameMapPlayers[randomPlayerIndex];

              const { playerChance, otherPlayerChance } = Battle.simulateBattleWithPlayer(
                selectedPlayer,
                randomPlayer
              );

              console.log(`${playerChance} --- ${otherPlayerChance}`);

              if (playerChance >= otherPlayerChance) {
                Helper.checkHealth(randomPlayer, selectedPlayer, discordHook);
                randomPlayer.health -= playerChance;
                LocalDatabase.write(randomPlayer);
                // Add chance to steal players item (before check health or else he will always try to steal fists)

                return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just attacked **${randomPlayer.name}** in ${selectedPlayer.map} with his/her ${selectedPlayer.equipment.weapon.name} dealing ${playerChance} damage!`);
              }

              selectedPlayer.health -= otherPlayerChance;
              Helper.checkHealth(selectedPlayer, randomPlayer, discordHook);
              // Add chance to steal players item (before check health or else he will always try to steal fists)

              return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just attacked **${randomPlayer.name}** with his/her ${selectedPlayer.equipment.weapon.name} in ${selectedPlayer.map} but failed!
                **${randomPlayer.name}**s ${randomPlayer.equipment.weapon.name} dealt ${otherPlayerChance} damage!`);
            }
          });
      }
    }

    const mob = Monster.generateMonster(selectedPlayer);
    const { playerChance, mobChance } = Battle.simulateBattleWithMob(selectedPlayer, mob);

    if (playerChance >= mobChance) {
      selectedPlayer.experience += mob.experience;
      selectedPlayer.kills.mob++;
      checkExperience(selectedPlayer, discordHook);

      return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just killed ${mob.name} with his/her ${selectedPlayer.equipment.weapon.name} gaining ${mob.experience} exp and ${mob.gold} Gold!`);
    }

    selectedPlayer.health -= mobChance;
    Helper.checkHealth(selectedPlayer, mob, discordHook);

    return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just lost a battle to ${mob.name} losing ${mobChance} health and ${mob.gold} Gold!`);
  }

  luckEvent(selectedPlayer, discordHook, twitchBot) {
    const luckDice = Helper.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      const luckEvent = Helper.randomInt(0, 3);
      switch (luckEvent) {
        case 0:
          const luckStat = Helper.randomInt(0, 5);
          const luckStatAmount = Helper.randomInt(2, 10);
          let stat;
          switch (luckStat) {
            case 0:
              stat = 'Strength';
              selectedPlayer.stats.str += luckStatAmount;
              break;
            case 1:
              stat = 'Dexterity';
              selectedPlayer.stats.dex += luckStatAmount;
              break;
            case 2:
              stat = 'Endurance';
              selectedPlayer.stats.end += luckStatAmount;
              break;
            case 4:
              stat = 'Intelligence';
              selectedPlayer.stats.int += luckStatAmount;
              break;
            case 5:
              stat = 'Luck';
              selectedPlayer.stats.luk += luckStatAmount;
              break;
          }

          return Helper.sendMessage(discordHook, twitchBot, `Apollo has blessed **${selectedPlayer.name}** with his music raising his/her ${stat} by ${luckStatAmount}!`);

        case 1:
          const luckExpAmount = Helper.randomInt(5, 15);
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          return Helper.sendMessage(discordHook, twitchBot, `Hades unleashed his wrath upon **${selectedPlayer.name}** making him/her lose ${luckExpAmount} experience!`);

        case 3:
          const luckHealthAmount = Helper.randomInt(5, 15);
          selectedPlayer.health -= luckHealthAmount;
          checkHealth(selectedPlayer, discordHook);

          return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** just lost ${luckHealthAmount} health by tripping and hitting his/her head!`);
      }
    } else if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      const goldAmount = Number(((luckDice * selectedPlayer.stats.luk) / 2).toFixed());
      selectedPlayer.gold += goldAmount;

      return Helper.sendMessage(discordHook, twitchBot, `**${selectedPlayer.name}** found ${goldAmount} Gold in ${selectedPlayer.map}.`);
    }
  }

  // Commands
  playerStats(commandAuthor) {
    try {
      const player = {
        name: commandAuthor.username,
        discordId: commandAuthor.id
      };

      return LocalDatabase.load(player);
    } catch (error) {
      logger.error(error);
      return 'Not Found!';
    }
  }
}
module.exports = new Game();
