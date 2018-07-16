const enumHelper = require('../../utils/enumHelper');

class Battle {

  constructor(Helper) {
    this.Helper = Helper;
  }

  simulateBattle(attacker, defender) {
    return new Promise((resolve) => {
      const maxRounds = 5;
      const battleResults = [];
      if (defender instanceof Array) {
        defender.forEach((mob) => {
          for (let round = 1; round <= maxRounds; round++) {
            battleResults.push(
              this.round(attacker, mob)
            );
            if (attacker.health <= 0 || mob.health <= 0) {
              break;
            }
          }
        });
      } else {
        for (let round = 1; round <= maxRounds; round++) {
          battleResults.push(
            this.round(attacker, defender)
          );
          if (attacker.health <= 0 || defender.health <= 0) {
            break;
          }
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
          if (defender instanceof Object) {
            if (defender.health < 0) {
              defender.health = 0;
            }
          }

          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        });
    });
  }

  initialAttack(attacker, defender) {
    const attackerInitialAttackChance = this.isMonster(attacker)
      ? attacker.stats.dex + (attacker.stats.luk / 2)
      : this.Helper.sumPlayerTotalDexterity(attacker) + (this.Helper.sumPlayerTotalLuck(attacker) / 2);
    const defenderInitialAttackChance = this.isMonster(defender)
      ? defender.stats.dex + (defender.stats.luk / 2)
      : this.Helper.sumPlayerTotalDexterity(defender) + (this.Helper.sumPlayerTotalLuck(defender) / 2);
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
        this.Helper.printBattleDebug('\nBattle Initiative is Attacker');
        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.physicalDefensePower / 100));
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          if (this.isMonster(defender)) {
            defender.dmgReceived += attackerDamage;
          }
          this.Helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        } else {
          attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.magicDefensePower / 100));
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          if (this.isMonster(defender)) {
            defender.dmgReceived += attackerDamage;
          }
          this.Helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        }

        this.Helper.printBattleDebug(`Attacker Damage: ${attackerDamage}`);
        if (defender.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.physicalDefensePower / 100));
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }
          if (this.isMonster(defender)) {
            defender.dmgDealt += defenderDamage;
          }

          attacker.health -= defenderDamage;
          this.Helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        } else {
          defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.magicDefensePower / 100));
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }
          if (this.isMonster(defender)) {
            defender.dmgDealt += defenderDamage;
          }

          attacker.health -= defenderDamage;
          this.Helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        }

        this.Helper.printBattleDebug(`Defender Damage: ${defenderDamage}`);
      } else if (initiative.name === defender.name) {
        this.Helper.printBattleDebug('\nBattle Initiative is Defender');
        if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
          defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.physicalDefensePower / 100));
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }
          if (this.isMonster(defender)) {
            defender.dmgDealt += defenderDamage;
          }

          attacker.health -= defenderDamage;
          this.Helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        } else {
          defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.magicDefensePower / 100));
          if (defenderDamage < 0) {
            defenderDamage = 0;
          }
          if (this.isMonster(defender)) {
            defender.dmgDealt += defenderDamage;
          }

          attacker.health -= defenderDamage;
          this.Helper.printBattleDebug(`HEALTH ${attacker.health + defenderDamage} -> ${attacker.health}`);
        }

        this.Helper.printBattleDebug(`Defender Damage: ${defenderDamage}`);
        if (attacker.health <= 0) {
          return resolve({ attacker, defender, attackerDamage, defenderDamage });
        }

        if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
          attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.physicalDefensePower / 100));
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          if (this.isMonster(defender)) {
            defender.dmgReceived += attackerDamage;
          }
          this.Helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        } else {
          attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.magicDefensePower / 100));
          if (attackerDamage < 0) {
            attackerDamage = 0;
          }

          defender.health -= attackerDamage;
          if (this.isMonster(defender)) {
            defender.dmgReceived += attackerDamage;
          }
          this.Helper.printBattleDebug(`HEALTH ${defender.health + attackerDamage} -> ${defender.health}`);
        }

        this.Helper.printBattleDebug(`Attacker Damage: ${attackerDamage}`);
      }

      return resolve(this.spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage));
    });
  }

  spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage) {
    return new Promise((resolve) => {
      const initiative = this.initialAttack(attacker, defender);
      if (initiative.name === attacker.name) {
        this.Helper.printBattleDebug('\nSpell Initiative is Attacker');
        if (attacker.spells.length > 0) {
          const attackerRandomSpell = this.Helper.randomBetween(0, attacker.spells.length - 1);
          const attackerSpellToCast = attacker.spells[attackerRandomSpell];
          switch (attackerSpellToCast.type) {
            case 'self':
              if (attackerSpellToCast.name.toLowerCase().includes('heal') && attacker.mana >= attackerSpellToCast.power) {
                attacker.health += attackerSpellToCast.power * 2;
                attacker.mana -= attackerSpellToCast.power;
                this.Helper.printBattleDebug(`${attacker.name} healed for ${attackerSpellToCast.power * 2}
                HEALTH ${attacker.health - (attackerSpellToCast.power * 2)} -> ${attacker.health}`);
                if (attacker.health >= enumHelper.maxHealth(attacker.level)) {
                  attacker.health = enumHelper.maxHealth(attacker.level);
                }
                if (defenderDamage > (attackerSpellToCast.power * 2)) {
                  defenderDamage -= (attackerSpellToCast.power * 2);

                  if (this.isMonster(defender)) {
                    defender.dmgDealt -= (attackerSpellToCast.power * 2);
                  }
                }
              }
              break;
            case 'target':
              if (attackerSpellToCast.name.toLowerCase().includes('fireball') && attacker.mana >= attackerSpellToCast.power) {
                let spellDamage = Math.round((attackerSpellToCast.power * 2) - battleStats.defender.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                attackerDamage += spellDamage;
                defender.health -= spellDamage;
                if (this.isMonster(defender)) {
                  defender.dmgReceived += spellDamage;
                }
                attacker.mana -= attackerSpellToCast.power;
                this.Helper.printBattleDebug(`${defender.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${defender.health + spellDamage} -> ${defender.health}`);
              }
              break;
          }
        }
        if (defender.spells.length > 0) {
          const defenderRandomSpell = this.Helper.randomBetween(0, defender.spells.length - 1);
          const defenderSpellToCast = defender.spells[defenderRandomSpell];
          switch (defenderSpellToCast.type) {
            case 'self':
              if (defenderSpellToCast.name.toLowerCase().includes('heal') && defender.mana >= defenderSpellToCast.power) {
                defender.health += defenderSpellToCast.power * 2;
                defender.mana -= defenderSpellToCast.power;
                this.Helper.printBattleDebug(`${defender.name} healed for ${defenderSpellToCast.power * 2}
                HEALTH ${defender.health - (defenderSpellToCast.power * 2)} -> ${defender.health}`);
                if (defender.health >= enumHelper.maxHealth(defender.level)) {
                  defender.health = enumHelper.maxHealth(defender.level);
                }
                if (attackerDamage > (defenderSpellToCast.power * 2)) {
                  attackerDamage -= (defenderSpellToCast.power * 2);
                  if (this.isMonster(defender)) {
                    defender.dmgReceived -= (defenderSpellToCast.power * 2);
                  }
                }
              }
              break;
            case 'target':
              if (defenderSpellToCast.name.toLowerCase().includes('fireball') && defender.mana >= defenderSpellToCast.power) {
                let spellDamage = Math.round((defenderSpellToCast.power * 2) - battleStats.attacker.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                defenderDamage += spellDamage;
                if (this.isMonster(defender)) {
                  defender.dmgDealt += spellDamage;
                }
                attacker.health -= spellDamage;
                defender.mana -= defenderSpellToCast.power;
                this.Helper.printBattleDebug(`${attacker.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${attacker.health + spellDamage} -> ${attacker.health}`);
              }
              break;
          }
        }
      } else if (initiative.name === defender.name) {
        this.Helper.printBattleDebug('\nSpell Initiative is Defender');
        if (defender.spells.length > 0) {
          const defenderRandomSpell = this.Helper.randomBetween(0, defender.spells.length - 1);
          const defenderSpellToCast = defender.spells[defenderRandomSpell];
          switch (defenderSpellToCast.type) {
            case 'self':
              if (defenderSpellToCast.name.toLowerCase().includes('heal') && defender.mana >= defenderSpellToCast.power) {
                defender.health += defenderSpellToCast.power * 2;
                defender.mana -= defenderSpellToCast.power;
                this.Helper.printBattleDebug(`${defender.name} healed for ${defenderSpellToCast.power * 2}
                HEALTH ${defender.health - (defenderSpellToCast.power * 2)} -> ${defender.health}`);
                if (defender.health >= enumHelper.maxHealth(defender.level)) {
                  defender.health = enumHelper.maxHealth(defender.level);
                }
                if (attackerDamage > (defenderSpellToCast.power * 2)) {
                  attackerDamage -= (defenderSpellToCast.power * 2);
                  if (this.isMonster(defender)) {
                    defender.dmgReceived -= (defenderSpellToCast.power * 2);
                  }
                }
              }
              break;
            case 'target':
              if (defenderSpellToCast.name.toLowerCase().includes('fireball') && defender.mana >= defenderSpellToCast.power) {
                let spellDamage = Math.round((defenderSpellToCast.power * 2) - battleStats.attacker.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                defenderDamage += spellDamage;
                if (this.isMonster(defender)) {
                  defender.dmgDealt += spellDamage;
                }
                attacker.health -= spellDamage;
                defender.mana -= defenderSpellToCast.power;
                this.Helper.printBattleDebug(`${attacker.name} took a fireball to the face for ${spellDamage} damage
                HEALTH ${attacker.health + spellDamage} -> ${attacker.health}`);
              }
              break;
          }
        }
        if (attacker.spells.length > 0) {
          const attackerRandomSpell = this.Helper.randomBetween(0, attacker.spells.length - 1);
          const attackerSpellToCast = attacker.spells[attackerRandomSpell];
          switch (attackerSpellToCast.type) {
            case 'self':
              if (attackerSpellToCast.name.toLowerCase().includes('heal') && attacker.mana >= attackerSpellToCast.power) {
                attacker.health += attackerSpellToCast.power * 2;
                attacker.mana -= attackerSpellToCast.power;
                this.Helper.printBattleDebug(`${attacker.name} healed for ${attackerSpellToCast.power * 2}
                HEALTH ${attacker.health - (attackerSpellToCast.power * 2)} -> ${attacker.health}`);
                if (attacker.health >= enumHelper.maxHealth(attacker.level)) {
                  attacker.health = enumHelper.maxHealth(attacker.level);
                }
                if (defenderDamage > (attackerSpellToCast.power * 2)) {
                  defenderDamage -= (attackerSpellToCast.power * 2);
                }
              }
              break;
            case 'target':
              if (attackerSpellToCast.name.toLowerCase().includes('fireball') && attacker.mana >= attackerSpellToCast.power) {
                let spellDamage = Math.round((attackerSpellToCast.power * 2) - battleStats.defender.defensePower.magicDefensePower);
                if (spellDamage < 0) {
                  spellDamage = 0;
                }
                attackerDamage += spellDamage;
                defender.health -= spellDamage;
                if (this.isMonster(defender)) {
                  defender.dmgReceived += spellDamage;
                }
                attacker.mana -= attackerSpellToCast.power;
                this.Helper.printBattleDebug(`${defender.name} took a fireball to the face for ${spellDamage} damage
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
        this.Helper.printBattleDebug('\nInventory Initiative is Attacker');
        const attackerPotions = attacker.inventory.items.filter(item => item.name.includes('Health Potion'));
        if (attacker.inventory.items.length > 0 && attackerPotions.length > 0) {
          const potion = attackerPotions[this.Helper.randomBetween(0, attackerPotions.length - 1)];
          const healAmount = Math.ceil(potion.power * (attacker.level / 2));
          attacker.health += healAmount;
          if (attacker.health > enumHelper.maxHealth(attacker.level)) {
            attacker.health = enumHelper.maxHealth(attacker.level);
          }
          attacker.inventory.items = attacker.inventory.items.splice(attacker.inventory.items.indexOf(potion), 1);
          if (defenderDamage > healAmount) {
            defenderDamage -= healAmount;
            if (this.isMonster(defender)) {
              defender.dmgDealt -= healAmount;
            }
          }

          this.Helper.printBattleDebug(`${attacker.name} drank a health potion and healed ${healAmount} health`);
        }
        const defenderPotions = defender.inventory.items.filter(item => item.name.includes('Health Potion'));
        if (defender.inventory.items.length > 0 && defenderPotions.length > 0) {
          const potion = defenderPotions[this.Helper.randomBetween(0, defenderPotions.length - 1)];
          const healAmount = Math.ceil(potion.power * (defender.level / 2));
          defender.health += healAmount;
          if (defender.health > enumHelper.maxHealth(defender.level)) {
            defender.health = enumHelper.maxHealth(defender.level);
          }
          defender.inventory.items = defender.inventory.items.splice(defender.inventory.items.indexOf(potion), 1);
          if (attackerDamage > healAmount) {
            attackerDamage -= healAmount;
            if (this.isMonster(defender)) {
              defender.dmgReceived -= healAmount;
            }
          }

          this.Helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
        }
      } else if (initiative.name === defender.name) {
        this.Helper.printBattleDebug('\nInventory Initiative is defender');
        const defenderPotions = defender.inventory.items.filter(item => item.name.includes('Health Potion'));
        if (defender.inventory.items.length > 0 && defenderPotions.length > 0) {
          const potion = defenderPotions[this.Helper.randomBetween(0, defenderPotions.length - 1)];
          const healAmount = Math.ceil(potion.power * (defender.level / 2));
          defender.health += healAmount;
          if (defender.health > enumHelper.maxHealth(defender.level)) {
            defender.health = enumHelper.maxHealth(defender.level);
          }
          defender.inventory.items = defender.inventory.items.splice(defender.inventory.items.indexOf(potion), 1);
          if (attackerDamage > healAmount) {
            attackerDamage -= healAmount;
            if (this.isMonster(defender)) {
              defender.dmgReceived -= healAmount;
            }
          }

          this.Helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
        }
        const attackerPotions = attacker.inventory.items.filter(item => item.name.includes('Health Potion'));
        if (attacker.inventory.items.length > 0 && attackerPotions.length > 0) {
          const potion = attackerPotions[this.Helper.randomBetween(0, attackerPotions.length - 1)];
          const healAmount = Math.ceil(potion.power * (attacker.level / 2));
          attacker.health += healAmount;
          if (attacker.health > enumHelper.maxHealth(attacker.level)) {
            attacker.health = enumHelper.maxHealth(attacker.level);
          }
          attacker.inventory.items = attacker.inventory.items.splice(attacker.inventory.items.indexOf(potion), 1);
          if (defenderDamage > healAmount) {
            defenderDamage -= healAmount;
            if (this.isMonster(defender)) {
              defender.dmgDealt -= healAmount;
            }
          }

          this.Helper.printBattleDebug(`${defender.name} drank a health potion and healed ${healAmount} health`);
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
    this.Helper.printBattleDebug(`${player.name} - ${player.equipment.weapon.name} - ${player.equipment.weapon.attackType} - ${player.equipment.weapon.power}`);
    switch (player.equipment.weapon.attackType) {
      case 'melee':
        attackPower = this.isMonster(player)
          ? (player.stats.str + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (this.Helper.randomBetween(1, player.stats.str) / 2)))
          : (this.Helper.sumPlayerTotalStrength(player) + player.equipment.weapon.power)
          + (this.Helper.sumPlayerTotalDexterity(player)
            + ((this.Helper.sumPlayerTotalLuck(player)
              + this.Helper.randomBetween(1, this.Helper.sumPlayerTotalStrength(player))) / 2));
        break;
      case 'range':
        attackPower = this.isMonster(player)
          ? (player.stats.dex + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (this.Helper.randomBetween(1, player.stats.dex) / 2)))
          : (this.Helper.sumPlayerTotalDexterity(player) + player.equipment.weapon.power)
          + (this.Helper.sumPlayerTotalDexterity(player)
            + ((this.Helper.sumPlayerTotalLuck(player)
              + this.Helper.randomBetween(1, this.Helper.sumPlayerTotalDexterity(player))) / 2));
        break;
      case 'magic':
        attackPower = this.isMonster(player)
          ? (player.stats.int + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (this.Helper.randomBetween(1, player.stats.int) / 2)))
          : (this.Helper.sumPlayerTotalIntelligence(player) + player.equipment.weapon.power)
          + (this.Helper.sumPlayerTotalDexterity(player)
            + ((this.Helper.sumPlayerTotalLuck(player)
              + this.Helper.randomBetween(1, this.Helper.sumPlayerTotalIntelligence(player))) / 2));
        break;
    }

    return this.Helper.randomBetween(Math.round(attackPower / 2), attackPower);
  }

  calculateDefense(player) {
    const physicalDefensePower = this.isMonster(player)
      ? (player.stats.end + player.equipment.armor.power + player.power) + ((player.stats.dex / 2) + (player.stats.luk / 2))
      : (this.Helper.sumPlayerTotalEndurance(player)
        + (player.equipment.armor.power / 2))
      + (this.Helper.sumPlayerTotalDexterity(player) + (this.Helper.sumPlayerTotalLuck(player) / 2));
    const magicDefensePower = this.isMonster(player)
      ? (player.stats.int + player.equipment.armor.power + player.power) + ((player.stats.dex / 2) + (player.stats.luk / 2))
      : (this.Helper.sumPlayerTotalIntelligence(player)
        + (player.equipment.armor.power / 2))
      + (this.Helper.sumPlayerTotalDexterity(player) + (this.Helper.sumPlayerTotalLuck(player) / 2));
    this.Helper.printBattleDebug(`${player.name} - ${physicalDefensePower} - ${magicDefensePower}`);

    return { physicalDefensePower, magicDefensePower };
  }

  isMonster(obj) {
    return obj.power !== undefined;
  }

}
module.exports = Battle;
