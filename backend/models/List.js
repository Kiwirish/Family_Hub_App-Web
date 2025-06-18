const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const listSchema = new mongoose.Schema({
  family: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true },
  title: { type: String, required: true },
  description: String,
  color: { type: String, default: '#f97316' },
  icon: { type: String, default: '📝' },
  items: [listItemSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('List', listSchema);