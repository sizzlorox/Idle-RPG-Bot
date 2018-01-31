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

    const playerChance = Math.round((playerDamage + playerEvasive) - (otherPlayerDefense + otherPlayerEvasive)) + helper.randomBetween(1, 5 + helper.sumPlayerTotalLuck(selectedPlayer));
    const otherPlayerChance = Math.round((otherPlayerDamage + otherPlayerEvasive) - (playerDefense + playerEvasive)) + helper.randomBetween(1, 5 + helper.sumPlayerTotalLuck(otherPlayer));
    helper.printBattleDebug(`PlayerChance: ${playerChance} - OtherPlayerChance: ${otherPlayerChance}`);

    return { playerChance, otherPlayerChance };
  }

  newSimulateBattle(attacker, defender) {
    return new Promise((resolve) => {
      const maxRounds = 10;
      const battleResults = [];
      for (let round = 1; round <= maxRounds; round++) {
        battleResults.push(
          this.round(attacker, defender)
        );
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
          if (attacker.health < 0) {
            attacker.health = 0;
          }
          if (defender.health < 0) {
            defender.health = 0;
          }

          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        });
    });
  }

  initialAttack(attacker, defender) {
    const attackerInitialAttackChance = this.isMonster(attacker)
      ? attacker.stats.dex + (attacker.stats.luk / 2)
      : helper.sumPlayerTotalDexterity(attacker) + (helper.sumPlayerTotalLuck(attacker) / 2);
    const defenderInitialAttackChance = this.isMonster(defender)
      ? defender.stats.dex + (defender.stats.luk / 2)
      : helper.sumPlayerTotalDexterity(defender) + (helper.sumPlayerTotalLuck(defender) / 2);
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
  }

  battleTurn(attacker, defender, battleStats) {
    const initiative = this.initialAttack(attacker, defender);
    return new Promise((resolve) => {
      let attackerDamage;
      let defenderDamage;
      if (initiative.name === attacker.name) {
        helper.printBattleDebug('\nBattle Initiative is Attacker');
        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = Math.round(battleStats.attacker.attackPower - battleStats.defender.defensePower.physicalDefensePower);
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        } else {
          attackerDamage = Math.round(battleStats.attacker.attackPower - battleStats.defender.defensePower.magicDefensePower);
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        }

        helper.printBattleDebug(`Attacker Damage: ${attackerDamage}`);
        if (defender.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = Math.round(battleStats.defender.attackPower - battleStats.attacker.defensePower.physicalDefensePower);
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
          helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        } else {
          defenderDamage = Math.round(battleStats.defender.attackPower - battleStats.attacker.defensePower.magicDefensePower);
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
          helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        }

        helper.printBattleDebug(`Defender Damage: ${defenderDamage}`);
      } else if (initiative.name === defender.name) {
        helper.printBattleDebug('\nBattle Initiative is Defender');
        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = Math.round(battleStats.defender.attackPower - battleStats.attacker.defensePower.physicalDefensePower);
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
          helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        } else {
          defenderDamage = Math.round(battleStats.defender.attackPower - battleStats.attacker.defensePower.magicDefensePower);
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }

          attacker.health -= defenderDamage;
          helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        }

        helper.printBattleDebug(`Defender Damage: ${defenderDamage}`);
        if (attacker.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = Math.round(battleStats.attacker.attackPower - battleStats.defender.defensePower.physicalDefensePower);
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        } else {
          attackerDamage = Math.round(battleStats.attacker.attackPower - battleStats.defender.defensePower.magicDefensePower);
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        }

        helper.printBattleDebug(`Attacker Damage: ${attackerDamage}`);
      }

      return resolve(this.spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage));
    });
  }

  spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage) {
    return new Promise((resolve) => {
      const initiative = this.initialAttack(attacker, defender);
      if (initiative.name === attacker.name) {
        helper.printBattleDebug('\nSpell Initiative is Attacker');
        if (attacker.spells.length > 0) {
          const attackerRandomSpell = helper.randomBetween(0, attacker.spells.length - 1);
          const attackerSpellToCast = attacker.spells[attackerRandomSpell];
          switch (attackerSpellToCast.type) {
            case 'self':
              if (attackerSpellToCast.name.toLowerCase().includes('heal')) {
                attacker.health += attackerSpellToCast.power * 2;
                helper.printBattleDebug(`${attacker.name} healed for ${attackerSpellToCast.power * 2}
                HEALTH ${attacker.health - (attackerSpellToCast.power * 2)} -> ${attacker.health}`);
                if (attacker.health >= 100 + (attacker.level * 5)) {
                  attacker.health = 100 + (attacker.level * 5);
                }
              }
              break;
            case 'target':
              if (attackerSpellToCast.name.toLowerCase().includes('fireball')) {
                let spellDamage = Math.round((attackerSpellToCast.power * 2) - battleStats.defender.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                defenderDamage += spellDamage;
                defender.health -= spellDamage;
                helper.printBattleDebug(`${defender.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${defender.health + spellDamage} -> ${defender.health}`);
              }
              break;
          }
        }
        if (defender.spells.length > 0) {
          const defenderRandomSpell = helper.randomBetween(0, defender.spells.length - 1);
          const defenderSpellToCast = defender.spells[defenderRandomSpell];
          switch (defenderSpellToCast.type) {
            case 'self':
              if (defenderSpellToCast.name.toLowerCase().includes('heal')) {
                defender.health += defenderSpellToCast.power * 2;
                helper.printBattleDebug(`${defender.name} healed for ${defenderSpellToCast.power * 2}
                HEALTH ${defender.health - (defenderSpellToCast.power * 2)} -> ${defender.health}`);
                if (defender.health >= 100 + (defender.level * 5)) {
                  defender.health = 100 + (defender.level * 5);
                }
              }
              break;
            case 'target':
              if (defenderSpellToCast.name.toLowerCase().includes('fireball')) {
                let spellDamage = Math.round((defenderSpellToCast.power * 2) - battleStats.attacker.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                attackerDamage += spellDamage;
                attacker.health -= spellDamage;
                helper.printBattleDebug(`${attacker.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${attacker.health + spellDamage} -> ${attacker.health}`);
              }
              break;
          }
        }
      } else if (initiative.name === defender.name) {
        helper.printBattleDebug('\nSpell Initiative is Defender');
        if (defender.spells.length > 0) {
          const defenderRandomSpell = helper.randomBetween(0, defender.spells.length - 1);
          const defenderSpellToCast = defender.spells[defenderRandomSpell];
          switch (defenderSpellToCast.type) {
            case 'self':
              if (defenderSpellToCast.name.toLowerCase().includes('heal')) {
                defender.health += defenderSpellToCast.power * 2;
                helper.printBattleDebug(`${defender.name} healed for ${defenderSpellToCast.power * 2}
                HEALTH ${defender.health - (defenderSpellToCast.power * 2)} -> ${defender.health}`);
                if (defender.health >= 100 + (defender.level * 5)) {
                  defender.health = 100 + (defender.level * 5);
                }
              }
              break;
            case 'target':
              if (defenderSpellToCast.name.toLowerCase().includes('fireball')) {
                let spellDamage = Math.round((defenderSpellToCast.power * 2) - battleStats.attacker.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                defenderDamage += spellDamage;
                attacker.health -= spellDamage;
                helper.printBattleDebug(`${attacker.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${attacker.health + spellDamage} -> ${attacker.health}`);
              }
              break;
          }
        }
        if (attacker.spells.length > 0) {
          const attackerRandomSpell = helper.randomBetween(0, attacker.spells.length - 1);
          const attackerSpellToCast = attacker.spells[attackerRandomSpell];
          switch (attackerSpellToCast.type) {
            case 'self':
              if (attackerSpellToCast.name.toLowerCase().includes('heal')) {
                attacker.health += attackerSpellToCast.power * 2;
                helper.printBattleDebug(`${attacker.name} healed for ${attackerSpellToCast.power * 2}
                HEALTH ${attacker.health - (attackerSpellToCast.power * 2)} -> ${attacker.health}`);
                if (attacker.health >= 100 + (attacker.level * 5)) {
                  attacker.health = 100 + (attacker.level * 5);
                }
              }
              break;
            case 'target':
              if (attackerSpellToCast.name.toLowerCase().includes('fireball')) {
                let spellDamage = Math.round((attackerSpellToCast.power * 2) - battleStats.defender.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                attackerDamage += spellDamage;
                defender.health -= spellDamage;
                helper.printBattleDebug(`${defender.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${defender.health + spellDamage} -> ${defender.health}`);
              }
              break;
          }
        }
      }

      return resolve(this.inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage));
    });
  }

  inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage) {
    return new Promise((resolve) => {
      const initiative = this.initialAttack(attacker, defender);
      if (initiative.name === attacker.name) {
        helper.printBattleDebug('\nInventory Initiative is Attacker');
        if (attacker.inventory.items.length > 0 && attacker.inventory.items.includes({ name: 'Health Potion' })) {
          const potion = attacker.inventory.items.find({ name: 'Health Potion' });
          let healAmount = potion.power * (attacker.level / 2);
          if ((healAmount + attacker.health) > 100 + (attacker.level * 5)) {
            healAmount -= 100 + (attacker.level * 5);
          }
          attacker.health += healAmount;
          attacker.inventory.items = attacker.inventory.items.splice(attacker.inventory.items.indexOf(potion), 1);

          helper.printBattleDebug(`${attacker.name} drank a health potion and healed ${healAmount} health`);
        }
        if (defender.inventory.items.length > 0 && defender.inventory.items.includes({ name: 'Health Potion' })) {
          const potion = defender.inventory.items.find({ name: 'Health Potion' });
          let healAmount = potion.power * (defender.level / 2);
          if ((healAmount + defender.health) > 100 + (defender.level * 5)) {
            healAmount -= 100 + (defender.level * 5);
          }
          defender.health += healAmount;
          defender.inventory.items.splice(defender.inventory.items.indexOf(potion), 1);

          helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
        }
      } else if (initiative.name === defender.name) {
        helper.printBattleDebug('\nInventory Initiative is defender');
        if (defender.inventory.items.length > 0 && defender.inventory.items.includes({ name: 'Health Potion' })) {
          const potion = defender.inventory.items.find({ name: 'Health Potion' });
          let healAmount = potion.power * (defender.level / 2);
          if ((healAmount + defender.health) > 100 + (defender.level * 5)) {
            healAmount -= 100 + (defender.level * 5);
          }
          defender.health += healAmount;
          defender.inventory.items.splice(defender.inventory.items.indexOf(potion), 1);

          helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
        }
        if (attacker.inventory.items.length > 0 && attacker.inventory.items.includes({ name: 'Health Potion' })) {
          const potion = attacker.inventory.items.find({ name: 'Health Potion' });
          let healAmount = potion.power * (attacker.level / 2);
          if ((healAmount + attacker.health) > 100 + (attacker.level * 5)) {
            healAmount -= 100 + (attacker.level * 5);
          }
          attacker.health += healAmount;
          attacker.inventory.items = attacker.inventory.items.splice(attacker.inventory.items.indexOf(potion), 1);

          helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
        }
      }

      return resolve({ attacker, defender, attackerDamage, defenderDamage });
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
    helper.printBattleDebug(`${player.name} - ${player.equipment.weapon.name} - ${player.equipment.weapon.attackType} - ${player.equipment.weapon.power}`);
    switch (player.equipment.weapon.attackType) {
      case 'melee':
        attackPower = this.isMonster(player)
          ? (player.stats.str + player.equipment.weapon.power + (player.power / 2)) * (player.stats.dex + (player.stats.luk + (helper.randomBetween(1, player.stats.str) / 2)))
          : (helper.sumPlayerTotalStrength(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player)
              + helper.randomBetween(1, helper.sumPlayerTotalStrength(player))) / 2));
        break;
      case 'range':
        attackPower = this.isMonster(player)
          ? (player.stats.dex + player.equipment.weapon.power + (player.power / 2)) * (player.stats.dex + (player.stats.luk + (helper.randomBetween(1, player.stats.dex) / 2)))
          : (helper.sumPlayerTotalDexterity(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player)
              + helper.randomBetween(1, helper.sumPlayerTotalDexterity(player))) / 2));
        break;
      case 'magic':
        attackPower = this.isMonster(player)
          ? (player.stats.int + player.equipment.weapon.power + (player.power / 2)) * (player.stats.dex + (player.stats.luk + (helper.randomBetween(1, player.stats.int) / 2)))
          : (helper.sumPlayerTotalIntelligence(player) + player.equipment.weapon.power)
          * (helper.sumPlayerTotalDexterity(player)
            + ((helper.sumPlayerTotalLuck(player)
              + helper.randomBetween(1, helper.sumPlayerTotalIntelligence(player))) / 2));
        break;
    }

    return helper.randomBetween(attackPower / 2, attackPower);
  }

  calculateDefense(player) {
    const physicalDefensePower = this.isMonster(player)
      ? (player.stats.end + (player.equipment.armor.power / 2) + (player.power / 4)) * (player.stats.dex + (player.stats.luk / 2))
      : (helper.sumPlayerTotalEndurance(player)
        + (player.equipment.armor.power / 2))
      * (helper.sumPlayerTotalDexterity(player) + (helper.sumPlayerTotalLuck(player) / 2));
    const magicDefensePower = this.isMonster(player)
      ? (player.stats.int + (player.equipment.armor.power / 2) + (player.power / 4)) * (player.stats.dex + (player.stats.luk / 2))
      : (helper.sumPlayerTotalIntelligence(player)
        + (player.equipment.armor.power / 2))
      * (helper.sumPlayerTotalDexterity(player) + (helper.sumPlayerTotalLuck(player) / 2));
    helper.printBattleDebug(`${player.name} - ${physicalDefensePower} - ${magicDefensePower}`);

    return { physicalDefensePower, magicDefensePower };
  }

  isMonster(obj) {
    return obj.power !== undefined;
  }

}
module.exports = new Battle();
