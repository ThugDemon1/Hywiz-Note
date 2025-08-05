import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['event', 'task'],
    default: 'event'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  color: {
    type: String,
    default: '#4285f4'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  },

  recurring: {
    frequency: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    daysOfWeek: [Number] // 0-6 for Sunday-Saturday
  },
  attendees: [{
    email: String,
    name: String,
    responseStatus: {
      type: String,
      enum: ['needsAction', 'declined', 'tentative', 'accepted'],
      default: 'needsAction'
    }
  }],
  googleCalendarEventId: String,
  isSynced: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
calendarEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
calendarEventSchema.index({ userId: 1, startTime: 1 });
calendarEventSchema.index({ userId: 1, type: 1 });
calendarEventSchema.index({ googleCalendarEventId: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

export default CalendarEvent; 