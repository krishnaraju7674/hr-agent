const express = require('express');
const EmailTemplate = require('../models/EmailTemplate');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/templates - list all templates
router.get('/', auth([]), async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ isDefault: -1, createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates - create template
router.post('/', auth(['admin', 'hr']), async (req, res) => {
  try {
    const { name, type, subject, body, variables, isDefault } = req.body;
    const template = await EmailTemplate.create({
      name, type, subject, body,
      variables: variables || [],
      createdBy: req.user.id,
      isDefault: isDefault || false
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/templates/:id
router.patch('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', auth(['admin', 'hr']), async (req, res) => {
  try {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
