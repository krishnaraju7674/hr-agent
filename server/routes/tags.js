const express = require('express');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/tags - get all unique tags across candidates
router.get('/', auth([]), async (req, res) => {
  try {
    const result = await Candidate.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const tags = result.map(r => ({ name: r._id, count: r.count }));
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tags/candidate/:candidateId - update tags for a candidate
router.patch('/candidate/:candidateId', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { tags } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.candidateId,
      { tags: tags || [] },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate.tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
