const mongoose = require('mongoose');

const questSchema = mongoose.Schema({
  questMob: {
    name: {
      type: String,
      default: 'None'
    },
    count: {
      type: Number,
      default: 0
    },
    killCount: {
      type: Number,
      default: 0
    }
  },
  completed: {
    type: Number,
    default: 0
  },
  updated_at: {
    type: Date,
    default: Date()
  }
});

const newQuest = {
  questMob: {
    name: questSchema.obj.questMob.name.default,
    count: questSchema.obj.questMob.count.default,
    killCount: questSchema.obj.questMob.killCount.default
  },
  completed: questSchema.obj.completed.default,
  updated_at: questSchema.obj.updated_at.default
};

questSchema.set('autoIndex', false);

module.exports = { questSchema, newQuest };
