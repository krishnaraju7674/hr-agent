import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const verdictStyles = {
  STRONG: 'verdict-strong',
  GOOD: 'verdict-good',
  AVERAGE: 'verdict-average',
  WEAK: 'verdict-weak',
};

const statusColors = {
  new: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
  shortlisted: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  interviewing: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  offered: 'bg-success-500/20 text-success-400 border-success-500/30',
  rejected: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
};

const statusOptions = ['new', 'shortlisted', 'interviewing', 'offered', 'rejected'];

function ScoreMiniBar({ score }) {
  const getColor = (s) => {
    if (s >= 80) return 'bg-success-400';
    if (s >= 60) return 'bg-primary-400';
    if (s >= 40) return 'bg-warning-400';
    return 'bg-danger-400';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${getColor(score)} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export default function CandidateTable({ candidates = [], jobId, showJobInfo = false }) {
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [selected, setSelected] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  // Sort by overall score descending
  const sorted = [...candidates].sort((a, b) => {
    const scoreA = a.screening?.scores?.overall || a.scores?.overall || 0;
    const scoreB = b.screening?.scores?.overall || b.scores?.overall || 0;
    return scoreB - scoreA;
  });

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === sorted.length) {
      setSelected([]);
    } else {
      setSelected(sorted.map((c) => c._id));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selected.length === 0) return;
    setStatusLoading(true);
    try {
      await axios.post('/api/candidates/bulk-status', { candidateIds: selected, status: newStatus });
      setSelected([]);
      setBulkStatus('');
      window.location.reload();
    } catch (err) {
      console.error('Bulk status update failed:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get('/api/candidates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <div className="text-4xl mb-3">👥</div>
        <h3 className="text-base font-semibold mb-1">No candidates yet</h3>
        <p className="text-sm text-surface-400">Upload resumes to start screening candidates</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Candidates
            <span className="text-sm font-normal text-surface-400">({sorted.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <button onClick={handleExportCSV} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {isAdminOrHR && selected.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 animate-fade-in">
            <span className="text-sm text-primary-300 font-medium">{selected.length} selected</span>
            <select
              value={bulkStatus}
              onChange={(e) => { setBulkStatus(e.target.value); handleBulkStatusChange(e.target.value); }}
              disabled={statusLoading}
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
            >
              <option value="" className="bg-surface-800 text-white">Change status...</option>
              {statusOptions.map((s) => (
                <option key={s} value={s} className="bg-surface-800 text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button onClick={() => setSelected([])} className="text-xs text-surface-400 hover:text-white transition-colors ml-auto">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {isAdminOrHR && (
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === sorted.length && sorted.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary-500"
                  />
                </th>
              )}
              <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5 w-12">#</th>
              <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Name</th>
              {showJobInfo && <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Job</th>}
              <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Score</th>
              <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Verdict</th>
              <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Status</th>
              <th className="text-right text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((candidate, index) => {
              const screening = candidate.screening || {};
              const scores = screening.scores || candidate.scores || {};
              const overallScore = scores.overall || 0;
              const verdict = screening.verdict || candidate.verdict || 'AVERAGE';
              const status = candidate.status || 'new';

              return (
                <tr
                  key={candidate._id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors group ${selected.includes(candidate._id) ? 'bg-primary-500/5' : ''}`}
                  onClick={() => navigate(`/candidates/${candidate._id}`)}
                >
                  {isAdminOrHR && (
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(candidate._id)}
                        onChange={() => toggleSelect(candidate._id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary-500"
                      />
                    </td>
                  )}
                  <td className="py-3.5 px-5"><span className="text-sm font-semibold text-surface-500">{index + 1}</span></td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400/30 to-primary-600/30 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-300">
                        {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">{candidate.name}</p>
                        {candidate.email && <p className="text-xs text-surface-500 truncate max-w-[200px]">{candidate.email}</p>}
                      </div>
                    </div>
                  </td>
                  {showJobInfo && (
                    <td className="py-3.5 px-5">
                      <span className="text-sm text-surface-300">{candidate.jobId?.title || candidate.jobTitle || '—'}</span>
                    </td>
                  )}
                  <td className="py-3.5 px-5"><ScoreMiniBar score={overallScore} /></td>
                  <td className="py-3.5 px-5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${verdictStyles[verdict] || verdictStyles.AVERAGE}`}>{verdict}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[status] || statusColors.new}`}>{status}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}