import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ScoreCard from '../components/ScoreCard';
import EmailPanel from '../components/EmailPanel';
import NotesTimeline from '../components/NotesTimeline';
import axios from 'axios';

const verdictStyles = {
  STRONG: 'verdict-strong',
  GOOD: 'verdict-good',
  AVERAGE: 'verdict-average',
  WEAK: 'verdict-weak',
};

const statusOptions = ['new', 'shortlisted', 'interviewing', 'offered', 'rejected'];

const statusColors = {
  new: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
  shortlisted: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  interviewing: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  offered: 'bg-success-500/20 text-success-400 border-success-500/30',
  rejected: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
};

function CandidateSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="skeleton h-8 w-32 mb-6 rounded-lg" />
      <div className="glass-card p-6 mb-6">
        <div className="space-y-4">
          <div className="skeleton h-8 w-1/2 rounded-lg" />
          <div className="skeleton h-5 w-1/3 rounded-lg" />
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagSaving, setTagSaving] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await axios.get(`/api/candidates/${id}`);
      setCandidate(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await axios.patch(`/api/candidates/${id}/status`, { status: newStatus });
      setCandidate((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <CandidateSkeleton />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Candidate</h3>
          <p className="text-surface-400 text-sm mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const scores = candidate?.scores || {};
  const verdict = candidate?.verdict || 'AVERAGE';
  const screening = candidate || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Candidate Header */}
      <div className="glass-card p-6 mb-6 animate-fade-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary-500/10 rounded-full blur-[50px]" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{candidate.name}</h1>
              {candidate.email && (
                <p className="text-surface-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {candidate.email}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Verdict Badge */}
              <span className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl border ${verdictStyles[verdict] || verdictStyles.AVERAGE}`}>
                {verdict}
              </span>

              {/* Status Dropdown */}
              {isAdminOrHR && (
                <div className="relative">
                  <select
                    value={candidate.status || 'new'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s} className="bg-surface-800 text-white">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              )}

              {/* Quick actions */}
              {isAdminOrHR && (
                <>
                  {['interviewing', 'shortlisted'].includes(candidate.status) && (
                    <button onClick={() => navigate(`/interviews?candidate=${id}`)}
                      className="text-xs px-3 py-2 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Schedule Interview
                    </button>
                  )}
                  {['interviewing', 'offered'].includes(candidate.status) && (
                    <button onClick={() => navigate(`/offers?candidate=${id}`)}
                      className="text-xs px-3 py-2 rounded-xl bg-success-500/20 text-success-400 border border-success-500/30 hover:bg-success-500/30 transition-all flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      Create Offer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <ScoreCard scores={scores} />
      </div>

      {/* Summary */}
      {screening.summary && (
        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            AI Summary
          </h2>
          <p className="text-surface-300 text-sm leading-relaxed">{screening.summary}</p>
        </div>
      )}

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        {screening.strengths && screening.strengths.length > 0 && (
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-success-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              Strengths
            </h2>
            <ul className="space-y-2">
              {screening.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-400 mt-1.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {screening.gaps && screening.gaps.length > 0 && (
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-danger-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              Gaps
            </h2>
            <ul className="space-y-2">
              {screening.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger-400 mt-1.5 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Top Skills */}
      {screening.topSkills && screening.topSkills.length > 0 && (
        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-lg font-semibold mb-3">Top Skills</h2>
          <div className="flex flex-wrap gap-2">
            {screening.topSkills.map((skill, i) => (
              <span
                key={i}
                className="text-sm px-3 py-1.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20 hover:bg-primary-500/25 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '425ms' }}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Tags
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {(candidate.tags || []).map((tag, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20">
              {tag}
              {isAdminOrHR && (
                <button onClick={async () => {
                  const newTags = (candidate.tags || []).filter((_, j) => j !== i);
                  try { setTagSaving(true); await axios.patch(`/api/tags/candidate/${id}`, { tags: newTags }); setCandidate(p => ({ ...p, tags: newTags })); } catch {} finally { setTagSaving(false); }
                }} className="hover:text-white transition-colors ml-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </span>
          ))}
          {(candidate.tags || []).length === 0 && <span className="text-xs text-surface-500">No tags</span>}
        </div>
        {isAdminOrHR && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!tagInput.trim()) return;
            const newTags = [...(candidate.tags || []), tagInput.trim()];
            try { setTagSaving(true); await axios.patch(`/api/tags/candidate/${id}`, { tags: newTags }); setCandidate(p => ({ ...p, tags: newTags })); setTagInput(''); } catch {} finally { setTagSaving(false); }
          }} className="flex gap-2">
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <button type="submit" disabled={tagSaving || !tagInput.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all disabled:opacity-50">
              Add
            </button>
          </form>
        )}
      </div>

      {/* Interview Questions */}
      {screening.interviewQuestions && screening.interviewQuestions.length > 0 && (
        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Suggested Interview Questions
          </h2>
          <ol className="space-y-3">
            {screening.interviewQuestions.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-surface-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-surface-400">
                  {i + 1}
                </span>
                <span className="pt-0.5">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommendation */}
      {screening.recommendation && (
        <div className="glass-card p-6 mb-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            Recommendation
          </h2>
          <p className="text-surface-300 text-sm leading-relaxed">{screening.recommendation}</p>
        </div>
      )}

      {/* Notes Timeline */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '525ms' }}>
        <NotesTimeline candidateId={id} />
      </div>

      {/* Email Panel */}
      {isAdminOrHR && (
        <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
          <EmailPanel candidateId={id} candidateName={candidate.name} initialDrafts={candidate.emailDrafts} />
        </div>
      )}
    </div>
  );
}
