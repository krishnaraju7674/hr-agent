import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';

export default function NotesTimeline({ candidateId }) {
    const { user, isAdminOrHR } = useAuth();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [candidateId]);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(`/api/candidates/${candidateId}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/candidates/${candidateId}/notes`, {
                content: newNote,
                author: user?.name || 'User',
            });
            setNotes((prev) => [res.data, ...prev]);
            setNewNote('');
        } catch (err) {
            console.error('Failed to add note:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await axios.delete(`/api/candidates/${candidateId}/notes/${noteId}`);
            setNotes((prev) => prev.filter((n) => n._id !== noteId));
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Notes & Updates
            </h2>

            {/* Add Note */}
            {isAdminOrHR && (
                <form onSubmit={handleAddNote} className="mb-6">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="input-field flex-1"
                            placeholder="Add a note about this candidate..."
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newNote.trim()}
                            className="btn-primary text-sm px-4 disabled:opacity-50"
                        >
                            {submitting ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            )}

            {/* Notes List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-16 w-full rounded-lg" />
                    ))}
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm text-surface-400">No notes yet</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {notes.map((note) => (
                        <div key={note._id} className="glass-card-light p-4 relative group animate-fade-in">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white">
                                        {note.author?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-medium text-white">{note.author || 'User'}</span>
                                    <span className="text-xs text-surface-500">{formatDate(note.createdAt)}</span>
                                </div>
                                {isAdminOrHR && (
                                    <button
                                        onClick={() => handleDeleteNote(note._id)}
                                        className="p-1 rounded text-surface-500 hover:text-danger-400 hover:bg-danger-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete note"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-surface-300 leading-relaxed">{note.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}