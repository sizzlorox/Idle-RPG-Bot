const enumHelper = require('../../utils/enumHelper');
const { randomBetween } = require('../utils/helpers');
const { sumPlayerTotalStrength, sumPlayerTotalDexterity, sumPlayerTotalEndurance, sumPlayerTotalIntelligence, sumPlayerTotalLuck, printBattleDebug } = require('../utils/battleHelpers');

class BattleSimulator {

  simulateBattle(attacker, defender) {
    const maxRounds = 5;
    let attackerDamage = 0;
    let defenderDamage = 0;
    const battleEvents = { crits: 0, dodges: 0 };

    if (defender instanceof Array) {
      defender.forEach((mob) => {
        for (let round = 1; round <= maxRounds; round++) {
          const result = this.round(attacker, mob);
          attackerDamage += result.attackerDamage || 0;
          defenderDamage += result.defenderDamage || 0;
          battleEvents.crits += result.crits || 0;
          battleEvents.dodges += result.dodges || 0;
          if (attacker.health <= 0 || mob.health <= 0) break;
        }
      });
    } else {
      for (let round = 1; round <= maxRounds; round++) {
        const result = this.round(attacker, defender);
        attackerDamage += result.attackerDamage || 0;
        defenderDamage += result.defenderDamage || 0;
        battleEvents.crits += result.crits || 0;
        battleEvents.dodges += result.dodges || 0;
        if (attacker.health <= 0 || defender.health <= 0) break;
      }
    }

    if (attacker.health < 0) attacker.health = 0;
    if (defender instanceof Object && defender.health < 0) defender.health = 0;
    return { attacker, defender, attackerDamage, defenderDamage, battleEvents };
  }

  // DEX-weighted initiative: higher DEX + jitter wins more often
  initialAttack(attacker, defender, battleStats) {
    const aDex = battleStats.attacker.cachedStats ? battleStats.attacker.cachedStats.dex : attacker.stats.dex;
    const dDex = battleStats.defender.cachedStats ? battleStats.defender.cachedStats.dex : defender.stats.dex;
    const aSpeed = aDex + randomBetween(1, 15);
    const dSpeed = dDex + randomBetween(1, 15);
    return aSpeed >= dSpeed ? attacker : defender;
  }

  round(attacker, defender) {
    const battleStats = {
      attacker: this.getBattleStats(attacker),
      defender: this.getBattleStats(defender)
    };
    // Initiative rolled once per round and passed through all phases
    const initiative = this.initialAttack(attacker, defender, battleStats);
    return this.battleTurn(attacker, defender, battleStats, initiative);
  }

