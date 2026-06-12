const buildScreenPrompt = (resumeText, job) => `
You are a senior HR recruiter and talent evaluator.

You will be given a job description and a candidate's resume.
Analyze the resume carefully and return ONLY valid JSON.
No markdown. No explanation. Raw JSON starting with { only.

JOB TITLE: ${job.title}
DEPARTMENT: ${job.department}
JOB DESCRIPTION:
${job.description}

REQUIREMENTS:
${job.requirements.join('\n')}

CANDIDATE RESUME:
${resumeText}

Return this exact JSON structure:
{
  "name": "Full name from resume",
  "email": "email if found, else null",
  "phone": "phone if found, else null",
  "current_role": "Current or most recent job title",
  "years_experience": <number>,
  "verdict": "STRONG" | "GOOD" | "AVERAGE" | "WEAK",
  "summary": "3-sentence plain-language assessment of this candidate for this specific role",
  "scores": {
    "overall":     <0-100>,
    "skills":      <0-100>,
    "experience":  <0-100>,
    "education":   <0-100>,
    "culture_fit": <0-100>
  },
  "strengths": [
    "Specific strength 1 relevant to this JD",
    "Specific strength 2 relevant to this JD",
    "Specific strength 3 relevant to this JD"
  ],
  "gaps": [
    "Missing requirement 1 from JD",
    "Missing requirement 2 from JD"
  ],
  "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "interview_questions": [
    "Question 1 tailored to gaps or verify strengths",
    "Question 2 tailored to this candidate's background",
    "Question 3 situational based on role requirements"
  ],
  "recommendation": "One direct sentence: hire / interview / skip and why"
}`;

module.exports = { buildScreenPrompt };
