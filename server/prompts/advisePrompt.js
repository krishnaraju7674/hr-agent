const buildAdvisePrompt = (ctx) => {
  const jsonStructure = JSON.stringify({
    greeting: `${ctx.greeting}! I've analyzed your pipeline.`,
    summary: '2-3 sentence overall assessment of recruitment health',
    pipelineHealth: 'healthy | attention_needed | critical',
    pipelineScore: 75,
    priorityActions: [{ action: 'Action title', reason: 'Why this matters', impact: 'high | medium | low', suggestion: 'How to execute' }],
    recommendations: [{ type: 'shortlist | interview | review | reach_out | create_job', title: 'Title', detail: 'Specific detail', urgency: 'now | today | this_week' }],
    bottlenecks: ['Bottleneck 1', 'Bottleneck 2'],
    insights: ['Insight 1', 'Insight 2', 'Insight 3'],
    quickActions: [{ label: 'Action', description: 'Brief', type: 'create_job | review_candidates | send_email | schedule_interview' }]
  }, null, 2);

  return `You are an expert senior HR strategist and recruitment analyst AI. You have access to the full recruitment pipeline data.

Current time: ${ctx.timestamp}
${ctx.greeting}

=== RECRUITMENT OVERVIEW ===
Total Jobs: ${ctx.stats.totalJobs} (${ctx.stats.openJobs} open, ${ctx.stats.closedJobs} closed)
Total Candidates: ${ctx.stats.totalCandidates}
Pipeline: New:${ctx.stats.newCandidates}, Shortlisted:${ctx.stats.shortlisted}, Interviewing:${ctx.stats.interviewing}, Offered:${ctx.stats.offered}, Rejected:${ctx.stats.rejected}
Verdicts: ${JSON.stringify(ctx.verdictCounts)}

=== JOBS ===
${ctx.jobs.map((j) => `- ${j.title} (${j.department}) [${j.status}]`).join('\n')}

=== CANDIDATES PER JOB ===
${Object.entries(ctx.candidatesByJob).map(([id, d]) => `- ${d.title}: ${d.count} candidates`).join('\n')}

=== RECENT ACTIVITY ===
${ctx.recentActivity.map((a) => `- ${a.name} | ${a.status} | ${a.verdict} | ${a.jobTitle}`).join('\n')}

Return ONLY valid JSON. No markdown, no explanations, no code blocks.
Use this exact structure:
${jsonStructure}`;
};

module.exports = { buildAdvisePrompt };
