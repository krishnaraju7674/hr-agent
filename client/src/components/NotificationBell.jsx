import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const typeIcons = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '✕',
};

const typeColors = {
  info: 'border-primary-500/30 bg-primary-500/10',
  success: 'border-success-500/30 bg-success-500/10',
  warning: 'border-warning-500/30 bg-warning-500/10',
  error: 'border-danger-500/30 bg-danger-500/10',
};

const typeTextColors = {
  info: 'text-primary-400',
  success: 'text-success-400',
  warning: 'text-warning-400',
  error: 'text-danger-400',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await axios.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg className="w-5 h-5 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-danger-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-surface-400 hover:text-surface-300 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2 opacity-30">0</div>
                <p className="text-sm text-surface-500">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => { if (!n.read) markRead(n._id); }}
                  className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-white/[0.03] border-b border-white/[0.04] last:border-b-0 ${n.read ? 'opacity-60' : ''}`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${typeColors[n.type] || typeColors.info} ${typeTextColors[n.type] || typeTextColors.info}`}>
                    {typeIcons[n.type] || typeIcons.info}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? 'text-surface-400' : 'text-white font-medium'}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-surface-500 mt-0.5 truncate">{n.message}</p>}
                    <p className="text-[10px] text-surface-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-400 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
