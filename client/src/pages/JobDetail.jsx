import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ResumeUploader from '../components/ResumeUploader';
import CandidateTable from '../components/CandidateTable';
import ApplyModal from '../components/ApplyModal';
import axios from 'axios';

const statusColors = {
  open: 'bg-success-500/20 text-success-400 border-success-500/30',
  closed: 'bg-surface-500/20 text-surface-400 border-surface-500/30',
  paused: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  draft: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
};

function JobSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="skeleton h-8 w-32 mb-6 rounded-lg" />
      <div className="glass-card p-6 mb-6">
        <div className="space-y-4">
          <div className="skeleton h-8 w-2/3 rounded-lg" />
          <div className="skeleton h-5 w-1/4 rounded-lg" />
          <div className="skeleton h-20 w-full rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-6 w-32 rounded-full" />
            <div className="skeleton h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="skeleton h-6 w-40 mb-4 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-14 w-full mb-2 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApply, setShowApply] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`/api/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleScreeningComplete = () => {
    fetchJob();
  };

  if (loading) return <JobSkeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Job</h3>
          <p className="text-surface-400 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const candidates = job?.candidates || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* Job Header */}
      <div className="glass-card p-6 mb-6 animate-fade-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary-500/10 rounded-full blur-[50px]" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
              <p className="text-surface-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0-.75 3.75m0 0-.75 3.75M17.25 7.5l-.75 3.75m0 0 .75 3.75M17.25 7.5h1.5" />
                </svg>
                {job.department}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              {job.status === 'open' && (
                <button onClick={() => setShowApply(true)} className="text-xs font-semibold px-4 py-1.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 hover:scale-105 transition-all flex items-center gap-1.5 active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  Apply Now
                </button>
              )}
              <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${statusColors[job.status] || statusColors.open}`}>
                {job.status || 'open'}
              </span>
            </div>
          </div>

          {job.description && (
            <p className="text-surface-300 text-sm leading-relaxed mb-4">{job.description}</p>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Uploader */}
      {isAdminOrHR && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <ResumeUploader jobId={id} onComplete={handleScreeningComplete} />
        </div>
      )}

      {/* Candidates Table */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CandidateTable candidates={candidates} jobId={id} />
      </div>

      {/* Apply Modal */}
      <ApplyModal isOpen={showApply} onClose={() => setShowApply(false)} job={job} />
    </div>
  );
}
