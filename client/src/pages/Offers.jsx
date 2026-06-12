import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const statusColors = {
  draft: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
  sent: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  accepted: 'bg-success-500/20 text-success-400 border-success-500/30',
  declined: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  negotiating: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  withdrawn: 'bg-surface-600/20 text-surface-500 border-surface-600/30',
};

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };

function OfferModal({ isOpen, onClose, onSaved }) {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ candidateId: '', jobId: '', salary: '', currency: 'USD', startDate: '', benefits: '', terms: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/jobs').then(r => setJobs(r.data)).catch(() => {});
      (async () => {
        try {
          const jobsRes = await axios.get('/api/jobs');
          const allCands = [];
          for (const j of jobsRes.data) {
            try { const d = await axios.get(`/api/jobs/${j._id}`); allCands.push(...(d.data.candidates || [])); } catch {}
          }
          setCandidates(allCands.filter(c => c.status === 'interviewing' || c.status === 'shortlisted'));
        } catch {}
      })();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/offers', {
        ...form,
        salary: parseFloat(form.salary) || undefined,
        benefits: form.benefits.split('\n').filter(Boolean),
      });
      onSaved();
      onClose();
      setForm({ candidateId: '', jobId: '', salary: '', currency: 'USD', startDate: '', benefits: '', terms: '', notes: '' });
    } catch {} finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create Offer</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Candidate</label>
            <select required value={form.candidateId} onChange={e => setForm({ ...form, candidateId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value="" className="bg-surface-800">Select candidate...</option>
              {candidates.map(c => (
                <option key={c._id} value={c._id} className="bg-surface-800">{c.name} ({c.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Position</label>
            <select required value={form.jobId} onChange={e => setForm({ ...form, jobId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
              <option value="" className="bg-surface-800">Select position...</option>
              {jobs.map(j => (
                <option key={j._id} value={j._id} className="bg-surface-800">{j.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Salary</label>
              <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Currency</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                {Object.keys(currencySymbols).map(c => (
                  <option key={c} value={c} className="bg-surface-800">{c} ({currencySymbols[c]})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Start Date</label>
            <input type="date" value={form.startDate} min={today} onChange={e => setForm({ ...form, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Benefits (one per line)</label>
            <textarea rows="3" value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="Health insurance&#10;Stock options&#10;Remote work"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Terms & Conditions</label>
            <textarea rows="3" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Notes</label>
            <textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Offers() {
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await axios.get('/api/offers', { params });
      setOffers(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOffers(); }, [filter]);

  const handleStatusUpdate = async (id, status) => {
    try { await axios.patch(`/api/offers/${id}`, { status }); fetchOffers(); } catch {}
  };

  const formatSalary = (salary, currency) => {
    if (!salary) return 'N/A';
    const sym = currencySymbols[currency] || '$';
    return `${sym}${salary.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Offers</h1>
          <p className="text-surface-400 text-sm mt-1">Manage candidate offers and acceptances</p>
        </div>
        {isAdminOrHR && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Offer
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'draft', 'sent', 'accepted', 'declined', 'negotiating', 'withdrawn'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
              filter === s ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'bg-white/5 text-surface-400 border-white/10 hover:bg-white/[0.08]'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : offers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">No offers found</h3>
          <p className="text-surface-400 text-sm">Create your first offer for a candidate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o._id} className="glass-card p-4 hover:bg-white/[0.06] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{o.candidate?.name || 'Unknown'}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[o.status] || statusColors.draft}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-sm text-surface-400">{o.job?.title || 'Position'} — {formatSalary(o.salary, o.currency)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                    {o.startDate && <span>Start: {new Date(o.startDate).toLocaleDateString()}</span>}
                    {o.sentAt && <span>Sent: {new Date(o.sentAt).toLocaleDateString()}</span>}
                    {o.respondedAt && <span>Response: {new Date(o.respondedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                {isAdminOrHR && o.status === 'draft' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleStatusUpdate(o._id, 'sent')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all">
                      Send
                    </button>
                    <button onClick={() => handleStatusUpdate(o._id, 'withdrawn')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-surface-500/20 text-surface-300 border border-surface-500/30 hover:bg-surface-500/30 transition-all">
                      Withdraw
                    </button>
                  </div>
                )}
                {isAdminOrHR && o.status === 'sent' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleStatusUpdate(o._id, 'accepted')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-success-500/20 text-success-400 border border-success-500/30 hover:bg-success-500/30 transition-all">
                      Accept
                    </button>
                    <button onClick={() => handleStatusUpdate(o._id, 'declined')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-danger-500/20 text-danger-400 border border-danger-500/30 hover:bg-danger-500/30 transition-all">
                      Decline
                    </button>
                    <button onClick={() => handleStatusUpdate(o._id, 'negotiating')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-warning-500/20 text-warning-400 border border-warning-500/30 hover:bg-warning-500/30 transition-all">
                      Negotiate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <OfferModal isOpen={showModal} onClose={() => setShowModal(false)} onSaved={fetchOffers} />
    </div>
  );
}
