import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const typeColors = {
  shortlist: 'bg-success-500/20 text-success-400 border-success-500/30',
  rejection: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  interview: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  offer: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  custom: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
};

function TemplateModal({ isOpen, onClose, template, onSaved }) {
  const [form, setForm] = useState({ name: '', type: 'custom', subject: '', body: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({ name: template.name, type: template.type, subject: template.subject, body: template.body });
    } else {
      setForm({ name: '', type: 'custom', subject: '', body: '' });
    }
  }, [template, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (template) {
        await axios.patch(`/api/templates/${template._id}`, form);
      } else {
        await axios.post('/api/templates', form);
      }
      onSaved();
      onClose();
    } catch {} finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{template ? 'Edit Template' : 'Create Template'}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Template Name</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="shortlist" className="bg-surface-800">Shortlist</option>
                <option value="rejection" className="bg-surface-800">Rejection</option>
                <option value="interview" className="bg-surface-800">Interview</option>
                <option value="offer" className="bg-surface-800">Offer</option>
                <option value="custom" className="bg-surface-800">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Subject</label>
            <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Body</label>
            <p className="text-[10px] text-surface-500 mb-2">Use {'{candidate_name}'}, {'{job_title}'}, {'{company_name}'} as variables</p>
            <textarea required rows="10" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try { await axios.delete(`/api/templates/${id}`); fetchTemplates(); } catch {}
  };

  const filtered = filter === 'all' ? templates : templates.filter(t => t.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Email Templates</h1>
          <p className="text-surface-400 text-sm mt-1">Manage reusable email templates</p>
        </div>
        {isAdminOrHR && (
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Template
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'shortlist', 'rejection', 'interview', 'offer', 'custom'].map(s => (
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
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-surface-400 text-sm">Create your first email template</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t._id} className="glass-card p-4 hover:bg-white/[0.06] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColors[t.type] || typeColors.custom}`}>
                      {t.type}
                    </span>
                    {t.isDefault && <span className="text-[10px] font-medium text-surface-500 bg-white/5 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-sm text-surface-400 truncate">{t.subject}</p>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-2 font-mono">{t.body}</p>
                </div>
                {isAdminOrHR && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditing(t); setShowModal(true); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-surface-300 border border-white/10 hover:bg-white/10 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-danger-500/20 text-danger-400 border border-danger-500/30 hover:bg-danger-500/30 transition-all">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateModal isOpen={showModal} onClose={() => setShowModal(false)} template={editing} onSaved={fetchTemplates} />
    </div>
  );
}
