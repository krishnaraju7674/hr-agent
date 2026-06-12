const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'declined', 'negotiating', 'withdrawn'], default: 'draft' },
  salary: { type: Number },
  currency: { type: String, default: 'USD' },
  startDate: Date,
  benefits: [String],
  terms: String,
  notes: String,
  sentAt: Date,
  respondedAt: Date,
  responseMessage: String
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
