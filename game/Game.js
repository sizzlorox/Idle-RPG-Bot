const customMethods = require('../utils/CustomMethods').CustomMethods;
const LocalDatabase = require('../utils/local-database/LocalDatabase').LocalDatabase;
const Monster = require('./utils/Monster').Monster;
const Item = require('./utils/Item').Item;
const Event = require('./utils/Event').Event;

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

function checkHealth(selectedPlayer, hook) {
  if (selectedPlayer.health <= 0) {
    //Permadeath
    hook.send(`**${selectedPlayer.name}** died! Game over man... Game over.`);
  }
}

class Game {

  selectEvent(onlinePlayers, hook) {
    if (onlinePlayers.size === 0) {
      return;
    }

    let randomPlayerIndex = customMethods.randomInt(0, onlinePlayers.size - 1);
    if (onlinePlayers.size === 1) {
      randomPlayerIndex = 0;
    }

    const randomPlayer = onlinePlayers.array()[randomPlayerIndex];
    const randomEvent = customMethods.randomInt(1, 3);
    const gamePlayer = {
      name: randomPlayer.username,
      discordId: randomPlayer.id
    };

    return LocalDatabase.load(gamePlayer)
      .then((selectedPlayer) => {
        switch (randomEvent) {
          case 1:
            console.log(`${selectedPlayer.name} activated a move event.`);
            this.moveEvent(selectedPlayer, hook);
            break;
          case 2:
            console.log(`${selectedPlayer.name} activated an attack event.`);
            this.attackEvent(selectedPlayer, onlinePlayers, hook);
            break;
          case 3:
            console.log(`${selectedPlayer.name} activated a luck event.`);
            this.luckEvent(selectedPlayer, hook);
            break;
        }
      });
  }

  moveEvent(selectedPlayer, hook) {
    const map = ['Beach', 'Plains', 'Forest', 'Mountains', 'Town'];
    const randomMapIndex = customMethods.randomInt(0, map.length - 1);
    if (selectedPlayer.map === map[randomMapIndex]) {
      const item = Item.generateItem();
      switch (item.position) {
        case 'helmet':
          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          break;
        case 'armor':
          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          break;
        case 'weapon':
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
      if (selectedPlayer.gold >= item.gold) {
        selectedPlayer.gold -= item.gold;
        switch (item.position) {
          case 'helmet':
            selectedPlayer.equipment.helmet.name = item.name;
            selectedPlayer.equipment.helmet.str = item.stats.str;
            selectedPlayer.equipment.helmet.dex = item.stats.dex;
            selectedPlayer.equipment.helmet.end = item.stats.end;
            selectedPlayer.equipment.helmet.int = item.stats.int;
            break;
          case 'armor':
            selectedPlayer.equipment.armor.name = item.name;
            selectedPlayer.equipment.armor.str = item.stats.str;
            selectedPlayer.equipment.armor.dex = item.stats.dex;
            selectedPlayer.equipment.armor.end = item.stats.end;
            selectedPlayer.equipment.armor.int = item.stats.int;
            break;
          case 'weapon':
            selectedPlayer.equipment.weapon.name = item.name;
            selectedPlayer.equipment.weapon.str = item.stats.str;
            selectedPlayer.equipment.weapon.dex = item.stats.dex;
            selectedPlayer.equipment.weapon.end = item.stats.end;
            selectedPlayer.equipment.weapon.int = item.stats.int;
            break;
        }
        LocalDatabase.write(selectedPlayer);

        return hook.send(`**${selectedPlayer.name}** just purchased ${item.name} from Town for ${item.gold} Gold!`);
      } else {
        return hook.send(`**${selectedPlayer.name}** was going to purchase ${item.name} from Town for ${item.gold} Gold but did not have enough.`);
      }
    }

    const luckDice = customMethods.randomInt(0, 100);
    if (luckDice >= 75 - (selectedPlayer.stats.luk / 2)) {
      if (selectedPlayer.map !== 'Town') {
        const sameMapPlayers = onlinePlayers.filter(player => player.map === selectedPlayer.map);
        if (sameMapPlayers.size > 0) {
          const randomPlayerIndex = customMethods.randomInt(0, sameMapPlayers.size - 1);
          const randomPlayer = sameMapPlayers.array()[randomPlayerIndex];

          return hook.send(`**${selectedPlayer.name}** just attacked **${randomPlayer.name}** with his/her ${selectedPlayer.equipment.weapon.name}!`);
        }
      }
    }

    const mob = Monster.generateMonster();

    selectedPlayer.experience += mob.experience;
    checkExperience(selectedPlayer, hook);
    LocalDatabase.write(selectedPlayer);

    return hook.send(
      `**${selectedPlayer.name}** just killed ${mob.name} with his/her ${selectedPlayer.equipment.weapon.name} gaining ${mob.experience} exp and ${mob.gold} Gold!`
    );
  }

  luckEvent(selectedPlayer, hook) {
    const luckDice = customMethods.randomInt(0, 100);
    if (luckDice <= 5 + (selectedPlayer.stats.luk / 2)) {
      const luckEvent = customMethods.randomInt(0, 3);
      switch (luckEvent) {
        case 0:
          const luckStat = customMethods.randomInt(0, 5);
          const luckStatAmount = customMethods.randomInt(1, 10);
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
          const luckExpAmount = customMethods.randomInt(5, 15);
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }
          LocalDatabase.write(selectedPlayer);

          return hook.send(`Hades unleashed his wrath upon **${selectedPlayer.name}** making him/her lose ${luckExpAmount} experience!`);

        case 3:
          const luckHealthAmount = customMethods.randomInt(5, 15);
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

  //Commands
  playerStats(commandAuthor) {
    try {
      const player = {
        name: commandAuthor.username,
        discordId: commandAuthor.id
      };

      return LocalDatabase.load(player);
    } catch (error) {
      console.log(error);
      return 'Not Found!';
    }
  }

}
module.exports.Game = new Game;