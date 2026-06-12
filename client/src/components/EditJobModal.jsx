import { useState } from 'react';
import axios from 'axios';

export default function EditJobModal({ job, onClose, onUpdated }) {
    const [formData, setFormData] = useState({
        title: job.title || '',
        department: job.department || '',
        description: job.description || '',
        requirements: (job.requirements || []).join('\n'),
        status: job.status || 'open',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                requirements: formData.requirements
                    .split('\n')
                    .map((r) => r.trim())
                    .filter(Boolean),
            };
            const res = await axios.patch(`/api/jobs/${job._id}`, payload);
            onUpdated(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update job');
        } finally {
            setSubmitting(false);
        }
    };

    if (!job) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg glass-card p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Edit Job</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-surface-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">Job Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input-field"
                            placeholder="e.g. Senior Frontend Engineer"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">Department</label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="input-field"
                            placeholder="e.g. Engineering"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="input-field"
                        >
                            <option value="open" className="bg-surface-800 text-white">Open</option>
                            <option value="closed" className="bg-surface-800 text-white">Closed</option>
                            <option value="paused" className="bg-surface-800 text-white">Paused</option>
                            <option value="draft" className="bg-surface-800 text-white">Draft</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field resize-none h-24"
                            placeholder="Describe the role and responsibilities..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1.5">
                            Requirements <span className="text-surface-500">(one per line)</span>
                        </label>
                        <textarea
                            value={formData.requirements}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            className="input-field resize-none h-28"
                            placeholder={"5+ years of React experience\nTypeScript proficiency"}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}