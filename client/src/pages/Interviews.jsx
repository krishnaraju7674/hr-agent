import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';

const typeColors = {
  phone: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  video: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  onsite: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  technical: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  hr: 'bg-success-500/20 text-success-400 border-success-500/30',
};

const statusColors = {
  scheduled: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
  confirmed: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  completed: 'bg-success-500/20 text-success-400 border-success-500/30',
  cancelled: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  rescheduled: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
};

function ScheduleModal({ isOpen, onClose, onScheduled }) {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ candidateId: '', jobId: '', type: 'video', scheduledAt: '', durationMinutes: 60, location: '', meetingLink: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/jobs').then(r => setJobs(r.data)).catch(() => {});
      axios.get('/api/candidates/export', { responseType: 'text' }).catch(() => {});
      fetchCandidates();
    }
  }, [isOpen]);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('/api/analytics/overview');
      const jobsWithCandidates = await Promise.all(
        (await axios.get('/api/jobs')).data.map(async (j) => {
          const detail = await axios.get(`/api/jobs/${j._id}`);
          return detail.data.candidates || [];
        })
      );
      setCandidates(jobsWithCandidates.flat().filter(c => c.status !== 'rejected' && c.status !== 'offered'));
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/interviews', form);
      onScheduled();
      onClose();
      setForm({ candidateId: '', jobId: '', type: 'video', scheduledAt: '', durationMinutes: 60, location: '', meetingLink: '', notes: '' });
    } catch (err) {
      console.error('Failed to schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date();
  const minDate = today.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Schedule Interview</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Candidate</label>
            <select required value={form.candidateId} onChange={e => setForm({ ...form, candidateId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value="" className="bg-surface-800">Select candidate...</option>
              {candidates.map(c => (
                <option key={c._id} value={c._id} className="bg-surface-800">{c.name} {c.email ? `(${c.email})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Position</label>
            <select required value={form.jobId} onChange={e => setForm({ ...form, jobId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value="" className="bg-surface-800">Select position...</option>
              {jobs.filter(j => j.status === 'open').map(j => (
                <option key={j._id} value={j._id} className="bg-surface-800">{j.title} - {j.department}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="phone" className="bg-surface-800">Phone</option>
                <option value="video" className="bg-surface-800">Video</option>
                <option value="onsite" className="bg-surface-800">On-site</option>
                <option value="technical" className="bg-surface-800">Technical</option>
                <option value="hr" className="bg-surface-800">HR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Duration (min)</label>
              <input type="number" min="15" step="15" value={form.durationMinutes}
                onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Date & Time</label>
            <input type="datetime-local" required value={form.scheduledAt} min={minDate}
              onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Location / Meeting Link</label>
            <input type="text" value={form.location} placeholder="Room 301" onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-2" />
            <input type="url" value={form.meetingLink} placeholder="https://meet.google.com/..." onChange={e => setForm({ ...form, meetingLink: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Notes</label>
            <textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedbackModal({ isOpen, onClose, interview, onFeedback }) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/interviews/${interview._id}/feedback`, { feedback, rating });
      onFeedback();
      onClose();
    } catch {} finally { setSubmitting(false); }
  };

  if (!isOpen || !interview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Interview Feedback</h2>
        <p className="text-sm text-surface-400 mb-4">{interview.candidate?.name || 'Candidate'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${n <= rating ? 'bg-warning-500/30 text-warning-400 border-warning-500/30' : 'bg-white/5 text-surface-400 border-white/10'} border`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Feedback Notes</label>
            <textarea rows="4" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="How did the interview go? Strengths, concerns, next steps..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Saving...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Interviews() {
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSchedule, setShowSchedule] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const fetchInterviews = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axios.get('/api/interviews', { params });
      setInterviews(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try { await axios.patch(`/api/interviews/${id}`, { status }); fetchInterviews(); } catch {}
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this interview?')) return;
    try { await axios.delete(`/api/interviews/${id}`); fetchInterviews(); } catch {}
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (d) => {
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Interviews</h1>
          <p className="text-surface-400 text-sm mt-1">Schedule and manage candidate interviews</p>
        </div>
        {isAdminOrHR && (
          <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Schedule Interview
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
              filter === s ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'bg-white/5 text-surface-400 border-white/10 hover:bg-white/[0.08]'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {interviews.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">No interviews found</h3>
          <p className="text-surface-400 text-sm mb-4">
            {filter === 'all' ? 'Schedule your first interview to get started' : `No interviews with status "${filter}"`}
          </p>
          {filter === 'all' && isAdminOrHR && (
            <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm">Schedule Interview</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <div key={iv._id} className="glass-card p-4 hover:bg-white/[0.06] transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{iv.candidate?.name || 'Unknown'}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColors[iv.type] || typeColors.video}`}>
                      {iv.type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[iv.status] || statusColors.scheduled}`}>
                      {iv.status}
                    </span>
                  </div>
                  <p className="text-sm text-surface-400 truncate">{iv.job?.title || 'Position'} — {iv.job?.department || ''}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {formatDate(iv.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(iv.scheduledAt)} ({iv.durationMinutes}min)
                    </span>
                    {iv.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {iv.location}
                      </span>
                    )}
                    {iv.notes && <span className="text-surface-600 italic truncate max-w-[200px]">{iv.notes}</span>}
                  </div>
                </div>

                {isAdminOrHR && iv.status !== 'completed' && iv.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {iv.status === 'scheduled' && (
                      <button onClick={() => handleStatusChange(iv._id, 'confirmed')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all">
                        Confirm
                      </button>
                    )}
                    {iv.status === 'confirmed' && (
                      <button onClick={() => setFeedbackTarget(iv)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-success-500/20 text-success-400 border border-success-500/30 hover:bg-success-500/30 transition-all">
                        Add Feedback
                      </button>
                    )}
                    <button onClick={() => handleCancel(iv._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-danger-500/20 text-danger-400 border border-danger-500/30 hover:bg-danger-500/30 transition-all">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleModal isOpen={showSchedule} onClose={() => setShowSchedule(false)} onScheduled={fetchInterviews} />
      <FeedbackModal isOpen={!!feedbackTarget} onClose={() => setFeedbackTarget(null)} interview={feedbackTarget} onFeedback={fetchInterviews} />
    </div>
  );
}
