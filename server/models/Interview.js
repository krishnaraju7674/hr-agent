const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['phone', 'video', 'onsite', 'technical', 'hr'], default: 'video' },
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  location: String,
  meetingLink: String,
  notes: String,
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  remindersSent: { type: Number, default: 0 }
}, { timestamps: true });

InterviewSchema.index({ scheduledAt: 1 });
InterviewSchema.index({ candidate: 1 });
InterviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);
