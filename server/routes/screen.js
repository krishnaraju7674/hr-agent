const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');
const { buildScreenPrompt } = require('../prompts/screenPrompt');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


// POST /api/screen - admin, hr only
router.post('/', auth(['admin', 'hr']), upload.array('resumes', 20), async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No resume files uploaded' });
    }

    const results = await Promise.all(req.files.map(async (file) => {
      let resumeText = '';

      try {
        if (file.mimetype === 'application/pdf') {
          const data = await pdfParse(file.buffer);
          resumeText = data.text;
        } else if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.originalname.endsWith('.docx')
        ) {
          const data = await mammoth.extractRawText({ buffer: file.buffer });
          resumeText = data.value;
        } else {
          resumeText = file.buffer.toString('utf-8');
        }
      } catch (parseErr) {
        console.error('Error parsing file:', file.originalname, parseErr.message);
        resumeText = file.buffer.toString('utf-8');
      }

      // Call Gemini
      let data;
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: buildScreenPrompt(resumeText, job) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        });

        const raw = result.response.text();
        data = JSON.parse(raw.trim());
      } catch (geminiErr) {
        console.error('Gemini API/JSON parse error:', file.originalname, geminiErr.message);
        data = {
          name: file.originalname.replace(/\.(pdf|docx?)$/i, ''),
          email: null, phone: null,
          current_role: 'Unknown', years_experience: 0,
          verdict: 'AVERAGE',
          summary: 'Could not parse Gemini response: ' + geminiErr.message,
          scores: { overall: 50, skills: 50, experience: 50, education: 50, culture_fit: 50 },
          strengths: [], gaps: [], top_skills: [],
          interview_questions: [], recommendation: 'Manual review required'
        };
      }

      const candidate = await Candidate.create({
        name: data.name || 'Unknown',
        email: data.email || null,
        phone: data.phone || null,
        jobId: job._id,
        resumeText,
        currentRole: data.current_role || '',
        yearsExperience: data.years_experience || 0,
        scores: data.scores || {},
        verdict: data.verdict || 'AVERAGE',
        summary: data.summary || '',
        strengths: data.strengths || [],
        gaps: data.gaps || [],
        topSkills: data.top_skills || [],
        interviewQuestions: data.interview_questions || [],
        recommendation: data.recommendation || '',
        status: 'new'
      });

      return candidate;
    }));

    res.json({ success: true, candidates: results });
  } catch (err) {
    console.error('Screening error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
