const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  title: { type: String, required: true },
  message: String,
  link: String,
  read: { type: Boolean, default: false },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
