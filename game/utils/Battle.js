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

    const playerChance = Math.floor((playerDamage + playerEvasive) - (mobDefense + mobEvasive));
    const mobChance = Math.floor((mobDamage + mobEvasive) - (playerDefense + playerEvasive));
    console.log(`PlayerChance: ${playerChance} - MobChance: ${mobChance}`);

    return { playerChance, mobChance };
  }
}
module.exports = new Battle();
