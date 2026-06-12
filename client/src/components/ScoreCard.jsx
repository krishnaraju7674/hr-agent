import { useState, useEffect } from 'react';

const dimensions = [
  { key: 'skills', label: 'Skills Match', icon: '🎯' },
  { key: 'experience', label: 'Experience', icon: '💼' },
  { key: 'education', label: 'Education', icon: '🎓' },
  { key: 'culture_fit', label: 'Culture Fit', icon: '🤝' },
  { key: 'overall', label: 'Overall', icon: '⭐' },
];

function getScoreColor(score) {
  if (score >= 80) return { bar: 'bg-success-400', text: 'text-success-400', ring: 'text-success-400' };
  if (score >= 60) return { bar: 'bg-primary-400', text: 'text-primary-300', ring: 'text-primary-400' };
  if (score >= 40) return { bar: 'bg-warning-400', text: 'text-warning-400', ring: 'text-warning-400' };
  return { bar: 'bg-danger-400', text: 'text-danger-400', ring: 'text-danger-400' };
}

function CircularScore({ score }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const colors = getScoreColor(score);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          className={colors.ring}
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${colors.text}`}>{animatedScore}</span>
        <span className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">Overall</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, icon, score, delay }) {
  const [animated, setAnimated] = useState(false);
  const colors = getScoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-8 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-surface-300">{label}</span>
          <span className={`text-sm font-bold tabular-nums ${colors.text}`}>{score}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all duration-700 ease-out`}
            style={{ width: animated ? `${score}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ScoreCard({ scores = {} }) {
  const overallScore = scores.overall || 0;

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        Score Breakdown
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
        {/* Circular Overall Score */}
        <CircularScore score={overallScore} />

        {/* Dimension Bars */}
        <div className="space-y-4">
          {dimensions
            .filter((d) => d.key !== 'overall')
            .map((dim, i) => (
              <ScoreBar
                key={dim.key}
                label={dim.label}
                icon={dim.icon}
                score={scores[dim.key] || 0}
                delay={200 + i * 150}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
