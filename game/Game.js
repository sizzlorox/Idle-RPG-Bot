const Helper = require('../utils/Helper');
const LocalDatabase = require('../utils/local-database/LocalDatabase');
const Monster = require('./utils/Monster');
const Item = require('./utils/Item');
const Event = require('./utils/Event');
const Battle = require('./utils/Battle');
const logger = require('../utils/logger');

function checkExperience(selectedPlayer, hook) {
  if (selectedPlayer.experience >= selectedPlayer.level * 15) {
    selectedPlayer.level++;
    selectedPlayer.experience = 0;
    selectedPlayer.health = 100 + (selectedPlayer.level * 5);
    selectedPlayer.stats.str++;
    selectedPlayer.stats.dex++;
    selectedPlayer.stats.end++;
    selectedPlayer.stats.int++;
    hook.send(`**${selectedPlayer.name}** is now level ${selectedPlayer.level}!`);
  }
}

class Game {

  selectEvent(onlinePlayers, hook) {
    if (onlinePlayers.size === 0) {
      return;
    }

    let randomPlayerIndex = Helper.randomInt(0, onlinePlayers.size - 1);
    if (onlinePlayers.size === 1) {
      randomPlayerIndex = 0;
    }

    const randomPlayer = onlinePlayers.array()[randomPlayerIndex];
    const randomEvent = Helper.randomInt(1, 3);
    const gamePlayer = {
      name: randomPlayer.username,
      discordId: randomPlayer.id
    };

    LocalDatabase.load(gamePlayer)
      .then((selectedPlayer) => {
        selectedPlayer.events++;
        switch (randomEvent) {
          case 1:
            logger.info(`${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer, hook);
            break;
          case 2:
            logger.info(`${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, hook);
            break;
          case 3:
            logger.info(`${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, hook);
            break;
        }
      });
  }

  moveEvent(selectedPlayer, hook) {
    const map = ['Beach', 'Plains', 'Forest', 'Mountains', 'Town'];
    const randomMapIndex = Helper.randomInt(0, map.length - 1);
    if (selectedPlayer.map === map[randomMapIndex]) {
      const item = Item.generateItem();
      switch (item.position) {
        case 'helmet':
          if (Helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.helmet.name} is better.`);
          }

          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          break;
        case 'armor':
          if (Helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.armor.name} is better.`);
          }

          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          break;
        case 'weapon':
          if (Helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** found a ${item.name} but his/her ${selectedPlayer.equipment.weapon.name} is better.`);
          }

          selectedPlayer.equipment.weapon.name = item.name;
          selectedPlayer.equipment.weapon.str = item.stats.str;
          selectedPlayer.equipment.weapon.dex = item.stats.dex;
          selectedPlayer.equipment.weapon.end = item.stats.end;
          selectedPlayer.equipment.weapon.int = item.stats.int;
          break;
      }
      LocalDatabase.write(selectedPlayer);

      return hook.send(Event.generateItemEventMessage(selectedPlayer, item));
    }
    selectedPlayer.map = map[randomMapIndex];

    LocalDatabase.write(selectedPlayer);

    return hook.send(`**${selectedPlayer.name}** has moved to ${selectedPlayer.map}.`);
  }

  attackEvent(selectedPlayer, onlinePlayers, hook) {
    if (selectedPlayer.map === 'Town') {
      const item = Item.generateItem();
      switch (item.position) {
        case 'helmet':
          if (Helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.helmet.name} is better.`);
          }

          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          break;

        case 'armor':
          if (Helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.armor.name} is better.`);
          }

          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          break;

        case 'weapon':
          if (Helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return hook.send(`**${selectedPlayer.name}** was about to purchase ${item.name} from Town but his/her ${selectedPlayer.equipment.weapon.name} is better.`);
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
        LocalDatabase.write(selectedPlayer);

        return hook.send(`**${selectedPlayer.name}** just purchased ${item.name} from Town for ${item.gold} Gold!`);
      }

      return hook.send(`**${selectedPlayer.name}** was going to purchase ${item.name} from Town for ${item.gold} Gold but did not have enough.`);
    }

    const luckDice = Helper.randomInt(0, 100);
    if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      if (selectedPlayer.map !== 'Town') {
        const sameMapPlayers = onlinePlayers.filter(player => player.map === selectedPlayer.map);
        if (sameMapPlayers.size > 0) {
          const randomPlayerIndex = Helper.randomInt(0, sameMapPlayers.size - 1);
          const randomPlayer = sameMapPlayers.array()[randomPlayerIndex];
          selectedPlayer.kills.player++;
          LocalDatabase.write(selectedPlayer);

          return hook.send(`**${selectedPlayer.name}** just attacked **${randomPlayer.name}** with his/her ${selectedPlayer.equipment.weapon.name}!`);
        }
      }
    }

    const mob = Monster.generateMonster();
    const { playerChance, mobChance } = Battle.simulateBattleWithMob(selectedPlayer, mob);
    if (playerChance >= mobChance) {
      selectedPlayer.experience += mob.experience;
      selectedPlayer.kills.mob++;
      checkExperience(selectedPlayer, hook);
      LocalDatabase.write(selectedPlayer);

      return hook.send(`**${selectedPlayer.name}** just killed ${mob.name} with his/her ${selectedPlayer.equipment.weapon.name} gaining ${mob.experience} exp and ${mob.gold} Gold!`);
    }

    selectedPlayer.health -= battleResult;
    Helper.checkHealth(selectedPlayer, mob, hook);
    LocalDatabase.write(selectedPlayer);

    return hook.send(`**${selectedPlayer.name}** just lost a battle to ${mob.name} losing ${mobChance} health and ${mob.gold} Gold!`);
  }

  luckEvent(selectedPlayer, hook) {
    const luckDice = Helper.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      const luckEvent = Helper.randomInt(0, 3);
      switch (luckEvent) {
        case 0:
          const luckStat = Helper.randomInt(0, 5);
          const luckStatAmount = Helper.randomInt(1, 10);
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
          LocalDatabase.write(selectedPlayer);

          return hook.send(`Apollo has blessed **${selectedPlayer.name}** with his music raising his/her ${stat} by ${luckStatAmount}!`);

        case 1:
          const luckExpAmount = Helper.randomInt(5, 15);
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }
          LocalDatabase.write(selectedPlayer);

          return hook.send(`Hades unleashed his wrath upon **${selectedPlayer.name}** making him/her lose ${luckExpAmount} experience!`);

        case 3:
          const luckHealthAmount = Helper.randomInt(5, 15);
          selectedPlayer.health -= luckHealthAmount;
          checkHealth(selectedPlayer, hook);
          LocalDatabase.write(selectedPlayer);

          return hook.send(`**${selectedPlayer.name}** just lost ${luckHealthAmount} health by tripping and hitting his/her head!`);
      }
    } else if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      const goldAmount = Number(((luckDice * selectedPlayer.stats.luk) / 2).toFixed());
      selectedPlayer.gold += goldAmount;
      LocalDatabase.write(selectedPlayer);

      return hook.send(`**${selectedPlayer.name}** found ${goldAmount} Gold in ${selectedPlayer.map}.`);
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