  battleTurn(attacker, defender, battleStats, initiative) {
    const attackerWeaponType = attacker.equipment.weapon.attackType;
    const defenderWeaponType = defender.equipment.weapon.attackType;
    const attackerAP = battleStats.attacker.attackPower;
    const defenderAP = battleStats.defender.attackPower;
    const attackerPhysDef = battleStats.attacker.defensePower.physicalDefensePower;
    const attackerMagDef = battleStats.attacker.defensePower.magicDefensePower;
    const defenderPhysDef = battleStats.defender.defensePower.physicalDefensePower;
    const defenderMagDef = battleStats.defender.defensePower.magicDefensePower;

    // Pre-compute crit rolls (LUK-based)
    const attackerLuk = battleStats.attacker.cachedStats ? battleStats.attacker.cachedStats.luk : attacker.stats.luk;
    const defenderLuk = battleStats.defender.cachedStats ? battleStats.defender.cachedStats.luk : defender.stats.luk;
    const attackerCrit = randomBetween(1, 100) <= this.getCritChance(attackerLuk);
    const defenderCrit = randomBetween(1, 100) <= this.getCritChance(defenderLuk);
    const effectiveAttackerAP = attackerCrit ? Math.round(attackerAP * 1.75) : attackerAP;
    const effectiveDefenderAP = defenderCrit ? Math.round(defenderAP * 1.75) : defenderAP;

    // Pre-compute dodge rolls (DEX-based, physical attacks only)
    const attackerDex = battleStats.attacker.cachedStats ? battleStats.attacker.cachedStats.dex : attacker.stats.dex;
    const defenderDex = battleStats.defender.cachedStats ? battleStats.defender.cachedStats.dex : defender.stats.dex;
    const attackerPhysical = attackerWeaponType === 'melee' || attackerWeaponType === 'range';
    const defenderPhysical = defenderWeaponType === 'melee' || defenderWeaponType === 'range';
    // defenderDodged: defender dodges attacker's physical swing
    const defenderDodged = attackerPhysical && randomBetween(1, 100) <= this.getDodgeChance(attackerDex, defenderDex);
    // attackerDodged: attacker dodges defender's physical swing
    const attackerDodged = defenderPhysical && randomBetween(1, 100) <= this.getDodgeChance(defenderDex, attackerDex);

    let attackerDamage;
    let defenderDamage;
    let roundCrits = 0;
    let roundDodges = 0;

    if (initiative.name === attacker.name) {
      printBattleDebug('\nBattle Initiative is Attacker');

      if (defenderDodged) {
        attackerDamage = 0;
        roundDodges++;
        printBattleDebug('Defender dodged attacker\'s swing!');
      } else {
        const defAP = attackerPhysical ? defenderPhysDef : defenderMagDef;
        attackerDamage = this.calcDamage(effectiveAttackerAP, defAP);
        if (attackerCrit) roundCrits++;
      }
      defender.health -= attackerDamage;
      if (this.isMonster(defender)) defender.dmgReceived += attackerDamage;
      printBattleDebug(`Attacker Damage: ${attackerDamage}`);
      if (defender.health <= 0) return { attacker, defender, attackerDamage, defenderDamage: 0, crits: roundCrits, dodges: roundDodges };

      if (attackerDodged) {
        defenderDamage = 0;
        roundDodges++;
        printBattleDebug('Attacker dodged defender\'s swing!');
      } else {
        const atkAP = defenderPhysical ? attackerPhysDef : attackerMagDef;
        defenderDamage = this.calcDamage(effectiveDefenderAP, atkAP);
        if (defenderCrit) roundCrits++;
      }
      if (this.isMonster(defender)) defender.dmgDealt += defenderDamage;
      attacker.health -= defenderDamage;
      printBattleDebug(`Defender Damage: ${defenderDamage}`);
    } else {
      printBattleDebug('\nBattle Initiative is Defender');

      if (attackerDodged) {
        defenderDamage = 0;
        roundDodges++;
        printBattleDebug('Attacker dodged defender\'s swing!');
      } else {
        const atkAP = defenderPhysical ? attackerPhysDef : attackerMagDef;
        defenderDamage = this.calcDamage(effectiveDefenderAP, atkAP);
        if (defenderCrit) roundCrits++;
      }
      if (this.isMonster(defender)) defender.dmgDealt += defenderDamage;
      attacker.health -= defenderDamage;
      printBattleDebug(`Defender Damage: ${defenderDamage}`);
      if (attacker.health <= 0) return { attacker, defender, attackerDamage: 0, defenderDamage, crits: roundCrits, dodges: roundDodges };

      if (defenderDodged) {
        attackerDamage = 0;
        roundDodges++;
        printBattleDebug('Defender dodged attacker\'s swing!');
      } else {
        const defAP = attackerPhysical ? defenderPhysDef : defenderMagDef;
        attackerDamage = this.calcDamage(effectiveAttackerAP, defAP);
        if (attackerCrit) roundCrits++;
      }
      defender.health -= attackerDamage;
      if (this.isMonster(defender)) defender.dmgReceived += attackerDamage;
      printBattleDebug(`Attacker Damage: ${attackerDamage}`);
    }

    return this.spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage, initiative, roundCrits, roundDodges);
  }

  spellTurn(attacker, defender, battleStats, attackerDamage, defenderDamage, initiative, roundCrits, roundDodges) {
    const applySpell = (caster, target, isAttacker) => {
      if (caster.spells.length === 0) return;
      const spellIdx = randomBetween(0, caster.spells.length - 1);
      const spell = caster.spells[spellIdx];
      if (caster.mana < spell.power) return;
      // Honour the spell's chance field
      if (randomBetween(1, 100) > spell.chance) return;

      const magicDefense = isAttacker
        ? battleStats.defender.defensePower.magicDefensePower
        : battleStats.attacker.defensePower.magicDefensePower;

      if (spell.type === 'self' && spell.name.toLowerCase().includes('heal')) {
        caster.health += spell.power * 2;
        caster.mana -= spell.power;
        if (caster.health >= enumHelper.maxHealth(caster.level)) caster.health = enumHelper.maxHealth(caster.level);
        if (isAttacker) {
          if (defenderDamage > spell.power * 2) { defenderDamage -= spell.power * 2; if (this.isMonster(defender)) defender.dmgDealt -= spell.power * 2; }
        } else {
          if (attackerDamage > spell.power * 2) { attackerDamage -= spell.power * 2; if (this.isMonster(defender)) defender.dmgReceived -= spell.power * 2; }
        }
      } else if (spell.type === 'self' && spell.name.toLowerCase().includes('shield')) {
        caster.mana -= spell.power;
        if (isAttacker) {
          defenderDamage = Math.max(0, defenderDamage - spell.power * 2);
        } else {
          attackerDamage = Math.max(0, attackerDamage - spell.power * 2);
        }
      } else if (spell.type === 'target' && spell.name.toLowerCase().includes('fireball')) {
        let spellDamage = Math.round((spell.power * 2) - magicDefense);
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
      } else if (spell.type === 'target' && spell.name.toLowerCase().includes('lightning bolt')) {
        // Penetrates 50% of magic defense
        const spellDamage = Math.max(1, Math.round((spell.power * 3) - (magicDefense * 0.5)));
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
    };

    if (initiative.name === attacker.name) {
      applySpell(attacker, defender, true);
      applySpell(defender, attacker, false);
    } else {
      applySpell(defender, attacker, false);
      applySpell(attacker, defender, true);
    }
    return this.inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage, initiative, roundCrits, roundDodges);
  }

  inventoryTurn(attacker, defender, battleStats, attackerDamage, defenderDamage, initiative, roundCrits, roundDodges) {
    const applyPotion = (player, isAttacker) => {
      if (player.inventory.items.length === 0) return;
      const healthPotions = player.inventory.items.filter(item => item.name.includes('Health Potion'));
      if (healthPotions.length > 0 && player.health < enumHelper.maxHealth(player.level)) {
        const potion = healthPotions[randomBetween(0, healthPotions.length - 1)];
        const healAmount = Math.ceil(potion.power * (player.level / 2));
        player.health += healAmount;
        if (player.health > enumHelper.maxHealth(player.level)) player.health = enumHelper.maxHealth(player.level);
        player.inventory.items.splice(player.inventory.items.indexOf(potion), 1);
        if (isAttacker) {
          if (defenderDamage > healAmount) { defenderDamage -= healAmount; if (this.isMonster(defender)) defender.dmgDealt -= healAmount; }
        } else {
          if (attackerDamage > healAmount) { attackerDamage -= healAmount; if (this.isMonster(defender)) defender.dmgReceived -= healAmount; }
        }
      }
      const manaPotions = player.inventory.items.filter(item => item.name.includes('Mana Potion'));
      if (manaPotions.length > 0 && player.spells.length > 0 && player.mana < enumHelper.maxMana(player.level)) {
        const potion = manaPotions[randomBetween(0, manaPotions.length - 1)];
        const manaAmount = Math.ceil(potion.power * player.level);
        player.mana += manaAmount;
        if (player.mana > enumHelper.maxMana(player.level)) player.mana = enumHelper.maxMana(player.level);
        player.inventory.items.splice(player.inventory.items.indexOf(potion), 1);
      }
    };
    if (initiative.name === attacker.name) {
      applyPotion(attacker, true);
      applyPotion(defender, false);
    } else {
      applyPotion(defender, false);
      applyPotion(attacker, true);
    }
    return { attacker, defender, attackerDamage, defenderDamage, crits: roundCrits, dodges: roundDodges };
  }

  getBattleStats(player) {
    // Pre-compute all stat sums once per round for players (monsters use plain stat objects)
    const cachedStats = this.isMonster(player) ? null : {
      str: sumPlayerTotalStrength(player),
      dex: sumPlayerTotalDexterity(player),
      end: sumPlayerTotalEndurance(player),
      int: sumPlayerTotalIntelligence(player),
      luk: sumPlayerTotalLuck(player),
    };
    return {
      attackPower: this.calculateAttack(player, cachedStats),
      defensePower: this.calculateDefense(player, cachedStats),
      cachedStats,
    };
  }

  calculateAttack(player, cachedStats) {
    let attackPower;
    switch (player.equipment.weapon.attackType) {
      case 'melee': {
        if (this.isMonster(player)) {
          attackPower = (player.stats.str + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.str) / 2)));
        } else {
          const str = cachedStats.str;
          const luk = cachedStats.luk;
          attackPower = str + player.equipment.weapon.power + (((luk * 1.5) + randomBetween(1, str)) / 2);
        }
        break;
      }
      case 'range': {
        if (this.isMonster(player)) {
          attackPower = (player.stats.dex + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.dex) / 2)));
        } else {
          const dex = cachedStats.dex;
          const luk = cachedStats.luk;
          attackPower = dex + player.equipment.weapon.power + (((luk * 1.5) + randomBetween(1, dex)) / 2);
        }
        break;
      }
      case 'magic': {
        if (this.isMonster(player)) {
          attackPower = (player.stats.int + player.equipment.weapon.power + player.power) + (player.stats.dex + (player.stats.luk + (randomBetween(1, player.stats.int) / 2)));
        } else {
          const int = cachedStats.int;
          const luk = cachedStats.luk;
          attackPower = int + player.equipment.weapon.power + (((luk * 1.5) + randomBetween(1, int)) / 2);
        }
        break;
      }
    }
    return randomBetween(Math.round(attackPower / 2), attackPower);
  }

  calculateDefense(player, cachedStats) {
    if (this.isMonster(player)) {
      const base = player.stats.end + player.equipment.armor.power + player.power;
      const magBase = player.stats.int + player.equipment.armor.power + player.power;
      const bonus = (player.stats.dex / 2) + (player.stats.luk / 2);
      return {
        physicalDefensePower: base + bonus,
        magicDefensePower: magBase + bonus,
      };
    }
    const { end, int, dex, luk } = cachedStats;
    const armorBonus = (player.equipment.armor.power + player.equipment.helmet.power) / 2;
    const dexLukBonus = dex + ((luk * 1.5) / 2);
    return {
      physicalDefensePower: end + armorBonus + dexLukBonus,
      magicDefensePower: int + armorBonus + dexLukBonus,
    };
  }

  // Diminishing-returns damage formula: attack² / (attack + defense)
  // At equal values: 50% damage; 2x attack vs defense: 67% damage; 0.5x: 33%
  calcDamage(attackPower, defensePower) {
    if (attackPower <= 0) return 0;
    return Math.max(1, Math.round(attackPower * attackPower / (attackPower + defensePower)));
  }

  // LUK-based crit chance: 5% base + 0.5% per LUK, capped at 40%
  getCritChance(luk) {
    return Math.min(40, 5 + luk * 0.5);
  }

  // DEX-based dodge chance for physical attacks: 5% min, 30% max
  getDodgeChance(attackerDex, defenderDex) {
    return Math.min(30, Math.max(5, defenderDex * 0.5 - attackerDex * 0.25));
  }

  isMonster(obj) {
    return obj.power !== undefined;
  }

}

module.exports = BattleSimulator;
