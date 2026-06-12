const express = require('express');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/activities - list activities with optional filters
router.get('/', auth([]), async (req, res) => {
  try {
    const { limit = 50, entityType, entityId, action } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = { $regex: action, $options: 'i' };

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities/recent - recent activities for dashboard
router.get('/recent', auth([]), async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to log activities (exported for use in other routes)
const logActivity = async (userId, userName, { action, entityType, entityId, entityName, details, severity }) => {
  try {
    await Activity.create({
      user: userId, userName,
      action, entityType, entityId, entityName,
      details: details || {},
      severity: severity || 'info'
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = router;
module.exports.logActivity = logActivity;
