const express = require('express');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/candidates/export - admin, hr only
router.get('/export', auth(['admin', 'hr']), async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('jobId');
    
    // Build CSV headers and rows
    const headers = ['Name', 'Email', 'Phone', 'Job Title', 'Verdict', 'Status', 'Overall Score', 'Skills Score', 'Experience Score', 'Education Score', 'Culture Fit Score', 'Created At'];
    const rows = candidates.map(c => [
      c.name,
      c.email || '',
      c.phone || '',
      c.jobId?.title || '',
      c.verdict,
      c.status,
      c.scores?.overall || 0,
      c.scores?.skills || 0,
      c.scores?.experience || 0,
      c.scores?.education || 0,
      c.scores?.culture_fit || 0,
      c.createdAt ? c.createdAt.toISOString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates-export.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/candidates/bulk-status - admin, hr only
router.post('/bulk-status', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { candidateIds, status } = req.body;
    const validStatuses = ['new', 'shortlisted', 'rejected', 'interviewing', 'offered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      { $set: { status } }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:id - all authenticated users
router.get('/:id', auth([]), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('jobId');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    // Nest the screening details so they match the React page's expectation
    const formattedCandidate = candidate.toObject();
    formattedCandidate.screening = {
      scores: candidate.scores,
      verdict: candidate.verdict,
      summary: candidate.summary,
      strengths: candidate.strengths,
      gaps: candidate.gaps,
      topSkills: candidate.topSkills,
      interviewQuestions: candidate.interviewQuestions,
      recommendation: candidate.recommendation
    };
    
    res.json(formattedCandidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/candidates/:id/status - admin, hr only
router.patch('/:id/status', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'shortlisted', 'rejected', 'interviewing', 'offered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:candidateId/notes - all authenticated users
router.get('/:candidateId/notes', auth([]), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    // Sort notes by createdAt descending (newest first)
    const notes = (candidate.notes || []).sort((a, b) => b.createdAt - a.createdAt);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/candidates/:candidateId/notes - admin, hr only
router.post('/:candidateId/notes', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { content, author } = req.body;
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    const newNote = {
      content,
      author: author || req.user.name || 'User',
      createdAt: new Date()
    };
    
    candidate.notes.push(newNote);
    await candidate.save();
    
    // Return the created note (which will have an _id)
    const createdNote = candidate.notes[candidate.notes.length - 1];
    res.status(201).json(createdNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/candidates/:candidateId/notes/:noteId - admin, hr only
router.delete('/:candidateId/notes/:noteId', auth(['admin', 'hr']), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    candidate.notes = candidate.notes.filter(n => n._id.toString() !== req.params.noteId);
    await candidate.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;