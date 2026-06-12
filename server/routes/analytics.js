const express = require('express');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/overview', auth([]), async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const totalCandidates = await Candidate.countDocuments();

    // Aggregating average scores
    const avgScoresRes = await Candidate.aggregate([
      {
        $group: {
          _id: null,
          overall: { $avg: '$scores.overall' },
          skills: { $avg: '$scores.skills' },
          experience: { $avg: '$scores.experience' },
          education: { $avg: '$scores.education' },
          culture_fit: { $avg: '$scores.culture_fit' }
        }
      }
    ]);
    const avgScores = avgScoresRes[0] || { overall: 0, skills: 0, experience: 0, education: 0, culture_fit: 0 };

    // Aggregating pipeline stages
    const pipelineRes = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const pipeline = { new: 0, shortlisted: 0, interviewing: 0, offered: 0, rejected: 0 };
    pipelineRes.forEach(p => {
      if (p._id in pipeline) pipeline[p._id] = p.count;
    });

    // Aggregating verdicts distribution
    const verdictsRes = await Candidate.aggregate([
      { $group: { _id: '$verdict', count: { $sum: 1 } } }
    ]);
    const verdicts = { STRONG: 0, GOOD: 0, AVERAGE: 0, WEAK: 0 };
    verdictsRes.forEach(v => {
      if (v._id in verdicts) verdicts[v._id] = v.count;
    });

    // Aggregating department breakdowns
    const departments = await Candidate.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' },
      {
        $group: {
          _id: '$job.department',
          count: { $sum: 1 },
          avgScore: { $avg: '$scores.overall' }
        }
      }
    ]);

    res.json({
      totalJobs,
      openJobs,
      totalCandidates,
      avgScores,
      pipeline,
      verdicts,
      departments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;