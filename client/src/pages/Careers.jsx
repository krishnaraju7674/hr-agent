import { useState, useEffect } from 'react';
import axios from 'axios';
import ApplyModal from '../components/ApplyModal';

export default function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState(null);

  useEffect(() => {
    axios.get('/api/jobs/public').then(r => setJobs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Join Our Team</h1>
          <p className="text-surface-400">Explore open positions and apply with AI-powered resume screening</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No open positions</h3>
            <p className="text-surface-400 text-sm">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <div key={job._id} className="glass-card p-6 hover:bg-white/[0.08] transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">{job.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">{job.department}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-success-500/20 text-success-400 border border-success-500/30">
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-surface-400 line-clamp-3 mb-4">{job.description}</p>
                {job.requirements?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.requirements.slice(0, 4).map((r, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">{r}</span>
                    ))}
                    {job.requirements.length > 4 && <span className="text-[10px] text-surface-500">+{job.requirements.length - 4}</span>}
                  </div>
                )}
                <button onClick={() => setApplyJob(job)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-semibold hover:from-primary-600 hover:to-primary-800 transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ApplyModal isOpen={!!applyJob} onClose={() => setApplyJob(null)} job={applyJob} />
    </div>
  );
}
