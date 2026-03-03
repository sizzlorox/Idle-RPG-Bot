const enumHelper = require('../../utils/enumHelper');
const { battleDebug } = require('../../../settings');

function _enchantBonus(player, stat) {
  let bonus = 0;
  const slots = ['weapon', 'armor', 'helmet'];
  for (const slot of slots) {
    const enchant = player.equipment[slot].enchant;
    if (enchant && enchant.stat === stat) bonus += enchant.bonus || 0;
  }
  return bonus;
}

function sumPlayerTotalStrength(player) {
  return player.stats.str + player.equipment.relic.str + _enchantBonus(player, 'str');
}

function sumPlayerTotalDexterity(player) {
  return player.stats.dex + player.equipment.relic.dex + _enchantBonus(player, 'dex');
}

function sumPlayerTotalEndurance(player) {
  return player.stats.end + player.equipment.relic.end + _enchantBonus(player, 'end');
}

function sumPlayerTotalIntelligence(player) {
  return player.stats.int + player.equipment.relic.int + _enchantBonus(player, 'int');
}

function sumPlayerTotalLuck(player) {
  return player.stats.luk + player.equipment.relic.luk + _enchantBonus(player, 'luk');
}

function calculateItemRating(player, item) {
  const enchantBonus = item.enchant ? item.enchant.bonus * 0.5 : 0;
  if (player && item.position !== enumHelper.equipment.types.relic.position) {
    if (item.position !== enumHelper.equipment.types.weapon.position) {
      return item.power + enchantBonus;
    }
    const luk = sumPlayerTotalLuck(player);
    switch (item.attackType) {
      case 'melee':
        return Math.ceil(item.power + sumPlayerTotalStrength(player) + luk * 0.5 + enchantBonus);
      case 'range':
        return Math.ceil(item.power + sumPlayerTotalDexterity(player) + luk * 0.5 + enchantBonus);
      case 'magic':
        return Math.ceil(item.power + sumPlayerTotalIntelligence(player) + luk * 0.5 + enchantBonus);
    }
  }
  return Math.ceil(item.str + item.dex + item.end + item.int + item.luk);
}

function printBattleDebug(msg) {
  if (battleDebug) console.log(msg);
}

module.exports = {
  sumPlayerTotalStrength,
  sumPlayerTotalDexterity,
  sumPlayerTotalEndurance,
  sumPlayerTotalIntelligence,
  sumPlayerTotalLuck,
  calculateItemRating,
  printBattleDebug
};
