const buildEmailPrompt = (candidate, type) => {
  const templates = {
    shortlist: `Write a professional, warm shortlisting email for ${candidate.name} who applied for ${candidate.jobId.title}.

Key strengths to mention: ${candidate.strengths ? candidate.strengths.slice(0, 2).join(', ') : 'Strong candidate'}

Keep it 3 paragraphs. Professional but human tone. End with next steps (we'll be in touch about interview scheduling).
Don't use generic phrases like "We regret to inform you".
Sign off as "The Recruitment Team".`,

    rejection: `Write a respectful rejection email for ${candidate.name} who applied for ${candidate.jobId.title}.

Be kind and encouraging. 2 paragraphs.
Do NOT give specific rejection reasons.
Wish them well in their job search.
Sign off as "The Recruitment Team".`,

    interview: `Write an interview invitation email for ${candidate.name} for the ${candidate.jobId.title} role.

Include: congratulations on being selected, next step is an interview, ask them to reply with availability this week or next.
3 paragraphs. Warm professional tone.
Sign off as "The Recruitment Team".`
  };
  return templates[type] || templates.shortlist;
};

module.exports = { buildEmailPrompt };
