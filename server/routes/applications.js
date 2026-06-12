const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { buildScreenPrompt } = require('../prompts/screenPrompt');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/applications/apply - public, no auth needed
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { jobId, name, email, phone } = req.body;
    if (!jobId || !name) {
      return res.status(400).json({ error: 'Job ID and name are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ error: 'This job is not accepting applications' });

    let resumeText = '';
    if (req.file) {
      try {
        if (req.file.mimetype === 'application/pdf') {
          const data = await pdfParse(req.file.buffer);
          resumeText = data.text;
        } else if (req.file.mimetype.includes('wordprocessing') || req.file.originalname.endsWith('.docx')) {
          const data = await mammoth.extractRawText({ buffer: req.file.buffer });
          resumeText = data.value;
        } else {
          resumeText = req.file.buffer.toString('utf-8');
        }
      } catch (parseErr) {
        resumeText = `[Resume: ${req.file.originalname}]`;
      }
    }

    let screening = null;
    if (resumeText && process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: buildScreenPrompt(resumeText, job) }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        const raw = result.response.text();
        screening = JSON.parse(raw.trim());
      } catch (err) {
        console.error('AI screening on application failed:', err.message);
      }
    }

    const candidate = await Candidate.create({
      name: screening?.name || name,
      email: email || screening?.email || null,
      phone: phone || screening?.phone || null,
      jobId: job._id,
      resumeText,
      currentRole: screening?.current_role || '',
      yearsExperience: screening?.years_experience || 0,
      scores: screening?.scores || { overall: 0, skills: 0, experience: 0, education: 0, culture_fit: 0 },
      verdict: screening?.verdict || 'AVERAGE',
      summary: screening?.summary || 'Application received. AI screening pending.',
      strengths: screening?.strengths || [],
      gaps: screening?.gaps || [],
      topSkills: screening?.top_skills || [],
      interviewQuestions: screening?.interview_questions || [],
      recommendation: screening?.recommendation || '',
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
        verdict: candidate.verdict,
        screened: !!screening,
      },
    });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications/check/:jobId/:email - check if already applied
router.get('/check/:jobId/:email', async (req, res) => {
  try {
    const existing = await Candidate.findOne({
      jobId: req.params.jobId,
      email: req.params.email.toLowerCase(),
    });
    res.json({ exists: !!existing, candidate: existing ? { id: existing._id, status: existing.status } : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
