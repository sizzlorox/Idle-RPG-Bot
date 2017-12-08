const helper = require('../../utils/helper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Database = require('../../database/Database');

class Event {

  // Attack Events
  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then((mappedPlayers) => {
        const sameMapPlayers = mappedPlayers.filter(player => player.map.id === selectedPlayer.map.id && player.name !== selectedPlayer.name && onlinePlayers.includes(player.discordId));
        console.log(`${selectedPlayer.map.name} - ${sameMapPlayers.length}`);

        if (sameMapPlayers.length > 0) {
          const randomPlayerIndex = helper.randomInt(0, sameMapPlayers.length - 1);
          const randomPlayer = sameMapPlayers[randomPlayerIndex];

          const { playerChance, otherPlayerChance } = Battle.simulateBattleWithPlayer(
            selectedPlayer,
            randomPlayer
          );

          console.log(`GAME: Attacking Player: ${playerChance} - Random Defending Player: ${otherPlayerChance}`);

          if (playerChance >= otherPlayerChance) {
            helper.checkHealth(randomPlayer, selectedPlayer, discordHook);
            randomPlayer.health -= playerChance;
            Database.savePlayer(randomPlayer.discordId, randomPlayer);
            // Add chance to steal players item (before check health or else he will always try to steal fists)

            return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just attacked \`${randomPlayer.name}\` in ${selectedPlayer.map.name} with his/her \`${selectedPlayer.equipment.weapon.name}\` dealing ${playerChance} damage!`);
          }

          selectedPlayer.health -= otherPlayerChance;
          helper.checkHealth(selectedPlayer, randomPlayer, discordHook);
          // Add chance to steal players item (before check health or else he will always try to steal fists)

          return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just attacked \`${randomPlayer.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` in ${selectedPlayer.map.name} but failed!
            \`${randomPlayer.name}\`s \`${randomPlayer.equipment.weapon.name}\` dealt ${otherPlayerChance} damage!`);
        }
        const luckItemDice = helper.randomInt(0, 100);

        if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
          this.generateTownItemEvent(discordHook, twitchBot, selectedPlayer);
        }
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer) {
    const mob = Monster.generateMonster(selectedPlayer);
    const { playerChance, mobChance } = Battle.simulateBattleWithMob(selectedPlayer, mob);

    if (playerChance >= mobChance) {
      selectedPlayer.experience += mob.experience;
      selectedPlayer.kills.mob++;
      helper.checkExperience(selectedPlayer, discordHook);

      return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just killed \`${mob.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` gaining ${mob.experience} exp and ${mob.gold} Gold!`);
    }

    selectedPlayer.health -= mobChance;
    helper.checkHealth(selectedPlayer, mob, discordHook);

    return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just lost a battle to \`${mob.name}\` losing ${mobChance} health and ${mob.gold} Gold!`);
  }

  // Item Events
  generateTownItemEvent(discordHook, twitchBot, selectedPlayer) {
    const item = Item.generateItem(selectedPlayer);
    switch (item.position) {
      case 'helmet':
        if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
          return;
        }

        if (selectedPlayer.gold >= item.gold) {
          selectedPlayer.gold -= item.gold;
          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
        }
        break;

      case 'armor':
        if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
          return;
        }

        if (selectedPlayer.gold >= item.gold) {
          selectedPlayer.gold -= item.gold;
          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
        }
        break;

      case 'weapon':
        if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
          return;
        }

        if (selectedPlayer.gold >= item.gold) {
          selectedPlayer.gold -= item.gold;
          selectedPlayer.equipment.weapon.name = item.name;
          selectedPlayer.equipment.weapon.str = item.stats.str;
          selectedPlayer.equipment.weapon.dex = item.stats.dex;
          selectedPlayer.equipment.weapon.end = item.stats.end;
          selectedPlayer.equipment.weapon.int = item.stats.int;
          return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
        }
        break;
    }
  }

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventMessage = helper.randomInt(0, 3);
    switch (randomEventMessage) {
      case 0:
        return `\`${selectedPlayer.name}\` found a chest containing \`${item.name}\` in ${selectedPlayer.map.name}!`;
      case 1:
        return `\`${selectedPlayer.name}\` found \`${item.name}\` on the ground in ${selectedPlayer.map.name}!`;
      case 2:
        return `\`${selectedPlayer.name}\` explored an abandoned hut in ${selectedPlayer.map.name} which had \`${item.name}\` inside!`;
      case 3:
        return `\`${selectedPlayer.name}\` a bird just dropped \`${item.name}\` infront of him/her in ${selectedPlayer.map.name}!`;
    }
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    const luckEvent = helper.randomInt(0, 3);
    switch (luckEvent) {
      case 0:
        const luckStat = helper.randomInt(0, 4);
        const luckStatAmount = helper.randomInt(2, 10);
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
        }
        return helper.sendMessage(discordHook, twitchBot, `Apollo has blessed \`${selectedPlayer.name}\` with his music raising his/her \`${stat}\` by ${luckStatAmount}!`);

      case 1:
        const luckExpAmount = helper.randomInt(5, 15);
        selectedPlayer.experience -= luckExpAmount;
        if (selectedPlayer.experience < 0) {
          selectedPlayer.experience = 0;
        }

        return helper.sendMessage(discordHook, twitchBot, `Hades unleashed his wrath upon \`${selectedPlayer.name}\` making him/her lose ${luckExpAmount} experience!`);

      case 3:
        const luckHealthAmount = helper.randomInt(5, 15);
        selectedPlayer.health -= luckHealthAmount;
        helper.checkHealth(selectedPlayer, discordHook);

        return helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just lost ${luckHealthAmount} health by tripping and hitting his/her head!`);
    }
  }

  generateGoldEvent(selectedPlayer) {
    const luckGoldDice = helper.randomInt(0, 100);
    const goldAmount = Number(((luckGoldDice * selectedPlayer.stats.luk) / 2).toFixed());
    selectedPlayer.gold += goldAmount;
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    const luckItemDice = helper.randomInt(0, 100);

    if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
      const item = Item.generateItem(selectedPlayer);
      switch (item.position) {
        case 'helmet':
          if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return;
          }

          selectedPlayer.equipment.helmet.name = item.name;
          selectedPlayer.equipment.helmet.str = item.stats.str;
          selectedPlayer.equipment.helmet.dex = item.stats.dex;
          selectedPlayer.equipment.helmet.end = item.stats.end;
          selectedPlayer.equipment.helmet.int = item.stats.int;
          break;
        case 'armor':
          if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return;
          }

          selectedPlayer.equipment.armor.name = item.name;
          selectedPlayer.equipment.armor.str = item.stats.str;
          selectedPlayer.equipment.armor.dex = item.stats.dex;
          selectedPlayer.equipment.armor.end = item.stats.end;
          selectedPlayer.equipment.armor.int = item.stats.int;
          break;
        case 'weapon':
          if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return;
          }

          selectedPlayer.equipment.weapon.name = item.name;
          selectedPlayer.equipment.weapon.str = item.stats.str;
          selectedPlayer.equipment.weapon.dex = item.stats.dex;
          selectedPlayer.equipment.weapon.end = item.stats.end;
          selectedPlayer.equipment.weapon.int = item.stats.int;
          break;
      }

      return helper.sendMessage(discordHook, twitchBot, Event.generateItemEventMessage(selectedPlayer, item));
    }
  }

}
module.exports = new Event();
