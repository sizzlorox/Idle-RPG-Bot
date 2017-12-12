const helper = require('../../utils/helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Map = require('../utils/Map');
const Database = require('../../database/Database');

class Event {

  // Move Events
  moveEvent(selectedPlayer) {
    return new Promise((resolve) => {
      selectedPlayer.map = Map.moveToRandomMap(selectedPlayer);
      return resolve(selectedPlayer);
    });
  }

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

            helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just attacked \`${randomPlayer.name}\` in ${selectedPlayer.map.name} with his/her \`${selectedPlayer.equipment.weapon.name}\` dealing ${playerChance} damage!`);
            const { updatedPlayer, updatedRandomPlayer } = this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer);
            Database.savePlayer(randomPlayer.discordId, updatedRandomPlayer);

            return updatedPlayer;
          }

          selectedPlayer.health -= otherPlayerChance;
          helper.checkHealth(selectedPlayer, randomPlayer, discordHook);

          helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just attacked \`${randomPlayer.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` in ${selectedPlayer.map.name} but failed!
            \`${randomPlayer.name}\`s \`${randomPlayer.equipment.weapon.name}\` dealt ${otherPlayerChance} damage!`);

          const { updatedRandomPlayer, updatedPlayer } = this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer);

          Database.savePlayer(randomPlayer.discordId, updatedRandomPlayer);
          return updatedPlayer;
        }
        const luckItemDice = helper.randomInt(0, 100);

        if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
          return this.generateTownItemEvent(discordHook, twitchBot, selectedPlayer);
        }

        return selectedPlayer;
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const mob = Monster.generateMonster(selectedPlayer);
      const { playerChance, mobChance } = Battle.simulateBattleWithMob(selectedPlayer, mob);

      if (playerChance >= mobChance) {
        selectedPlayer.experience += mob.experience;
        selectedPlayer.kills.mob++;
        helper.checkExperience(selectedPlayer, discordHook);

        helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just killed \`${mob.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` gaining ${mob.experience} exp and ${mob.gold} Gold!`);
        selectedPlayer = this.generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob);
        return resolve(selectedPlayer);
      }

      console.log(`GAME: PlayerChance: ${playerChance} - MobChance: ${mobChance}`);

      selectedPlayer.health -= mobChance;
      helper.checkHealth(selectedPlayer, mob, discordHook);

      helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just lost a battle to \`${mob.name}\` in \`${selectedPlayer.map.name}\` losing ${mobChance} health and ${mob.gold} Gold!`);
      return resolve(selectedPlayer);
    });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = helper.randomInt(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 2)) {
        const item = Item.generateItem(selectedPlayer);
        switch (item.position) {
          case enumHelper.equipment.types.helmet.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            break;
          case enumHelper.equipment.types.armor.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
              return resolve(selectedPlayer);
            }


            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            break;
          case enumHelper.equipment.types.weapon.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            break;
        }

        helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name} dropped a ${item.name} from ${mob.name}!`);
        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  // Item Events
  generateTownItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const item = Item.generateItem(selectedPlayer);
      switch (item.position) {
        case enumHelper.equipment.types.helmet.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;

        case enumHelper.equipment.types.armor.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;

        case enumHelper.equipment.types.weapon.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;
      }

      return resolve(selectedPlayer);
    });
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

  stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = helper.randomInt(0, 100);
      if (luckStealChance > 50) {
        const luckItem = helper.randomInt(0, 3);
        switch (luckItem) {
          case 0:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) < helper.calculateItemRating(randomPlayer.equipment.helmet)) {
              selectedPlayer.equipment.helmet = randomPlayer.equipment.helmet;
              selectedPlayer.equipment.helmet.name = `${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}`;
              discordHook.send(`\`\`\`css\n${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}!\`\`\``);
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.helmet.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 1:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) < helper.calculateItemRating(randomPlayer.equipment.armor)) {
              selectedPlayer.equipment.armor = randomPlayer.equipment.armor;
              selectedPlayer.equipment.armor.name = `${randomPlayer.name}s ${randomPlayer.equipment.armor.name}`;
              discordHook.send(`\`\`\`css\n${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.armor.name}!\`\`\``);
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.armor.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 2:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) < helper.calculateItemRating(randomPlayer.equipment.weapon)) {
              selectedPlayer.equipment.weapon = randomPlayer.equipment.weapon;
              selectedPlayer.equipment.weapon.name = `${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}`;
              discordHook.send(`\`\`\`css\n${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}!\`\`\``);
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.weapon.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 3:
            if (helper.calculateItemRating(selectedPlayer.equipment.relic) < helper.calculateItemRating(randomPlayer.equipment.relic)) {
              selectedPlayer.equipment.relic = randomPlayer.equipment.relic;
              selectedPlayer.equipment.relic.name = `${randomPlayer.name}s ${randomPlayer.equipment.relic.name}`;
              discordHook.send(`\`\`\`css\n${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.relic.name}!\`\`\``);
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.relic.position, enumHelper.equipment.empty.equip);
            }
            break;
        }
      }

      return resolve({ selectedPlayer, randomPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = helper.randomInt(0, 3);
      switch (luckEvent) {
        case 0:
          const luckStat = helper.randomInt(0, 4);
          const luckStatAmount = helper.randomInt(2, 10);
          let stat;
          switch (luckStat) {
            case 0:
              stat = enumHelper.stats.str;
              selectedPlayer.stats.str += luckStatAmount;
              break;
            case 1:
              stat = enumHelper.stats.dex;
              selectedPlayer.stats.dex += luckStatAmount;
              break;
            case 2:
              stat = enumHelper.stats.end;
              selectedPlayer.stats.end += luckStatAmount;
              break;
            case 4:
              stat = enumHelper.stats.int;
              selectedPlayer.stats.int += luckStatAmount;
              break;
          }

          helper.sendMessage(discordHook, twitchBot, `Apollo has blessed \`${selectedPlayer.name}\` with his music raising his/her \`${stat}\` by ${luckStatAmount}!`);
          return resolve(selectedPlayer);

        case 1:
          const luckExpAmount = helper.randomInt(5, 15);
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          helper.sendMessage(discordHook, twitchBot, `Hades unleashed his wrath upon \`${selectedPlayer.name}\` making him/her lose ${luckExpAmount} experience!`);
          return resolve(selectedPlayer);

        case 3:
          const luckHealthAmount = helper.randomInt(5, 15);
          selectedPlayer.health -= luckHealthAmount;
          helper.checkHealth(selectedPlayer, discordHook);
          helper.sendMessage(discordHook, twitchBot, `\`${selectedPlayer.name}\` just lost ${luckHealthAmount} health by tripping and hitting his/her head!`);

          return resolve(selectedPlayer);
      }
    });
  }

  generateGoldEvent(selectedPlayer) {
    return new Promise((resolve) => {
      const luckGoldDice = helper.randomInt(0, 100);
      const goldAmount = Number(((luckGoldDice * selectedPlayer.stats.luk) / 2).toFixed());
      selectedPlayer.gold += goldAmount;
      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = helper.randomInt(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
        const item = Item.generateItem(selectedPlayer);
        switch (item.position) {
          case enumHelper.equipment.types.helmet.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            break;
          case enumHelper.equipment.types.armor.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
              return resolve(selectedPlayer);
            }


            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            break;
          case enumHelper.equipment.types.weapon.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            break;
        }

        helper.sendMessage(discordHook, twitchBot, this.generateItemEventMessage(selectedPlayer, item));
        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

}
module.exports = new Event();
