const enumHelper = require('../../utils/enumHelper');
const { battleDebug } = require('../../../settings');

function sumPlayerTotalStrength(player) {
  return player.stats.str + player.equipment.relic.str;
}

function sumPlayerTotalDexterity(player) {
  return player.stats.dex + player.equipment.relic.dex;
}

function sumPlayerTotalEndurance(player) {
  return player.stats.end + player.equipment.relic.end;
}

function sumPlayerTotalIntelligence(player) {
  return player.stats.int + player.equipment.relic.int;
}

function sumPlayerTotalLuck(player) {
  return player.stats.luk + player.equipment.relic.luk;
}

function calculateItemRating(player, item) {
  if (player && item.position !== enumHelper.equipment.types.relic.position) {
    if (item.position !== enumHelper.equipment.types.weapon.position) {
      return item.power;
    }
    const luk = sumPlayerTotalLuck(player);
    switch (item.attackType) {
      case 'melee':
        return Math.ceil(item.power + sumPlayerTotalStrength(player) + luk * 0.5);
      case 'range':
        return Math.ceil(item.power + sumPlayerTotalDexterity(player) + luk * 0.5);
      case 'magic':
        return Math.ceil(item.power + sumPlayerTotalIntelligence(player) + luk * 0.5);
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
