const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Candidate = require('../models/Candidate');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { buildEmailPrompt } = require('../prompts/emailPrompt');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/email - admin, hr only
router.post('/', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { candidateId, type } = req.body;
    if (!['shortlist', 'rejection', 'interview'].includes(type)) {
      return res.status(400).json({ error: 'Invalid email type. Use: shortlist, rejection, interview' });
    }

    const candidate = await Candidate.findById(candidateId).populate('jobId');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(buildEmailPrompt(candidate, type));
    const emailBody = result.response.text();

    const typeLabel = { shortlist: 'Shortlist', rejection: 'Rejection', interview: 'Interview' };
    await Candidate.findByIdAndUpdate(candidateId, {
      $push: { emailDrafts: { type, body: emailBody, createdAt: new Date() } }
    });
    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: `Generated ${typeLabel[type] || type} email`, entityType: 'email',
      entityId: candidateId, entityName: candidate.name,
      severity: 'info'
    });

    res.json({ success: true, emailBody });
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/email/status/:candidateId - update candidate pipeline status
router.patch('/status/:candidateId', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'shortlisted', 'rejected', 'interviewing', 'offered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.candidateId,
      { status },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
