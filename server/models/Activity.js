const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action: { type: String, required: true },
  entityType: { type: String, enum: ['job', 'candidate', 'interview', 'offer', 'email', 'user', 'application'], required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  entityName: String,
  details: mongoose.Schema.Types.Mixed,
  severity: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' }
}, { timestamps: true });

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
