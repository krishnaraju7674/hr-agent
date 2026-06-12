import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import PipelineChart from '../components/PipelineChart';
import EditJobModal from '../components/EditJobModal';
import AiAdvisor from '../components/AiAdvisor';
import ApplyModal from '../components/ApplyModal';
import ResumeUploader from '../components/ResumeUploader';
import CandidateComparison from '../components/CandidateComparison';
import axios from 'axios';

const statusColors = {
  open: 'bg-success-500/20 text-success-400 border-success-500/30',
  closed: 'bg-surface-500/20 text-surface-400 border-surface-500/30',
  paused: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  draft: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
};

const stageColors = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shortlisted: 'bg-success-500/20 text-success-400 border-success-500/30',
  interviewing: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  offered: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  rejected: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
};

const STAGES = ['new', 'shortlisted', 'interviewing', 'offered', 'rejected'];

function useRelativeTime(dateStr) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!dateStr) return setLabel('');
    const update = () => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return setLabel('Just now');
      if (mins < 60) return setLabel(`${mins}m ago`);
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return setLabel(`${hrs}h ago`);
      const days = Math.floor(hrs / 24);
      if (days < 7) return setLabel(`${days}d ago`);
      setLabel(new Date(dateStr).toLocaleDateString());
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [dateStr]);
  return label;
}

function TimeAgo({ date }) {
  const label = useRelativeTime(date);
  return <span>{label}</span>;
}

function AnimatedCounter({ value, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [value, duration]);
  return <span>{count}</span>;
}

function ProgressRing({ size = 56, stroke = 5, percent, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
    </div>
  );
}

