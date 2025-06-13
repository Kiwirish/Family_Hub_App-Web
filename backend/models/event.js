const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxLength: 1000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    maxLength: 200
  },
  category: {
    type: String,
    enum: ['appointment', 'birthday', 'holiday', 'school', 'work', 'social', 'sports', 'travel', 'other'],
    default: 'other'
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'maybe'],
      default: 'pending'
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      default: 15
    }
  }],
  recurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [Number] // For weekly recurrence
  }
}, {
  timestamps: true
});

// Index for efficient querying
eventSchema.index({ familyId: 1, startDate: 1 });
eventSchema.index({ familyId: 1, category: 1 });

module.exports = mongoose.model('Event', eventSchema);