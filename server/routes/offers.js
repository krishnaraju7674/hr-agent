const express = require('express');
const Offer = require('../models/Offer');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/offers - list all offers
router.get('/', auth([]), async (req, res) => {
  try {
    const { status, candidate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (candidate) filter.candidate = candidate;

    const offers = await Offer.find(filter)
      .populate('candidate', 'name email phone currentRole')
      .populate('job', 'title department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/offers - create offer
router.post('/', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { candidateId, jobId, salary, currency, startDate, benefits, terms, notes } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const offer = await Offer.create({
      candidate: candidateId, job: jobId,
      createdBy: req.user.id,
      salary, currency: currency || 'USD',
      startDate: startDate ? new Date(startDate) : undefined,
      benefits: benefits || [],
      terms, notes
    });

    await Candidate.findByIdAndUpdate(candidateId, { status: 'offered' });

    await Activity.create({
      user: req.user.id, userName: req.user.name,
      action: 'Created offer', entityType: 'offer',
      entityId: offer._id, entityName: candidate.name,
      severity: 'success'
    });

    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/offers/:id - update offer status
router.patch('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (req.body.status === 'sent' && !offer.sentAt) {
      offer.sentAt = new Date();
      await offer.save();
    }
    if (req.body.status === 'accepted') {
      offer.respondedAt = new Date();
      await offer.save();
    }
    if (req.body.status === 'declined') {
      offer.respondedAt = new Date();
      await offer.save();
    }

    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/offers/:id
router.delete('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
