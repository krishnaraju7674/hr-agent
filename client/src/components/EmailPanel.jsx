import { useState, useEffect } from 'react';
import axios from 'axios';

const emailTypes = [
  {
    type: 'shortlist',
    label: 'Draft Shortlist',
    icon: '⭐',
    description: 'Congratulate and invite to next round',
    gradient: 'from-primary-500 to-primary-600',
  },
  {
    type: 'interview',
    label: 'Draft Interview',
    icon: '📅',
    description: 'Schedule an interview invitation',
    gradient: 'from-warning-500 to-warning-600',
  },
  {
    type: 'rejection',
    label: 'Draft Rejection',
    icon: '📝',
    description: 'Polite rejection with feedback',
    gradient: 'from-surface-500 to-surface-600',
  },
];

export default function EmailPanel({ candidateId, candidateName, initialDrafts = [] }) {
  const [drafts, setDrafts] = useState(() =>
    (initialDrafts || []).map((d) => ({
      type: d.type,
      content: d.body,
      timestamp: new Date(d.createdAt).toLocaleTimeString(),
    }))
  );
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateDrafting, setTemplateDrafting] = useState(false);

  useEffect(() => {
    axios.get('/api/templates').then(res => setTemplates(res.data || [])).catch(() => {});
  }, []);

  const handleDraft = async (type) => {
    setLoading(type);
    setError('');
    try {
      const res = await axios.post('/api/email', {
        candidateId,
        type,
      });
      const draft = {
        type,
        content: res.data.email || res.data.content || res.data.body || res.data.emailBody || '',
        subject: res.data.subject || '',
        timestamp: new Date().toLocaleTimeString(),
      };
      setDrafts((prev) => [draft, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate email draft');
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        Email Drafts
        <span className="text-sm font-normal text-surface-400">for {candidateName}</span>
      </h2>

      {/* Draft Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {emailTypes.map((et) => (
          <button
            key={et.type}
            onClick={() => handleDraft(et.type)}
            disabled={loading !== null}
            className="relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/15 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading === et.type && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface-900/80 backdrop-blur-sm">
                <div className="w-5 h-5 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${et.gradient} flex items-center justify-center text-lg shadow-sm`}>
                {et.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">{et.label}</p>
                <p className="text-xs text-surface-500">{et.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm mb-4 animate-fade-in">
          {error}
        </div>
      )}

      {/* Template Quick Insert */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
          <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50">
            <option value="" className="bg-surface-800">Use a saved template...</option>
            {templates.map(t => (
              <option key={t._id} value={t._id} className="bg-surface-800">{t.name} ({t.type})</option>
            ))}
          </select>
          <button onClick={async () => {
            if (!selectedTemplate) return;
            setTemplateDrafting(true);
            try {
              const t = templates.find(t => t._id === selectedTemplate);
              if (t) {
                const content = t.body.replace(/\{candidate_name\}/g, candidateName);
                setDrafts(prev => [{ type: t.type, content, subject: t.subject, timestamp: new Date().toLocaleTimeString() }, ...prev]);
                setSelectedTemplate('');
              }
            } catch {} finally { setTemplateDrafting(false); }
          }} disabled={!selectedTemplate || templateDrafting}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30 transition-all disabled:opacity-50 flex-shrink-0">
            {templateDrafting ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {/* Draft History */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Draft History</p>
          {drafts.map((draft, i) => {
            const et = emailTypes.find((e) => e.type === draft.type);
            const fullText = draft.subject
              ? `Subject: ${draft.subject}\n\n${draft.content}`
              : draft.content;

            return (
              <div key={i} className="glass-card-light p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{et?.icon}</span>
                    <span className="text-sm font-medium capitalize">{draft.type} Email</span>
                    <span className="text-xs text-surface-500">{draft.timestamp}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(fullText, i)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                  >
                    {copiedIndex === i ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-success-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        <span className="text-surface-400">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                {draft.subject && (
                  <p className="text-sm font-medium text-white mb-2">
                    <span className="text-surface-500">Subject:</span> {draft.subject}
                  </p>
                )}
                <div className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap bg-white/[0.03] rounded-lg p-3 border border-white/[0.04] max-h-64 overflow-y-auto">
                  {draft.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