function StatCardWidget({ icon, label, value, gradient, delay, subItems, onClick, trend, percent }) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`glass-card p-5 animate-slide-up cursor-pointer relative overflow-hidden transition-all duration-300 ${
        hover ? 'bg-white/[0.08] scale-[1.02] shadow-xl shadow-primary-500/10' : ''
      } ${expanded ? 'ring-1 ring-primary-500/30' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => { if (subItems) setExpanded((p) => !p); if (onClick) onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 ${hover ? 'opacity-10' : ''}`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg relative transition-transform duration-300 ${hover ? 'scale-110 rotate-3' : ''}`}>
          {icon}
          {percent !== undefined && (
            <div className="absolute -top-1.5 -right-1.5">
              <ProgressRing size={22} stroke={3} percent={percent} color="#34d399" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-bold text-white tabular-nums"><AnimatedCounter value={value} /></p>
            {trend !== undefined && (
              <span className={`text-xs font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                trend >= 0 ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={trend >= 0 ? 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18' : 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3'} />
                </svg>
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          <p className="text-sm text-surface-400">{label}</p>
        </div>
        {subItems && (
          <svg className={`w-4 h-4 text-surface-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </div>
      {expanded && subItems && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] animate-slide-up space-y-2 relative z-10">
          {subItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-surface-400">{item.label}</span>
              </div>
              <span className="font-medium text-white tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="glass-card p-5"><div className="flex items-center gap-4"><div className="skeleton w-12 h-12 rounded-xl" /><div className="space-y-2 flex-1"><div className="skeleton h-6 w-16" /><div className="skeleton h-4 w-24" /></div></div></div>;
}

function JobCardSkeleton() {
  return <div className="glass-card-light p-5"><div className="space-y-3"><div className="skeleton h-5 w-3/4" /><div className="skeleton h-4 w-1/2" /><div className="flex gap-2"><div className="skeleton h-6 w-16 rounded-full" /><div className="skeleton h-6 w-20 rounded-full" /></div></div></div>;
}

function CreateJobModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({ title: '', department: '', description: '', requirements: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const payload = { ...formData, requirements: formData.requirements.split('\n').map((r) => r.trim()).filter(Boolean) };
      const res = await axios.post('/api/jobs', payload);
      onCreated(res.data); onClose();
      setFormData({ title: '', department: '', description: '', requirements: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to create job'); } finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Job</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-surface-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-surface-300 mb-1.5">Job Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="e.g. Senior Frontend Engineer" required /></div>
          <div><label className="block text-sm font-medium text-surface-300 mb-1.5">Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input-field" placeholder="e.g. Engineering" required /></div>
          <div><label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none h-24" placeholder="Describe the role and responsibilities..." required /></div>
          <div><label className="block text-sm font-medium text-surface-300 mb-1.5">Requirements <span className="text-surface-500">(one per line)</span></label><textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} className="input-field resize-none h-28" placeholder={"5+ years of React experience\nTypeScript proficiency\nExperience with REST APIs"} required /></div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button><button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">{submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Job'}</button></div>
        </form>
      </div>
    </div>
  );
}

function QuickStageBtn({ candidateId, currentStage, onStageChange }) {
  const nextIdx = STAGES.indexOf(currentStage) + 1;
  const nextStage = STAGES[nextIdx];
  if (!nextStage || nextStage === 'rejected') return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); onStageChange(candidateId, nextStage); }} className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 hover:scale-105 transition-all whitespace-nowrap active:scale-95">
      → {nextStage}
    </button>
  );
}

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return debounced;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const go = () => setOnline(true);
    const go2 = () => setOnline(false);
    window.addEventListener('online', go); window.addEventListener('offline', go2);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', go2); };
  }, []);
  return online;
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="glass-card p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-surface-400 text-sm mb-4 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="glass-card p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-surface-400 text-sm mb-4">{message || 'Failed to load dashboard data'}</p>
      {onRetry && <button onClick={onRetry} className="btn-primary text-sm flex items-center gap-2 mx-auto"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>Retry</button>}
    </div>
  );
}

function Toast({ toasts, remove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border text-sm font-medium animate-slide-up flex items-center gap-3 min-w-[260px] ${
          t.type === 'success' ? 'bg-success-500/20 border-success-500/30 text-success-300' :
          t.type === 'error' ? 'bg-danger-500/20 border-danger-500/30 text-danger-300' :
          'bg-surface-800/90 border-white/10 text-white'
        }`}>
          <span className="text-lg">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-current/60 hover:text-current transition-colors text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdminOrHR } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const online = useOnlineStatus();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editJob, setEditJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [clock, setClock] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);
  const [viewingTab, setViewingTab] = useState('pipeline');
  const [selectedJob, setSelectedJob] = useState(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [compareJobId, setCompareJobId] = useState(null);
  const [batchUploadJobId, setBatchUploadJobId] = useState(null);
  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 250);

  const greetings = ['recruitment pipeline', 'hiring dashboard', 'candidate tracker', 'talent overview', 'recruitment hub'];

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const uc = () => setClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    uc(); const id = setInterval(uc, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => { fetchJobs(); const id = setInterval(fetchJobs, 30000); return () => clearInterval(id); }, []);
  useEffect(() => { fetchInterviews(); const id = setInterval(fetchInterviews, 60000); return () => clearInterval(id); }, []);
  useEffect(() => { const idx = setInterval(() => setGreetingIdx((i) => (i + 1) % greetings.length), 4000); return () => clearInterval(idx); }, []);
  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (searchParams.get('tab') === 'jobs') {
      setTimeout(() => document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  }, [searchParams]);

  const fetchJobs = useCallback(async () => {
    try { setError(null); const res = await axios.get('/api/jobs'); setJobs(res.data.jobs || res.data || []); } catch (err) { setError(err.message || 'Failed to fetch data'); } finally { setLoading(false); }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try { const res = await axios.get('/api/interviews/upcoming'); setUpcomingInterviews(res.data || []); } catch {}
  }, []);

  const handleJobCreated = useCallback((newJob) => { setJobs((prev) => [newJob, ...prev]); addToast('Job created successfully', 'success'); }, []);
  const handleJobUpdated = useCallback((updatedJob) => { setJobs((prev) => prev.map((j) => (j._id === updatedJob._id ? updatedJob : j))); setEditJob(null); addToast('Job updated', 'success'); }, []);
  const handleJobDeleted = useCallback(async (jobId) => { try { await axios.delete(`/api/jobs/${jobId}`); setJobs((prev) => prev.filter((j) => j._id !== jobId)); setDeleteConfirm(null); addToast('Job deleted', 'success'); } catch (err) { addToast('Failed to delete job', 'error'); } }, []);
  const handleStageChange = useCallback(async (candidateId, newStage) => {
    try { await axios.patch(`/api/candidates/${candidateId}/status`, { status: newStage }); fetchJobs(); addToast(`Candidate moved to ${newStage}`, 'success'); } catch (err) { addToast('Stage update failed', 'error'); }
  }, [fetchJobs]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {}); }
    else { document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {}); }
  };

  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const allCandidates = useMemo(() => jobs.flatMap((j) => j.candidates || []), [jobs]);
  const stageCounts = useMemo(() => ({
    new: allCandidates.filter((c) => c.status === 'new').length,
    shortlisted: allCandidates.filter((c) => c.status === 'shortlisted').length,
    interviewing: allCandidates.filter((c) => c.status === 'interviewing').length,
    offered: allCandidates.filter((c) => c.status === 'offered').length,
    rejected: allCandidates.filter((c) => c.status === 'rejected').length,
  }), [allCandidates]);
  const pipelineData = stageCounts;
  const totalCandidates = allCandidates.length;
  const shortlisted = stageCounts.shortlisted;
  const interviewing = stageCounts.interviewing;
  const conversionRate = totalCandidates > 0 ? Math.round((shortlisted / totalCandidates) * 100) : 0;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const openJobsList = useMemo(() => jobs.filter((j) => j.status === 'open'), [jobs]);
  const filteredJobs = useMemo(() => jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (debouncedSearch && !job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) && !job.department.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    return true;
  }), [jobs, statusFilter, debouncedSearch]);

  const recentCandidates = useMemo(() => jobs
    .flatMap((j) => (j.candidates || []).map((c) => ({ ...c, jobTitle: j.title, jobId: j._id })))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 10), [jobs]);

  const pendingApplications = useMemo(() => allCandidates.filter((c) => c.status === 'new').slice(0, 20), [allCandidates]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card p-6 mb-8"><div className="skeleton h-8 w-64 mb-2" /><div className="skeleton h-4 w-48" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><ErrorState message={error} onRetry={fetchJobs} /></div>;
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${fullscreen ? 'pt-4' : ''}`}>
      {!online && (
        <div className="mb-4 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 text-warning-400 text-sm flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          You are offline. Data may be stale.
        </div>
      )}

      {/* Welcome */}
      <div className="mb-8 animate-fade-in">
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/10 rounded-full blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-700/10 rounded-full blur-[50px]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm text-surface-500 font-medium">{timeGreeting}</span>
                <span className="w-2 h-2 rounded-full bg-success-500" />
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isAdminOrHR ? 'bg-primary-500/20 text-primary-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {user?.role || 'viewer'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">{user?.name}</span>
              </h1>
              <p className="text-surface-400 h-5">
                Here's your{' '}
                <span key={greetingIdx} className="text-primary-400 font-medium animate-fade-in inline-block">{greetings[greetingIdx]}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-surface-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {clock}
              </div>
              <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-surface-400 hover:text-white hover:bg-white/10 transition-all" title="Toggle fullscreen">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {fullscreen
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCardWidget icon="💼" label="Total Jobs" value={totalJobs} gradient="from-primary-500/20 to-primary-600/20" delay={0} percent={totalJobs > 0 ? 100 : 0}
          subItems={[{ label: 'Open positions', value: openJobs, color: '#22c55e' }, { label: 'Closed / Paused', value: totalJobs - openJobs, color: '#6b7280' }]}
          onClick={() => document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' })} />
        <StatCardWidget icon="👥" label="Total Candidates" value={totalCandidates} gradient="from-blue-500/20 to-blue-600/20" delay={100}
          subItems={[
            { label: 'New applications', value: stageCounts.new, color: '#3b82f6' }, { label: 'Shortlisted', value: shortlisted, color: '#22c55e' },
            { label: 'Interviewing', value: interviewing, color: '#eab308' }, { label: 'Offers', value: stageCounts.offered, color: '#6366f1' },
            { label: 'Rejected', value: stageCounts.rejected, color: '#ef4444' },
          ]} />
        <StatCardWidget icon="⭐" label="Shortlisted" value={shortlisted} gradient="from-success-500/20 to-success-600/20" delay={200} percent={conversionRate}
          subItems={[{ label: 'Conversion rate', value: `${conversionRate}%`, color: '#22c55e' }, { label: 'In pipeline', value: totalCandidates - shortlisted, color: '#6b7280' }]} />
        <StatCardWidget icon="📅" label="Interviews" value={interviewing} gradient="from-warning-500/20 to-warning-600/20" delay={300}
          subItems={[{ label: 'Scheduled interviews', value: interviewing, color: '#eab308' }, { label: 'Offers extended', value: stageCounts.offered, color: '#6366f1' }]} />
      </div>

      {/* Pipeline */}
      {totalCandidates > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="lg:col-span-2"><PipelineChart data={pipelineData} total={totalCandidates} /></div>
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" /> Recent Activity
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {recentCandidates.length === 0 && <p className="text-xs text-surface-500 py-4 text-center">No recent activity</p>}
              {recentCandidates.map((c) => (
                <button key={c._id} onClick={() => navigate(`/candidates/${c._id}`)} className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    c.status === 'new' ? 'bg-blue-500' : c.status === 'shortlisted' ? 'bg-success-500' : c.status === 'interviewing' ? 'bg-warning-500' : c.status === 'offered' ? 'bg-primary-500' : 'bg-surface-500'
                  }`}>{c.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate group-hover:text-primary-300 transition-colors">{c.name}</p>
                    <p className="text-[10px] text-surface-500 truncate">{c.jobTitle}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${stageColors[c.status] || stageColors.new}`}>{c.status}</span>
                      <span className="text-[9px] text-surface-500"><TimeAgo date={c.createdAt} /></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Advisor */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '175ms' }}>
        <AiAdvisor onAction={(type) => {
          if (type === 'create_job') setShowCreateModal(true);
          if (type === 'review_candidates') document.getElementById('candidates-section')?.scrollIntoView({ behavior: 'smooth' });
          if (type === 'schedule_interview') navigate('/analytics');
        }} />
      </div>

      {/* Upcoming Interviews */}
      <div className="glass-card p-5 mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Upcoming Interviews
          <button onClick={() => navigate('/interviews')} className="ml-auto text-xs text-primary-400 hover:text-primary-300 transition-colors">View all</button>
        </h2>
        <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
          {upcomingInterviews.length === 0 && <p className="text-xs text-surface-500 py-3 text-center">No upcoming interviews</p>}
          {upcomingInterviews.map((iv) => (
            <div key={iv._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center text-xs font-bold text-primary-300 border border-primary-500/20 flex-shrink-0">
                {new Date(iv.scheduledAt).getDate()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{iv.candidate?.name || 'Unknown'}</p>
                <p className="text-[10px] text-surface-500 truncate">{iv.job?.title || 'Position'} — {iv.type}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-medium text-surface-300">
                  {new Date(iv.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[9px] text-surface-500">{iv.durationMinutes}min</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Switcher: Apply for Jobs / Manage Pipeline */}
      <div className="mb-6 flex items-center gap-3 border-b border-white/[0.06] pb-3">
        <button onClick={() => setViewingTab('apply')} className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${viewingTab === 'apply' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-white'}`}>
          🎯 Apply for Jobs
        </button>
        <button onClick={() => setViewingTab('pipeline')} className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${viewingTab === 'pipeline' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-white'}`}>
          📋 Manage Pipeline {pendingApplications.length > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-500/20 text-danger-400">{pendingApplications.length}</span>}
        </button>
        <button onClick={() => setViewingTab('jobs')} className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${viewingTab === 'jobs' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-white'}`}>
          💼 All Jobs
        </button>
      </div>

      {/* Tab: Apply for Jobs */}
      {viewingTab === 'apply' && (
        <div className="mb-8 animate-fade-in">
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-1">Open Positions</h2>
            <p className="text-sm text-surface-400">Browse open positions and submit your application. Our AI will analyze your resume instantly.</p>
          </div>
          {openJobsList.length === 0 ? (
            <EmptyState icon="📋" title="No open positions" description="There are no open positions right now. Check back later!" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openJobsList.map((job) => (
                <div key={job._id} className="glass-card-light p-5 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 group">
                  <h3 className="font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">{job.title}</h3>
                  <p className="text-sm text-surface-400 mb-3">{job.department}</p>
                  <p className="text-xs text-surface-500 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {job.requirements?.slice(0, 3).map((req, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">{req}</span>
                    ))}
                    {(job.requirements?.length || 0) > 3 && <span className="text-[9px] text-surface-500">+{job.requirements.length - 3} more</span>}
                  </div>
                  <button onClick={() => setApplyJob(job)} className="w-full text-sm font-medium py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white hover:from-primary-400 hover:to-primary-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pipeline Management (HR focused) */}
      {viewingTab === 'pipeline' && (
        <div id="candidates-section" className="mb-8 animate-fade-in">
          {pendingApplications.length > 0 && (
            <div className="glass-card p-5 mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                Pending Applications
                <span className="text-xs font-normal text-surface-500 bg-white/5 px-2 py-0.5 rounded-full">{pendingApplications.length}</span>
              </h2>
              <div className="space-y-2">
                {pendingApplications.map((c) => (
                  <div key={c._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                    <div className="flex items-center gap-3" onClick={() => navigate(`/candidates/${c._id}`)}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">{c.name?.charAt(0) || '?'}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-[10px] text-surface-500">{c.jobId?.title || 'Unknown job'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdminOrHR && (
                        <>
                          <QuickStageBtn candidateId={c._id} currentStage={c.status} onStageChange={handleStageChange} />
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/candidates/${c._id}`); }} className="text-xs px-3 py-1.5 rounded-lg bg-surface-700/50 text-surface-300 border border-white/10 hover:bg-white/10 transition-all">
                            Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pendingApplications.length === 0 && (
            <div className="glass-card p-5 mb-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-sm font-semibold text-surface-300">All caught up!</h3>
              <p className="text-xs text-surface-500">No pending applications to review</p>
            </div>
          )}

          {/* Pipeline Chart */}
          {totalCandidates > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Pipeline Overview</h2>
              <div className="space-y-3">
                {STAGES.map((stage) => {
                  const count = stageCounts[stage] || 0;
                  const pct = totalCandidates > 0 ? (count / totalCandidates) * 100 : 0;
                  const colors = { new: '#3b82f6', shortlisted: '#22c55e', interviewing: '#eab308', offered: '#6366f1', rejected: '#ef4444' };
                  const labels = { new: 'New Applications', shortlisted: 'Shortlisted', interviewing: 'Interviewing', offered: 'Offers', rejected: 'Rejected' };
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs text-surface-400 w-28 flex-shrink-0">{labels[stage]}</span>
                      <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors[stage] }} />
                      </div>
                      <span className="text-xs font-medium text-white w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: All Jobs */}
      {viewingTab === 'jobs' && (
        <div id="jobs-section" className="animate-fade-in">
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isAdminOrHR && <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 text-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Create Job</button>}
            <button onClick={() => navigate('/analytics')} className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-1.5">📊 Analytics</button>
            <button onClick={() => searchRef.current?.focus()} className="text-xs font-medium px-3 py-2 rounded-lg bg-surface-700/50 text-surface-300 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5"><kbd className="text-[9px] px-1 py-0.5 rounded bg-white/10 font-mono">⌘K</kbd> Search</button>
            <button onClick={fetchJobs} className="text-xs font-medium px-3 py-2 rounded-lg bg-surface-700/50 text-surface-300 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5">🔄 Refresh</button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input ref={searchRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search jobs..." className="input-field pl-10 pr-10" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'open', 'closed', 'paused', 'draft'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${statusFilter === s ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'bg-transparent text-surface-400 border-white/10 hover:border-white/20 hover:text-white'}`}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1 text-[10px] opacity-60">({jobs.filter((j) => s === 'all' || j.status === s).length})</span>
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState icon="📋" title={searchTerm ? 'No matching jobs' : 'No jobs yet'} description={searchTerm ? 'Try a different search' : 'Create your first job posting'} action={!searchTerm && isAdminOrHR ? <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">Create Job</button> : null} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => {
                const jobCandidates = job.candidates || [];
                return (
                  <div key={job._id} className="relative group animate-slide-up">
                    <button onClick={() => navigate(`/jobs/${job._id}`)} className="w-full glass-card-light p-5 text-left hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 group/card active:scale-[0.98]">
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-700/5 pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-white group-hover/card:text-primary-300 transition-colors line-clamp-1">{job.title}</h3>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${statusColors[job.status] || statusColors.open}`}>{job.status || 'open'}</span>
                        </div>
                        <p className="text-sm text-surface-400 mb-3">{job.department}</p>
                        <div className="flex items-center gap-4 text-xs text-surface-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                            {jobCandidates.length}
                          </span>
                          {job.requirements && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>{job.requirements.length} req</span>}
                        </div>
                      </div>
                    </button>
                    {isAdminOrHR && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={(e) => { e.stopPropagation(); setBatchUploadJobId(job._id); }} className="p-1.5 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-white/10 text-surface-400 hover:text-primary-300 hover:bg-primary-500/10 transition-all active:scale-90" title="Upload Resumes"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); setCompareJobId(job._id); }} className="p-1.5 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-white/10 text-surface-400 hover:text-success-300 hover:bg-success-500/10 transition-all active:scale-90" title="Compare Candidates"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditJob(job); }} className="p-1.5 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-white/10 text-surface-400 hover:text-white hover:bg-white/10 transition-all active:scale-90" title="Edit"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(job._id); }} className="p-1.5 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-white/10 text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all active:scale-90" title="Delete"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-6 z-50 p-3 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 hover:bg-primary-500/30 hover:scale-110 transition-all shadow-lg backdrop-blur-sm active:scale-90" title="Scroll to top">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
      </button>

      {/* Modals */}
      <CreateJobModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={handleJobCreated} />
      {editJob && <EditJobModal job={editJob} onClose={() => setEditJob(null)} onUpdated={handleJobUpdated} />}
      <CandidateComparison isOpen={!!compareJobId} onClose={() => setCompareJobId(null)} jobId={compareJobId} />
      {batchUploadJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBatchUploadJobId(null)}>
          <div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Resumes</h2>
              <button onClick={() => setBatchUploadJobId(null)} className="text-surface-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <ResumeUploader jobId={batchUploadJobId} onComplete={() => { setBatchUploadJobId(null); fetchJobs(); }} />
          </div>
        </div>
      )}
      <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm glass-card p-6 animate-slide-up text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Delete Job?</h3>
            <p className="text-sm text-surface-400 mb-6">This also removes all associated candidates. Cannot be undone.</p>
            <div className="flex gap-3"><button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button><button onClick={() => handleJobDeleted(deleteConfirm)} className="btn-danger flex-1 text-sm">Delete</button></div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="fixed bottom-6 left-6 z-50">
        <div className="text-[10px] text-surface-500 bg-surface-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">⌘K</kbd> Search</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">F</kbd> Fullscreen</span>
        </div>
      </div>
    </div>
  );
}
