import { useState, useRef } from 'react';
import axios from 'axios';

export default function ApplyModal({ isOpen, onClose, job }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('jobId', job._id);
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      if (resumeFile) fd.append('resume', resumeFile);

      const res = await axios.post('/api/applications/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Application failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setForm({ name: '', email: '', phone: '' });
    setResumeFile(null);
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg glass-card p-6 animate-slide-up overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-[50px]" />

        {/* Step 1: Intro */}
        {step === 1 && (
          <div className="relative text-center py-4">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-2">Apply for {job?.title}</h2>
            <p className="text-sm text-surface-400 mb-2">{job?.department}</p>
            <p className="text-xs text-surface-500 mb-6 max-w-sm mx-auto">
              Submit your application and our AI will analyze your resume against the job requirements for instant feedback.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleClose} className="btn-secondary text-sm px-6">Cancel</button>
              <button onClick={() => setStep(2)} className="btn-primary text-sm px-6">Continue</button>
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Application</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-surface-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1-555-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Resume (PDF, DOCX)</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-primary-500/30 bg-white/5 hover:bg-white/[0.07] transition-all text-left"
                >
                  {resumeFile ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-white">{resumeFile.name}</p>
                        <p className="text-[10px] text-surface-500">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); }} className="ml-auto text-surface-400 hover:text-danger-400 text-xs">Remove</button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl mb-2 block">📎</span>
                      <p className="text-sm text-surface-400">Click to upload resume</p>
                      <p className="text-[10px] text-surface-500 mt-1">Supports PDF, DOCX (max 10MB)</p>
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files[0])} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 text-sm">Back</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && result && (
          <div className="relative text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Application Submitted!</h2>
            <p className="text-sm text-surface-400 mb-4">{result.message}</p>
            <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2 text-left border border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-400">Name</span>
                <span className="text-white font-medium">{result.candidate?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-400">Status</span>
                <span className="text-success-400 font-medium capitalize">{result.candidate?.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-400">AI Screening</span>
                <span className={result.candidate?.screened ? 'text-success-400' : 'text-warning-400'}>
                  {result.candidate?.screened ? '✅ Complete' : '⏳ Pending'}
                </span>
              </div>
              {result.candidate?.verdict && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-400">Verdict</span>
                  <span className={`font-medium ${
                    result.candidate.verdict === 'STRONG' ? 'text-success-400' :
                    result.candidate.verdict === 'GOOD' ? 'text-primary-300' :
                    result.candidate.verdict === 'WEAK' ? 'text-danger-400' : 'text-warning-400'
                  }`}>{result.candidate.verdict}</span>
                </div>
              )}
            </div>
            <button onClick={handleClose} className="btn-primary text-sm px-8">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
