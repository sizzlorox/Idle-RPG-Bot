const enumHelper = require('../../utils/enumHelper');
const { randomBetween } = require('../utils/helpers');
const { sumPlayerTotalStrength, sumPlayerTotalDexterity, sumPlayerTotalEndurance, sumPlayerTotalIntelligence, sumPlayerTotalLuck, printBattleDebug } = require('../utils/battleHelpers');

class BattleSimulator {

  simulateBattle(attacker, defender) {
    const maxRounds = 5;
    let attackerDamage = 0;
    let defenderDamage = 0;

    if (defender instanceof Array) {
      defender.forEach((mob) => {
        for (let round = 1; round <= maxRounds; round++) {
          const result = this.round(attacker, mob);
          attackerDamage += result.attackerDamage || 0;
          defenderDamage += result.defenderDamage || 0;
          if (attacker.health <= 0 || mob.health <= 0) break;
        }
      });
    } else {
      for (let round = 1; round <= maxRounds; round++) {
        const result = this.round(attacker, defender);
        attackerDamage += result.attackerDamage || 0;
        defenderDamage += result.defenderDamage || 0;
        if (attacker.health <= 0 || defender.health <= 0) break;
      }
    }

    if (attacker.health < 0) attacker.health = 0;
    if (defender instanceof Object && defender.health < 0) defender.health = 0;
    return { attacker, defender, attackerDamage, defenderDamage };
  }

