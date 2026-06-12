import { useState, useEffect } from 'react';
import axios from 'axios';

const verdictStyles = {
  STRONG: 'text-success-400 bg-success-500/20 border-success-500/30',
  GOOD: 'text-primary-300 bg-primary-500/20 border-primary-500/30',
  AVERAGE: 'text-warning-400 bg-warning-500/20 border-warning-500/30',
  WEAK: 'text-danger-400 bg-danger-500/20 border-danger-500/30',
};

export default function CandidateComparison({ isOpen, onClose, jobId }) {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      axios.get(`/api/jobs/${jobId}`).then(r => {
        setCandidates(r.data.candidates?.filter(c => c.status !== 'rejected') || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isOpen, jobId]);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const comp = candidates.filter(c => selected.includes(c._id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Compare Candidates</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <>
            <p className="text-xs text-surface-400 mb-4">Select 2-4 candidates to compare side by side</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
              {candidates.map(c => (
                <button key={c._id} onClick={() => toggle(c._id)}
                  className={`p-3 rounded-xl border text-left transition-all ${selected.includes(c._id) ? 'bg-primary-500/20 border-primary-500/30' : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'}`}>
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-surface-400">{c.currentRole || 'N/A'}</p>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border inline-block mt-1 ${verdictStyles[c.verdict] || verdictStyles.AVERAGE}`}>{c.verdict}</span>
                </button>
              ))}
            </div>

            {comp.length >= 2 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 pr-4 w-32">Metric</th>
                      {comp.map(c => (
                        <th key={c._id} className="text-center py-3 px-4 min-w-[160px]">
                          <p className="font-semibold text-white">{c.name}</p>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border inline-block mt-1 ${verdictStyles[c.verdict] || verdictStyles.AVERAGE}`}>{c.verdict}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Overall Score', key: 'scores.overall', color: '#22d3ee' },
                      { label: 'Skills', key: 'scores.skills', color: '#818cf8' },
                      { label: 'Experience', key: 'scores.experience', color: '#f59e0b' },
                      { label: 'Education', key: 'scores.education', color: '#34d399' },
                      { label: 'Culture Fit', key: 'scores.culture_fit', color: '#f472b6' },
                    ].map(row => {
                      const getVal = c => {
                        const parts = row.key.split('.');
                        return c[parts[0]]?.[parts[1]] || 0;
                      };
                      return (
                        <tr key={row.key} className="border-b border-white/[0.04]">
                          <td className="py-3 pr-4 text-xs text-surface-400">{row.label}</td>
                          {comp.map(c => {
                            const val = getVal(c);
                            const max = Math.max(...comp.map(getVal), 1);
                            return (
                              <td key={c._id} className="py-3 px-4 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <span className="text-sm font-bold text-white w-6">{Math.round(val)}</span>
                                  <div className="w-20 h-2 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${(val / 100) * 100}%`, backgroundColor: row.color }} />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-3 pr-4 text-xs text-surface-400">Status</td>
                      {comp.map(c => (
                        <td key={c._id} className="py-3 px-4 text-center text-xs text-surface-300 capitalize">{c.status}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-3 pr-4 text-xs text-surface-400">Experience</td>
                      {comp.map(c => (
                        <td key={c._id} className="py-3 px-4 text-center text-xs text-surface-300">{c.yearsExperience ? `${c.yearsExperience}yrs` : 'N/A'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-xs text-surface-400">Summary</td>
                      {comp.map(c => (
                        <td key={c._id} className="py-3 px-4 text-center text-xs text-surface-400 leading-relaxed">
                          {c.summary ? c.summary.length > 120 ? c.summary.slice(0, 120) + '...' : c.summary : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {comp.length < 2 && selected.length > 0 && (
              <p className="text-center text-sm text-surface-500 py-4">Select at least 2 candidates to compare</p>
            )}
            {selected.length === 0 && (
              <p className="text-center text-sm text-surface-500 py-4">Click candidates above to select them for comparison</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
