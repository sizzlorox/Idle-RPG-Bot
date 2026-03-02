const { Collection } = require('discord.js');

class PresenceTracker {

  constructor() {
    this._collection = new Collection();
  }

  _key(memberId, guildId) {
    return `${memberId}${guildId}`;
  }

  add(member) {
    const key = this._key(member.discordId, member.guildId);
    if (!this._collection.has(key)) {
      this._collection.set(key, member);
    }
  }

  remove(memberId, guildId) {
    this._collection.delete(this._key(memberId, guildId));
  }

  has(memberId, guildId) {
    return this._collection.has(this._key(memberId, guildId));
  }

  getAll() {
    return [...this._collection.values()];
  }

  get size() {
    return this._collection.size;
  }

}

module.exports = PresenceTracker;
