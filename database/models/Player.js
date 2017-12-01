const playerSchema = require('../schemas/player');

class Player {

  get id() {
    return this.id;
  }

  get discordId() {
    return this.discordId;
  }

  set discordId(newDiscordID) {
    this.discordId = newDiscordID;
  }

  get name() {
    return this.name;
  }

  set name(newName) {
    this.name = newName;
  }

  get health() {
    return this.health;
  }

  set health(newHealth) {
    this.health = newHealth;
  }

  get experience() {
    return this.experience;
  }

  set experience(newExperience) {
    this.experience = newExperience;
  }

  get map() {
    return this.map;
  }

  set map(newMap) {
    this.map = newMap;
  }

  get level() {
    return this.level;
  }

  set level(newLevel) {
    this.level = newLevel;
  }

  get equipment() {
    return this.equipment;
  }

  set equipment(newEquipment) {
    this.equipment = newEquipment;
  }

  get stats() {
    return this.stats;
  }

  set stats(newStats) {
    this.stats = newStats;
  }

  get isOnline() {
    return this.isOnline;
  }

  set isOnline(newIsOnline) {
    this.isOnline = newIsOnline;
  }

  get lastLogin() {
    return this.lastLogin;
  }

  set lastLogin(newLastLogin) {
    this.lastLogin = newLastLogin;
  }

  get createdAt() {
    return this.createdAt;
  }

  set createdAt(newCreatedAt) {
    this.createdAt = newCreatedAt;
  }

}

module.exports.Player = Player;