  initialAttack(attacker, defender) {
    return randomBetween(1, 100) > 50 ? attacker : defender;
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
    let attackerDamage;
    let defenderDamage;

    if (initiative.name === attacker.name) {
      printBattleDebug('\nBattle Initiative is Attacker');
      if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
        attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.physicalDefensePower / 100));
      } else {
        attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.magicDefensePower / 100));
      }
      if (attackerDamage < 0) attackerDamage = 0;
      defender.health -= attackerDamage;
      if (this.isMonster(defender)) defender.dmgReceived += attackerDamage;
      printBattleDebug(`Attacker Damage: ${attackerDamage}`);
      if (defender.health <= 0) return { attacker, defender, attackerDamage, defenderDamage };

      if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
        defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.physicalDefensePower / 100));
      } else {
        defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.magicDefensePower / 100));
      }
      if (defenderDamage < 0) defenderDamage = 0;
      if (this.isMonster(defender)) defender.dmgDealt += defenderDamage;
      attacker.health -= defenderDamage;
      printBattleDebug(`Defender Damage: ${defenderDamage}`);
    } else if (initiative.name === defender.name) {
      printBattleDebug('\nBattle Initiative is Defender');
      if (defender.equipment.weapon.attackType === 'melee' || defender.equipment.weapon.attackType === 'range') {
        defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.physicalDefensePower / 100));
      } else {
        defenderDamage = Math.round(battleStats.defender.attackPower - (battleStats.attacker.defensePower.magicDefensePower / 100));
      }
      if (defenderDamage < 0) defenderDamage = 0;
      if (this.isMonster(defender)) defender.dmgDealt += defenderDamage;
      attacker.health -= defenderDamage;
      printBattleDebug(`Defender Damage: ${defenderDamage}`);
      if (attacker.health <= 0) return { attacker, defender, attackerDamage, defenderDamage };

      if (attacker.equipment.weapon.attackType === 'melee' || attacker.equipment.weapon.attackType === 'range') {
        attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.physicalDefensePower / 100));
      } else {
        attackerDamage = Math.round(battleStats.attacker.attackPower - (battleStats.defender.defensePower.magicDefensePower / 100));
      }
      if (attackerDamage < 0) attackerDamage = 0;
      defender.health -= attackerDamage;
      if (this.isMonster(defender)) defender.dmgReceived += attackerDamage;
      printBattleDebug(`Attacker Damage: ${attackerDamage}`);
    }

    return this.spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage);
  }

  spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage) {
    const initiative = this.initialAttack(attacker, defender);
    const applySpell = (caster, target, isAttacker) => {
      if (caster.spells.length > 0) {
        const spellIdx = randomBetween(0, caster.spells.length - 1);
        const spell = caster.spells[spellIdx];
        if (spell.type === 'self' && spell.name.toLowerCase().includes('heal') && caster.mana >= spell.power) {
          caster.health += spell.power * 2;
          caster.mana -= spell.power;
          if (caster.health >= enumHelper.maxHealth(caster.level)) caster.health = enumHelper.maxHealth(caster.level);
          if (isAttacker) {
            if (defenderDamage > spell.power * 2) { defenderDamage -= spell.power * 2; if (this.isMonster(defender)) defender.dmgDealt -= spell.power * 2; }
          } else {
            if (attackerDamage > spell.power * 2) { attackerDamage -= spell.power * 2; if (this.isMonster(defender)) defender.dmgReceived -= spell.power * 2; }
          }
        } else if (spell.type === 'target' && spell.name.toLowerCase().includes('fireball') && caster.mana >= spell.power) {
          let spellDamage = Math.round((spell.power * 2) - (isAttacker ? battleStats.defender.defensePower.magicDefensePower : battleStats.attacker.defensePower.magicDefensePower));
          if (spellDamage < 0) spellDamage = 0;
          caster.mana -= spell.power;
          if (isAttacker) {
            attackerDamage += spellDamage;
            defender.health -= spellDamage;
            if (this.isMonster(defender)) defender.dmgReceived += spellDamage;
          } else {
            defenderDamage += spellDamage;
            if (this.isMonster(defender)) defender.dmgDealt += spellDamage;
            attacker.health -= spellDamage;
          }
        }
      }
    };
    if (initiative.name === attacker.name) {
      applySpell(attacker, defender, true);
      applySpell(defender, attacker, false);
    } else {
      applySpell(defender, attacker, false);
      applySpell(attacker, defender, true);
    }
    return this.inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage);
  }

  inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage) {
    const applyPotion = (player, isAttacker) => {
      const potions = player.inventory.items.filter(item => item.name.includes('Health Potion'));
      if (player.inventory.items.length > 0 && potions.length > 0) {
        const potion = potions[randomBetween(0, potions.length - 1)];
        const healAmount = Math.ceil(potion.power * (player.level / 2));
        player.health += healAmount;
        if (player.health > enumHelper.maxHealth(player.level)) player.health = enumHelper.maxHealth(player.level);
        player.inventory.items = player.inventory.items.splice(player.inventory.items.indexOf(potion), 1);
        if (isAttacker) {
          if (defenderDamage > healAmount) { defenderDamage -= healAmount; if (this.isMonster(defender)) defender.dmgDealt -= healAmount; }
        } else {
          if (attackerDamage > healAmount) { attackerDamage -= healAmount; if (this.isMonster(defender)) defender.dmgReceived -= healAmount; }
        }
      }
    };
    const initiative = this.initialAttack(attacker, defender);
    if (initiative.name === attacker.name) {
      applyPotion(attacker, true);
      applyPotion(defender, false);
    } else {
      applyPotion(defender, false);
      applyPotion(attacker, true);
    }
    return { attacker, defender, attackerDamage, defenderDamage };
  }

  getBattleStats(player) {
    return {
      attackPower: this.calculateAttack(player),
      defensePower: this.calculateDefense(player)
    };
  }

  calculateAttack(player) {
    let attackPower;
    switch (player.equipment.weapon.attackType) {
      case 'melee':
        attackPower = this.isMonster(player)
          ? (player.stats.str + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.str) / 2)))
          : (sumPlayerTotalStrength(player) + player.equipment.weapon.power + (((sumPlayerTotalLuck(player) * 1.5) + randomBetween(1, sumPlayerTotalStrength(player))) / 2));
        break;
      case 'range':
        attackPower = this.isMonster(player)
          ? (player.stats.dex + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.dex) / 2)))
          : (sumPlayerTotalDexterity(player) + player.equipment.weapon.power + (((sumPlayerTotalLuck(player) * 1.5) + randomBetween(1, sumPlayerTotalDexterity(player))) / 2));
        break;
      case 'magic':
        attackPower = this.isMonster(player)
          ? (player.stats.int + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.int) / 2)))
          : (sumPlayerTotalIntelligence(player) + player.equipment.weapon.power + (((sumPlayerTotalLuck(player) * 1.5) + randomBetween(1, sumPlayerTotalIntelligence(player))) / 2));
        break;
    }
    return randomBetween(Math.round(attackPower / 2), attackPower);
  }

  calculateDefense(player) {
    const physicalDefensePower = this.isMonster(player)
      ? (player.stats.end + player.equipment.armor.power + player.power) + ((player.stats.dex / 2) + (player.stats.luk / 2))
      : (sumPlayerTotalEndurance(player) + ((player.equipment.armor.power + player.equipment.helmet.power) / 2)) + (sumPlayerTotalDexterity(player) + ((sumPlayerTotalLuck(player) * 1.5) / 2));
    const magicDefensePower = this.isMonster(player)
      ? (player.stats.int + player.equipment.armor.power + player.power) + ((player.stats.dex / 2) + (player.stats.luk / 2))
      : (sumPlayerTotalIntelligence(player) + ((player.equipment.armor.power + player.equipment.helmet.power) / 2)) + (sumPlayerTotalDexterity(player) + ((sumPlayerTotalLuck(player) * 1.5) / 2));
    return { physicalDefensePower, magicDefensePower };
  }

  isMonster(obj) {
    return obj.power !== undefined;
  }

}

module.exports = BattleSimulator;
