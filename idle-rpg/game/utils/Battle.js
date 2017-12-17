const helper = require('../../utils/helper');

class Battle {
  simulateBattleWithMob(selectedPlayer, mobObj) {
    return new Promise((resolve) => {
      const playerDamage = helper.sumPlayerTotalStrength(selectedPlayer);
      const playerEvasive = helper.sumPlayerTotalDexterity(selectedPlayer)
        + (helper.sumPlayerTotalIntelligence(selectedPlayer) / 2);
      const playerDefense = helper.sumPlayerTotalEndurance(selectedPlayer);

      const mobDamage = mobObj.stats.str;
      const mobEvasive = mobObj.stats.dex;
      const mobDefense = mobObj.stats.end;

      const playerChance = Math.ceil((playerDamage + playerEvasive) - (mobDefense + mobEvasive));
      const mobChance = Math.ceil((mobDamage + mobEvasive) - (playerDefense + playerEvasive));

      return resolve({ playerChance, mobChance });
    });
  }

  simulateBattleWithPlayer(selectedPlayer, otherPlayer) {
    const playerDamage = helper.sumPlayerTotalStrength(selectedPlayer);
    const playerEvasive = helper.sumPlayerTotalDexterity(selectedPlayer)
      + (helper.sumPlayerTotalIntelligence(selectedPlayer) / 2);
    const playerDefense = helper.sumPlayerTotalEndurance(selectedPlayer);

    const otherPlayerDamage = helper.sumPlayerTotalStrength(otherPlayer);
    const otherPlayerEvasive = helper.sumPlayerTotalDexterity(otherPlayer)
      + (helper.sumPlayerTotalIntelligence(otherPlayer) / 2);
    const otherPlayerDefense = helper.sumPlayerTotalEndurance(otherPlayer);

    const playerChance = Math.ceil((playerDamage + playerEvasive) - (otherPlayerDefense + otherPlayerEvasive)) + helper.randomInt(1, 5 + helper.sumPlayerTotalLuck(selectedPlayer));
    const otherPlayerChance = Math.ceil((otherPlayerDamage + otherPlayerEvasive) - (playerDefense + playerEvasive)) + helper.randomInt(1, 5 + helper.sumPlayerTotalLuck(otherPlayer));
    console.log(`PlayerChance: ${playerChance} - OtherPlayerChance: ${otherPlayerChance}`);

    return { playerChance, otherPlayerChance };
  }
}
module.exports = new Battle();
