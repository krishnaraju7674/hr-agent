const express = require('express');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/interviews - list all, with optional filters
router.get('/', auth([]), async (req, res) => {
  try {
    const { status, candidate, job, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (candidate) filter.candidate = candidate;
    if (job) filter.job = job;
    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = new Date(startDate);
      if (endDate) filter.scheduledAt.$lte = new Date(endDate);
    }
    const interviews = await Interview.find(filter)
      .populate('candidate', 'name email phone currentRole')
      .populate('job', 'title department')
      .populate('scheduledBy', 'name')
      .sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/interviews/upcoming - upcoming interviews (next 7 days)
router.get('/upcoming', auth([]), async (req, res) => {
  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const interviews = await Interview.find({
      scheduledAt: { $gte: now, $lte: weekLater },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interviews - schedule interview
router.post('/', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { candidateId, jobId, type, scheduledAt, durationMinutes, location, meetingLink, notes } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const interview = await Interview.create({
      candidate: candidateId,
      job: jobId,
      scheduledBy: req.user.id,
      type: type || 'video',
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 60,
      location, meetingLink, notes
    });

    await Candidate.findByIdAndUpdate(candidateId, { status: 'interviewing' });

    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Scheduled interview', entityType: 'interview',
      entityId: interview._id, entityName: candidate.name,
      severity: 'success'
    });

    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/interviews/:id - update interview
router.patch('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interviews/:id/feedback - add interview feedback
router.post('/:id/feedback', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { feedback, rating, status: 'completed' },
      { new: true }
    );
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Completed interview with feedback', entityType: 'interview',
      entityId: interview._id,
      severity: 'success'
    });

    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/interviews/:id
router.delete('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
