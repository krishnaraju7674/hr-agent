const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');
const { buildAdvisePrompt } = require('../prompts/advisePrompt');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getStageColor(stage) {
  const colors = { new: '#3b82f6', shortlisted: '#22c55e', interviewing: '#eab308', offered: '#6366f1', rejected: '#ef4444' };
  return colors[stage] || '#6b7280';
}

// GET /api/ai/status - lightweight check
router.get('/status', auth([]), (req, res) => {
  res.json({ available: true, model: 'gemini-2.5-flash', provider: 'Google Generative AI' });
});

// POST /api/ai/advise - get AI-powered recruitment advice
router.post('/advise', auth([]), async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    const candidates = await Candidate.find().populate('jobId', 'title department').sort({ createdAt: -1 }).lean();

    const totalJobs = jobs.length;
    const openJobs = jobs.filter((j) => j.status === 'open').length;
    const totalCandidates = candidates.length;
    const stageCounts = {};
    const verdictCounts = {};
    const recentActivity = candidates.slice(0, 15);

    candidates.forEach((c) => {
      stageCounts[c.status] = (stageCounts[c.status] || 0) + 1;
      verdictCounts[c.verdict] = (verdictCounts[c.verdict] || 0) + 1;
    });

    const candidatesByJob = {};
    candidates.forEach((c) => {
      const key = c.jobId?._id?.toString() || 'unknown';
      if (!candidatesByJob[key]) candidatesByJob[key] = { title: c.jobId?.title || 'Unknown', count: 0, stages: {} };
      candidatesByJob[key].count++;
      candidatesByJob[key].stages[c.status] = (candidatesByJob[key].stages[c.status] || 0) + 1;
    });

    const context = {
      greeting: getGreeting(),
      timestamp: new Date().toISOString(),
      stats: {
        totalJobs, openJobs, closedJobs: totalJobs - openJobs,
        totalCandidates, newCandidates: stageCounts.new || 0,
        shortlisted: stageCounts.shortlisted || 0,
        interviewing: stageCounts.interviewing || 0,
        offered: stageCounts.offered || 0,
        rejected: stageCounts.rejected || 0,
      },
      stageCounts,
      verdictCounts,
      recentActivity: recentActivity.map((c) => ({
        name: c.name, status: c.status, verdict: c.verdict,
        jobTitle: c.jobId?.title || 'Unknown',
        time: getRelativeTime(c.createdAt),
        score: c.scores?.overall || 0,
      })),
      candidatesByJob,
      jobs: jobs.map((j) => ({
        id: j._id, title: j.title, department: j.department, status: j.status,
        requirements: j.requirements?.length || 0,
        createdAt: getRelativeTime(j.createdAt),
      })),
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(buildAdvisePrompt(context));

    const raw = result.response.text();
    let advice;
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gm, '').trim();
      advice = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message, 'Raw:', raw.slice(0, 200));
      advice = {
        summary: 'AI analysis completed but could not be structured. Please try again.',
        pipelineHealth: 'attention_needed', pipelineScore: 50,
        priorityActions: [{ action: 'Review pipeline data', reason: 'AI encountered a parsing issue', impact: 'medium', suggestion: 'Try refreshing the advice' }],
        recommendations: [], bottlenecks: [], insights: ['AI analysis available. Try the chat feature for specific questions.'], quickActions: []
      };
    }

    res.json({ success: true, context, advice });
  } catch (err) {
    console.error('AI advise error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat - conversational AI for recruitment questions
router.post('/chat', auth([]), async (req, res) => {
  try {
    const { message, context: userContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    const candidates = await Candidate.find().populate('jobId', 'title department').lean();

    const stats = {
      totalJobs: jobs.length,
      openJobs: jobs.filter((j) => j.status === 'open').length,
      totalCandidates: candidates.length,
      stageBreakdown: {},
      recentCandidates: candidates.slice(-10).map((c) => ({
        name: c.name, status: c.status, verdict: c.verdict,
        job: c.jobId?.title, score: c.scores?.overall,
      })),
    };
    candidates.forEach((c) => { stats.stageBreakdown[c.status] = (stats.stageBreakdown[c.status] || 0) + 1; });

    const systemContext = `You are an expert AI recruitment assistant for HR Agent. You have access to this recruitment data:
- ${stats.totalJobs} total jobs (${stats.openJobs} open)
- ${stats.totalCandidates} total candidates
- Pipeline: ${JSON.stringify(stats.stageBreakdown)}
- Recent candidates: ${JSON.stringify(stats.recentCandidates.slice(0, 5))}

Answer the user's question concisely and helpfully. Be specific using the data. If you don't know something, say so.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'user', parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.7 },
    });

    const reply = result.response.text();
    res.json({ success: true, reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
