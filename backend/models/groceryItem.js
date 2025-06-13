const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    default: '1'
  },
  unit: {
    type: String,
    enum: ['piece', 'kg', 'g', 'l', 'ml', 'dozen', 'pack', 'bottle', 'can', 'box', 'bag'],
    default: 'piece'
  },
  category: {
    type: String,
    enum: ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 'pantry', 'beverages', 'snacks', 'household', 'personal care', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    maxLength: 200
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  }
}, {
  timestamps: true
});

// Index for efficient querying
groceryItemSchema.index({ familyId: 1, completed: 1 });
groceryItemSchema.index({ familyId: 1, category: 1 });

module.exports = mongoose.model('GroceryItem', groceryItemSchema);