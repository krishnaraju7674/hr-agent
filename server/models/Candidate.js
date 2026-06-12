const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeText: String,
  currentRole: String,
  yearsExperience: Number,
  scores: {
    overall: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    culture_fit: { type: Number, default: 0 }
  },
  verdict: { type: String, enum: ['STRONG', 'GOOD', 'AVERAGE', 'WEAK'], default: 'AVERAGE' },
  summary: String,
  strengths: [String],
  gaps: [String],
  topSkills: [String],
  interviewQuestions: [String],
  recommendation: String,
  status: {
    type: String,
    enum: ['new', 'shortlisted', 'rejected', 'interviewing', 'offered'],
    default: 'new'
  },
  emailDrafts: [{
    type: { type: String },
    body: String,
    createdAt: { type: Date, default: Date.now }
  }],
  notes: [{
    content: { type: String, required: true },
    author: { type: String, default: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  source: { type: String, enum: ['direct', 'referral', 'linkedin', 'indeed', 'email', 'other'], default: 'direct' },
  location: String,
  expectedSalary: Number,
  availability: String
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
