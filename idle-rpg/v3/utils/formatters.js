const enumHelper = require('../../utils/enumHelper');
const { getTimePassed } = require('./helpers');
const { sumPlayerTotalStrength, sumPlayerTotalDexterity, sumPlayerTotalEndurance, sumPlayerTotalIntelligence, sumPlayerTotalLuck, calculateItemRating } = require('./battleHelpers');

function generatePlayerName(player, isAction) {
  if (
    player.isMentionInDiscord === 'off'
    || player.isMentionInDiscord === 'action' && !isAction
    || player.isMentionInDiscord === 'move' && isAction
  ) {
    return player.titles.current !== 'None'
      ? `\`${player.name} the ${player.titles.current}\``
      : `\`${player.name}\``;
  }

  return player.titles.current !== 'None'
    ? `<@!${player.discordId}> the ${player.titles.current}`
    : `<@!${player.discordId}>`;
}

function generateGenderString(player, word) {
  return enumHelper.genders[player.gender] ? enumHelper.genders[player.gender][word] : word;
}

function generatePreviousOwnerString(equipment) {
  if (equipment.previousOwners && equipment.previousOwners.length > 0) {
    let result = 'Previous Owners:\n            ';
    result += equipment.previousOwners.join('\n            ');
    result += '\n';
    return result;
  }
  return '';
}

function generateStatsString(player) {
  return `\`\`\`Here are your stats!
    Title: ${player.titles.current}
    Health: ${player.health} / ${enumHelper.maxHealth(player.level)}
    Mana: ${player.mana} / ${enumHelper.maxMana(player.level)}
    Level: ${player.level}
    Personal Multiplier: ${player.personalMultiplier}x
    Experience:
      Current: ${player.experience.current}
      Lost: ${player.experience.lost} (${((player.experience.lost / player.experience.total) * 100).toFixed(2)}%)
      Total: ${player.experience.total}
      TNL: ${(player.level * 15) - player.experience.current} / ${(player.level * 15)}
    Class: ${player.class}
    Gender: ${player.gender}
    Gold:
      Current: ${player.gold.current}
      Lost: ${player.gold.lost} (${((player.gold.lost / player.gold.total) * 100).toFixed(2)}%)
      Stolen from you: ${player.gold.stolen} (${((player.gold.stolen / player.gold.total) * 100).toFixed(2)}%)
      Stole from others: ${player.gold.stole} (${((player.gold.stole / player.gold.total) * 100).toFixed(2)}%)
      Lottery: ${player.gold.dailyLottery} (${((player.gold.dailyLottery / player.gold.total) * 100).toFixed(2)}%)
      Gambles:
        Count: ${player.gambles}
        Won: ${player.gold.gambles.won} (${((player.gold.gambles.won / player.gold.total) * 100).toFixed(2)}%)
        Lost: ${player.gold.gambles.lost} (${((player.gold.gambles.lost / player.gold.total) * 100).toFixed(2)}%)
      Total: ${player.gold.total}
    Map: ${player.map.name}
    Bounty: ${player.currentBounty}

    Stats (Sum of stats with equipment):
      Strength: ${player.stats.str} (${sumPlayerTotalStrength(player)})
      Dexterity: ${player.stats.dex} (${sumPlayerTotalDexterity(player)})
      Endurance: ${player.stats.end} (${sumPlayerTotalEndurance(player)})
      Intelligence: ${player.stats.int} (${sumPlayerTotalIntelligence(player)})
      Luck: ${player.stats.luk} (${sumPlayerTotalLuck(player)})

    Quest:
      Monster: ${player.quest.questMob.name}
      Count: ${player.quest.questMob.count}
      Kills Left: ${player.quest.questMob.count - player.quest.questMob.killCount}
      Completed: ${player.quest.completed}
      Last Update: ${getTimePassed(player.quest.updated_at.getTime())}

    Born: ${getTimePassed(player.createdAt)}
    Travelled: ${player.travelled} (${((player.travelled / player.events) * 100).toFixed(2)}%)
    Events: ${player.events}
    Items Stolen: ${player.stole}
    Items Lost: ${player.stolen}
    Spells Cast: ${player.spellCast}
    Kills:
      Monsters: ${player.kills.mob}
      Players: ${player.kills.player}
    Fled:
      Monsters: ${player.fled.mob}
      Players: ${player.fled.player}
      You: ${player.fled.you}
    Battles:
      Won: ${player.battles.won}
      Lost: ${player.battles.lost}
    Deaths:
      By Monsters: ${player.deaths.mob}
      By Players: ${player.deaths.player}\`\`\``;
}

