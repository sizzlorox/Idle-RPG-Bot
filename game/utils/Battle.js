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

    const playerChance = Math.abs(Math.ceil((playerDamage + playerEvasive) - (mobDefense + mobEvasive)));
    const mobChance = Math.abs(Math.ceil((mobDamage + mobEvasive) - (playerDefense + playerEvasive)));
    console.log(`PlayerChance: ${playerChance} - MobChance: ${mobChance}`);

    return { playerChance, mobChance };
  }

  simulateBattleWithPlayer(selectedPlayer, otherPlayer) {
    const playerDamage = Helper.sumPlayerTotalStrength(selectedPlayer);
    const playerEvasive = Helper.sumPlayerTotalDexterity(selectedPlayer)
      + (Helper.sumPlayerTotalIntelligence(selectedPlayer) / 2);
    const playerDefense = Helper.sumPlayerTotalEndurance(selectedPlayer);

    const otherPlayerDamage = Helper.sumPlayerTotalStrength(otherPlayer);
    const otherPlayerEvasive = Helper.sumPlayerTotalDexterity(otherPlayer)
      + (Helper.sumPlayerTotalIntelligence(otherPlayer) / 2);
    const otherPlayerDefense = Helper.sumPlayerTotalEndurance(otherPlayer);

    const playerChance = Math.abs(Math.ceil((playerDamage + playerEvasive) - (otherPlayerDefense + otherPlayerEvasive)) + Helper.randomInt(1, 5 + Helper.sumPlayerTotalLuck(selectedPlayer)));
    const otherPlayerChance = Math.abs(Math.ceil((otherPlayerDamage + otherPlayerEvasive) - (playerDefense + playerEvasive)) + Helper.randomInt(1, 5 + Helper.sumPlayerTotalLuck(otherPlayer)));
    console.log(`PlayerChance: ${playerChance} - OtherPlayerChance: ${otherPlayerChance}`);

    return { playerChance, otherPlayerChance };
  }
}
module.exports = new Battle();
