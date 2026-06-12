import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const stageColors = {
    new: { bg: 'bg-surface-400/20', text: 'text-surface-300', bar: 'bg-surface-400' },
    shortlisted: { bg: 'bg-primary-500/20', text: 'text-primary-300', bar: 'bg-primary-400' },
    interviewing: { bg: 'bg-warning-500/20', text: 'text-warning-400', bar: 'bg-warning-400' },
    offered: { bg: 'bg-success-500/20', text: 'text-success-400', bar: 'bg-success-400' },
    rejected: { bg: 'bg-danger-500/20', text: 'text-danger-400', bar: 'bg-danger-400' },
};

const verdictColors = {
    STRONG: { bg: 'bg-success-500/20', text: 'text-success-400', bar: 'bg-success-400' },
    GOOD: { bg: 'bg-primary-500/20', text: 'text-primary-300', bar: 'bg-primary-400' },
    AVERAGE: { bg: 'bg-warning-500/20', text: 'text-warning-400', bar: 'bg-warning-400' },
    WEAK: { bg: 'bg-danger-500/20', text: 'text-danger-400', bar: 'bg-danger-400' },
};

function StatCard({ icon, label, value, gradient }) {
    return (
        <div className="glass-card p-5 hover:bg-white/[0.08] transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-surface-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

function HorizontalBarChart({ data, colorMap, total }) {
    return (
        <div className="space-y-3">
            {Object.entries(data).map(([key, count]) => {
                const colors = colorMap[key] || { bar: 'bg-surface-400', text: 'text-surface-300' };
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                    <div key={key} className="flex items-center gap-3">
                        <span className={`w-24 text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{key}</span>
                        <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden relative">
                            <div className={`h-full rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-sm font-bold text-white text-right">{count}</span>
                        <span className="w-10 text-xs text-surface-500">({pct}%)</span>
                    </div>
                );
            })}
        </div>
    );
}

function DepartmentTable({ departments }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-4">Department</th>
                        <th className="text-right text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-4">Candidates</th>
                        <th className="text-right text-xs font-semibold text-surface-400 uppercase tracking-wider py-3 px-4">Avg Score</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map((d, i) => (
                        <tr key={d._id || i} className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-white">{d._id || 'Unknown'}</td>
                            <td className="py-3 px-4 text-sm text-right text-white">{d.count}</td>
                            <td className="py-3 px-4 text-right">
                                <span className={`text-sm font-bold ${d.avgScore >= 70 ? 'text-success-400' : d.avgScore >= 50 ? 'text-warning-400' : 'text-danger-400'}`}>
                                    {d.avgScore ? Math.round(d.avgScore) : 'N/A'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ScoreGauge({ label, score, color }) {
    return (
        <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 201} 201`}
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold" style={{ color }}>{Math.round(score)}</span>
                </div>
            </div>
            <p className="text-xs text-surface-400">{label}</p>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="skeleton h-8 w-48 mb-8 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="skeleton h-64 rounded-2xl" />
                <div className="skeleton h-64 rounded-2xl" />
            </div>
            <div className="skeleton h-48 rounded-2xl" />
        </div>
    );
}

export default function Analytics() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get('/api/analytics/overview');
            setData(res.data);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AnalyticsSkeleton />;

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="glass-card p-12 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
                    <p className="text-surface-400 text-sm mb-4">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const totalCandidates = data.totalCandidates;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
                    <p className="text-surface-400 text-sm mt-1">Recruitment performance overview</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
                    Back to Dashboard
                </button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon="💼" label="Total Jobs" value={data.totalJobs} gradient="from-primary-500/20 to-primary-600/20" />
                <StatCard icon="📋" label="Open Jobs" value={data.openJobs} gradient="from-blue-500/20 to-blue-600/20" />
                <StatCard icon="👥" label="Total Candidates" value={totalCandidates} gradient="from-success-500/20 to-success-600/20" />
                <StatCard icon="⭐" label="Avg Score" value={Math.round(data.avgScores?.overall || 0)} gradient="from-warning-500/20 to-warning-600/20" />
            </div>

            {totalCandidates === 0 && (
                <div className="glass-card p-12 text-center mb-8">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                    <p className="text-surface-400 text-sm">Upload resumes to start seeing analytics</p>
                </div>
            )}

            {totalCandidates > 0 && (
                <>
                    {/* Pipeline & Verdict Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-5">Pipeline Breakdown</h2>
                            <HorizontalBarChart data={data.pipeline} colorMap={stageColors} total={totalCandidates} />
                        </div>
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-5">Verdict Distribution</h2>
                            <HorizontalBarChart data={data.verdicts} colorMap={verdictColors} total={totalCandidates} />
                        </div>
                    </div>

                    {/* Average Scores */}
                    <div className="glass-card p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-5">Average Candidate Scores</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <ScoreGauge label="Overall" score={data.avgScores?.overall || 0} color="#22d3ee" />
                            <ScoreGauge label="Skills" score={data.avgScores?.skills || 0} color="#818cf8" />
                            <ScoreGauge label="Experience" score={data.avgScores?.experience || 0} color="#f59e0b" />
                            <ScoreGauge label="Education" score={data.avgScores?.education || 0} color="#34d399" />
                            <ScoreGauge label="Culture Fit" score={data.avgScores?.culture_fit || 0} color="#f472b6" />
                        </div>
                    </div>

                    {/* Departments */}
                    {data.departments && data.departments.length > 0 && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-5">Departments</h2>
                            <DepartmentTable departments={data.departments} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}