function generateEquipmentsString(player) {
  const weaponRating = calculateItemRating(player, player.equipment.weapon);
  return `\`\`\`Here is your equipment!
        Helmet: ${player.equipment.helmet.name}
          Defense: ${player.equipment.helmet.power}
          ${generatePreviousOwnerString(player.equipment.helmet)}
        Armor: ${player.equipment.armor.name}
          Defense: ${player.equipment.armor.power}
          ${generatePreviousOwnerString(player.equipment.armor)}
        Weapon: ${player.equipment.weapon.name}
          BaseAttackPower: ${player.equipment.weapon.power}
          AttackPower: ${Number(weaponRating)}
          AttackType: ${player.equipment.weapon.attackType}
          ${generatePreviousOwnerString(player.equipment.weapon)}
        Relic: ${player.equipment.relic.name}
          Stats:
            Strength: ${player.equipment.relic.str}
            Dexterity: ${player.equipment.relic.dex}
            Endurance: ${player.equipment.relic.end}
            Intelligence: ${player.equipment.relic.int}
            Luck: ${player.equipment.relic.luk}
          ${generatePreviousOwnerString(player.equipment.relic)}
            \`\`\``;
}

function generateInventoryEquipmentString(player) {
  const parts = [];
  player.inventory.equipment.forEach((equip) => {
    switch (equip.position) {
      case enumHelper.equipment.types.helmet.position:
        parts.push(`${equip.name}:
            Defense: ${equip.power}
          ${generatePreviousOwnerString(equip)}`);
        break;
      case enumHelper.equipment.types.armor.position:
        parts.push(`${equip.name}:
            Defense: ${equip.power}
          ${generatePreviousOwnerString(equip)}`);
        break;
      case enumHelper.equipment.types.weapon.position: {
        const weaponRating = calculateItemRating(player, equip);
        parts.push(`${equip.name}:
            BaseAttackPower: ${equip.power}
            AttackPower: ${Number(weaponRating)}
            AttackType: ${equip.attackType}
          ${generatePreviousOwnerString(equip)}`);
        break;
      }
    }
  });
  return parts.join('\n          ');
}

function generateInventoryString(player) {
  const equipment = generateInventoryEquipmentString(player);
  return `\`\`\`Here is your inventory!
        Equipment:
          ${equipment}

        Items:
          ${player.inventory.items.map(item => item.name).join('\n      ')}\`\`\``;
}

function generateSpellBookString(player) {
  const lines = ['```Here\'s your spellbook!'];
  player.spells.forEach((spell) => {
    lines.push(`    ${spell.name} - ${spell.description}`);
  });
  lines.push('```');
  return lines.join('\n');
}

function generateLog(log, count) {
  if (log.length === 0) return '';

  let logResult = 'Heres what you have done so far:\n      ';
  let logCount = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    if (logCount === count) break;
    let eventText;
    if (typeof log[i].event === 'string') {
      eventText = log[i].event;
    } else {
      eventText = log[i].event[0];
    }
    logResult += `${eventText} [${getTimePassed(log[i].timeStamp)} ago]\n      `.replace(/`/g, '');
    logCount++;
  }
  return logResult;
}

function formatLeaderboards(subjectKey) {
  if (subjectKey.includes('.')) {
    if (subjectKey.includes('deaths.mob')) return subjectKey.replace('deaths.mob', 'Killed by mob');
    if (subjectKey.includes('deaths.player')) return subjectKey.replace('deaths.player', 'Killed by player');
    if (subjectKey.includes('kills.player')) return subjectKey.replace('kills.player', 'Player kills');
    if (subjectKey.includes('quest.completed')) return subjectKey.replace('quest.completed', 'Completed Quests');
    return subjectKey.split('.')[0];
  }
  return subjectKey.replace('currentBounty', 'Bounty').replace('spellCast', 'Spells Cast');
}

module.exports = {
  generatePlayerName,
  generateGenderString,
  generatePreviousOwnerString,
  generateStatsString,
  generateEquipmentsString,
  generateInventoryString,
  generateSpellBookString,
  generateLog,
  formatLeaderboards
};
