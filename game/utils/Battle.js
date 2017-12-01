const Helper = require('../../utils/Helper');

class Battle {
  simulateBattleWithMob(selectedPlayer, mobObj) {
    const playerDamage = Helper.sumPlayerTotalStrength(selectedPlayer);
    const playerEvasive = Helper.sumPlayerTotalDexterity(selectedPlayer)
      + (Helper.sumPlayerTotalIntelligence(selectedPlayer) / 2);
    const playerDefense = Helper.sumPlayerTotalEndurance(selectedPlayer);

    const mobDamage = mobObj.stats.str;
    const mobEvasive = mobObj.stats.dex;
    const mobDefense = mobObj.stats.end;

    const playerChance = (playerDamage + playerEvasive) - (mobDefense + mobEvasive);
    const mobChance = (mobDamage + mobEvasive) - (playerDefense + playerEvasive);
    console.log(`PlayerChance: ${playerChance} - MobChance: ${mobChance}`);

    if (playerChance >= mobChance) {
      return true;
    }

    return mobChance;
  }
}
module.exports = new Battle();
