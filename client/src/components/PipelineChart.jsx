import { useState, useEffect } from 'react';

const stages = [
  { key: 'new', label: 'New', color: 'bg-surface-400', textColor: 'text-surface-300' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-primary-400', textColor: 'text-primary-300' },
  { key: 'interviewing', label: 'Interviewing', color: 'bg-warning-400', textColor: 'text-warning-400' },
  { key: 'offered', label: 'Offered', color: 'bg-success-400', textColor: 'text-success-400' },
  { key: 'rejected', label: 'Rejected', color: 'bg-danger-400', textColor: 'text-danger-400' },
];

export default function PipelineChart({ data = {}, total = 0 }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (total === 0) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
        Recruitment Pipeline
      </h2>

      {/* Stacked Bar */}
      <div className="h-10 rounded-xl overflow-hidden flex bg-white/[0.04] mb-5">
        {stages.map((stage) => {
          const count = data[stage.key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          if (percentage === 0) return null;

          return (
            <div
              key={stage.key}
              className={`${stage.color} relative group transition-all duration-700 ease-out flex items-center justify-center`}
              style={{ width: animated ? `${percentage}%` : '0%' }}
              title={`${stage.label}: ${count} (${Math.round(percentage)}%)`}
            >
              {percentage > 10 && (
                <span className="text-xs font-bold text-surface-900 opacity-80">
                  {count}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                {stage.label}: {count} ({Math.round(percentage)}%)
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-800" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {stages.map((stage) => {
          const count = data[stage.key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={stage.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${stage.color}`} />
              <span className="text-sm text-surface-400">{stage.label}</span>
              <span className={`text-sm font-semibold ${stage.textColor}`}>{count}</span>
              <span className="text-xs text-surface-600">({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
