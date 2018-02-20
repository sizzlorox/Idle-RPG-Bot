const mongoose = require('mongoose');
const mapSchema = require('./map');
const maps = require('../../game/data/maps');
const { equipment } = require('../../utils/enumHelper');
const { starterTown } = require('../../../settings');

const newPlayerObj = (discordId, name) => {
  return {
    discordId,
    name,
    class: 'Wanderer',
    health: 105,
    mana: 50,
    experience: 0,
    map: maps[starterTown],
    level: 1,
    gold: 0,
    isMentionInDiscord: true,
    isPrivateMessage: false,
    isPrivateMessageImportant: false,
    gender: 'neutral',
    equipment: {
      helmet: equipment.empty.helmet,
      armor: equipment.empty.armor,
      weapon: equipment.starter.weapon,
      relic: equipment.empty.relic
    },
    inventory: {
      equipment: [],
      items: []
    },
    stats: {
      str: 1,
      dex: 1,
      end: 1,
      int: 1,
      luk: 1
    },
    spells: [],
    isOnline: true,
    createdAt: new Date().getTime(),
    events: 0,
    gambles: 0,
    stole: 0,
    stolen: 0,
    spellCasted: 0,
    currentBounty: 0,
    kills: {
      mob: 0,
      player: 0
    },
    battles: {
      won: 0,
      lost: 0,
      firstDeath: 0
    },
    deaths: {
      mob: 0,
      player: 0,
      firstDeath: 'never'
    },
    pastEvents: [],
    pastPvpEvents: []
  };
};

const playerSchema = mongoose.Schema({
  discordId: String,
  name: String,
  class: {
    type: String,
    default: 'Wanderer'
  },
  health: Number,
  mana: {
    type: Number,
    default: 50
  },
  experience: Number,
  map: mapSchema,
  level: Number,
  gold: Number,
  isMentionInDiscord: {
    type: Boolean,
    default: true
  },
  isPrivateMessage: {
    type: Boolean,
    default: false
  },
  isPrivateMessageImportant: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    default: 'neutral'
  },
  equipment: {
    helmet: {
      name: String,
      power: Number,
      position: String,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    armor: {
      name: String,
      power: Number,
      position: String,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    weapon: {
      name: String,
      power: Number,
      position: String,
      attackType: String,
      previousOwners: {
        type: Array,
        default: []
      }
    },
    relic: {
      name: String,
      str: Number,
      dex: Number,
      end: Number,
      int: Number,
      luk: Number,
      position: String,
      previousOwners: {
        type: Array,
        default: []
      }
    }
  },
  inventory: {
    equipment: {
      type: Array,
      default: []
    },
    items: {
      type: Array,
      default: []
    }
  },
  stats: {
    str: Number,
    dex: Number,
    end: Number,
    int: Number,
    luk: Number
  },
  spells: {
    type: Array,
    default: []
  },
  isOnline: Boolean,
  createdAt: String,
  events: Number,
  gambles: {
    type: Number,
    default: 0
  },
  stole: {
    type: Number,
    default: 0
  },
  stolen: {
    type: Number,
    default: 0
  },
  spellCasted: {
    type: Number,
    default: 0
  },
  currentBounty: {
    type: Number,
    default: 0
  },
  kills: {
    mob: Number,
    player: Number
  },
  battles: {
    won: {
      type: Number,
      default: 0
    },
    lost: {
      type: Number,
      default: 0
    }
  },
  deaths: {
    mob: Number,
    player: Number,
    firstDeath: String
  },
  pastEvents: {
    type: Array,
    default: []
  },
  pastPvpEvents: {
    type: Array,
    default: []
  }
});

playerSchema.set('autoIndex', false);

module.exports = { playerSchema, newPlayerObj };
