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

    const playerChance = Math.ceil((playerDamage + playerEvasive) - (otherPlayerDefense + otherPlayerEvasive)) + helper.randomBetween(1, 5 + helper.sumPlayerTotalLuck(selectedPlayer));
    const otherPlayerChance = Math.ceil((otherPlayerDamage + otherPlayerEvasive) - (playerDefense + playerEvasive)) + helper.randomBetween(1, 5 + helper.sumPlayerTotalLuck(otherPlayer));
    console.log(`PlayerChance: ${playerChance} - OtherPlayerChance: ${otherPlayerChance}`);

    return { playerChance, otherPlayerChance };
  }

  newSimulateBattleWithPlayer(attacker, defender) {
    return new Promise((resolve) => {
      const maxRounds = 30;
      const battleResults = [];
      for (let round = 1; round <= maxRounds; round++) {
        battleResults.push(this.round(attacker, defender));
        if (attacker.health <= 0 || defender.health <= 0) {
          break;
        }
      }

      return Promise.all(battleResults)
        .then((results) => {
          let attackerDamage = 0;
          let defenderDamage = 0;
          results.forEach((result) => {
            attackerDamage += result.attackerDamage ? result.attackerDamage : 0;
            defenderDamage += result.defenderDamage ? result.defenderDamage : 0;
          });

          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        });
    });
  }

  initialAttack(attacker, defender) {
    const attackerInitialAttackChance = helper.sumPlayerTotalDexterity(attacker) + (helper.sumPlayerTotalLuck(attacker) / 2);
    const defenderInitialAttackChance = helper.sumPlayerTotalDexterity(defender) + (helper.sumPlayerTotalLuck(defender) / 2);
    if (attackerInitialAttackChance >= defenderInitialAttackChance) {
      return attacker;
    }

    return defender;
  }

  round(attacker, defender) {
    const battleStats = {
      attacker: this.getBattleStats(attacker),
      defender: this.getBattleStats(defender)
    };

    return this.battleTurn(attacker, defender, battleStats);
    // .then(battleResults => this.spellTurn(battleResults.attacker, battleResults.defender))
  }

  battleTurn(attacker, defender, battleStats) {
    const initiative = this.initialAttack(attacker, defender);
    return new Promise((resolve) => {
      let attackerDamage;
      let defenderDamage;
      if (initiative.name === attacker.name) {
        console.log('Initiative is Attacker');
        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = battleStats.attacker.attackPower - battleStats.defender.defensePower.physicalDefensePower;
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
        } else {
          attackerDamage = battleStats.attacker.attackPower - battleStats.defender.defensePower.magicDefensePower;
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
        }

        console.log(`Attacker Damage: ${attackerDamage}`);
        if (defender.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = battleStats.defender.attackPower - battleStats.attacker.defensePower.physicalDefensePower;
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
        } else {
          defenderDamage = battleStats.defender.attackPower - battleStats.attacker.defensePower.magicDefensePower;
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
        }

        console.log(`Defender Damage: ${defenderDamage}`);
      } else if (initiative.name === defender.name) {
        console.log('Initiative is Defender');
        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = battleStats.defender.attackPower - battleStats.attacker.defensePower.physicalDefensePower;
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
        } else {
          defenderDamage = battleStats.defender.attackPower - battleStats.attacker.defensePower.magicDefensePower;
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
        }

        console.log(`Defender Damage: ${defenderDamage}`);
        if (attacker.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = battleStats.attacker.attackPower - battleStats.defender.defensePower.physicalDefensePower;
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
        } else {
          attackerDamage = battleStats.attacker.attackPower - battleStats.defender.defensePower.magicDefensePower;
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
        }

        console.log(`Attacker Damage: ${attackerDamage}`);
      }

      return resolve({ attacker, defender, attackerDamage, defenderDamage });
    });
  }

  spellTurn(attacker, defender, battleStats) {
    return new Promise((resolve) => {

      return resolve({ attacker, defender });
    });
  }

  inventoryTurn(attacker, defender, battleStats) {
    return new Promise((resolve) => {

      return resolve({ attacker, defender });
    });
  }

  // BATTLE FUNCS
  getBattleStats(player) {
    const attackPower = this.calculateAttack(player);
    const defensePower = this.calculateDefense(player);

    return { attackPower, defensePower };
  }

  calculateAttack(player) {
    let attackPower;
    switch (player.equipment.weapon.attackType) {
      case 'melee':
        attackPower = (helper.sumPlayerTotalStrength(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player) + helper.randomBetween(1, helper.sumPlayerTotalStrength(player))) / 2));
        break;
      case 'range':
        attackPower = (helper.sumPlayerTotalDexterity(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player) + helper.randomBetween(1, helper.sumPlayerTotalDexterity(player))) / 2));
        break;
      case 'magic':
        attackPower = (helper.sumPlayerTotalIntelligence(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player) + helper.randomBetween(1, helper.sumPlayerTotalIntelligence(player))) / 2));
        break;
    }

    return attackPower;
  }

  calculateDefense(player) {
    const physicalDefensePower = (helper.sumPlayerTotalEndurance(player) + player.equipment.armor.power)
      * (helper.sumPlayerTotalDexterity(player) + (helper.sumPlayerTotalLuck(player) / 2));
    const magicDefensePower = (helper.sumPlayerTotalIntelligence(player) + player.equipment.armor.power)
      * (helper.sumPlayerTotalDexterity(player) + (helper.sumPlayerTotalLuck(player) / 2));

    return { physicalDefensePower, magicDefensePower };
  }

}
module.exports = new Battle();
