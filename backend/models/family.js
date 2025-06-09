
const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 20
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Family', familySchema);
