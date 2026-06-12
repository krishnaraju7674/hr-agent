const express = require('express');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs - all authenticated users
router.get('/', auth([]), async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    // Attach candidate counts per job
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const candidateCount = await Candidate.countDocuments({ jobId: job._id });
      const statusCounts = await Candidate.aggregate([
        { $match: { jobId: job._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      return { ...job.toObject(), candidateCount, statusCounts };
    }));
    res.json(jobsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs - admin, hr only
router.post('/', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { title, department, description, requirements } = req.body;
    const job = await Job.create({
      title, department, description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split('\n').filter(Boolean),
      createdBy: req.user.id
    });
    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Created job', entityType: 'job',
      entityId: job._id, entityName: title,
      severity: 'success'
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/public - public open positions (no auth)
router.get('/public', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' }).select('-createdBy').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id - all authenticated users
router.get('/:id', auth([]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const candidates = await Candidate.find({ jobId: job._id }).sort({ 'scores.overall': -1 });
    res.json({ ...job.toObject(), candidates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id - admin, hr only (also deletes associated candidates)
router.delete('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Candidate.deleteMany({ jobId: req.params.id });
    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Deleted job', entityType: 'job',
      entityId: req.params.id, entityName: job.title,
      severity: 'warning'
    });
    res.json({ success: true, message: 'Job and associated candidates deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id - admin, hr only
router.patch('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Updated job', entityType: 'job',
      entityId: req.params.id, entityName: job.title,
      severity: 'info'
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
