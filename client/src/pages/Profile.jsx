import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/profile');
      setProfile(res.data);
      setName(res.data.name || '');
      setEmail(res.data.email || '');
    } catch {} finally { setLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await axios.patch('/api/profile', { name, email });
      setProfile(res.data);
      setMessage('Profile updated successfully');
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update profile');
      setMessageType('error');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage('');
    try {
      await axios.patch('/api/profile/password', { currentPassword, newPassword });
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(err.response?.data?.error || 'Failed to change password');
    } finally { setPasswordSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-surface-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/30 to-primary-600/30 flex items-center justify-center text-2xl font-bold text-primary-300 border border-primary-500/30">
            {(profile?.name || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.name || user?.name}</h2>
            <p className="text-sm text-surface-400">{profile?.email || user?.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {profile?.role || user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
          <h3 className="text-sm font-semibold text-surface-300">Edit Profile</h3>
          {message && (
            <div className={`text-xs font-medium px-3 py-2 rounded-lg ${messageType === 'success' ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
              {message}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordMessage && (
            <div className={`text-xs font-medium px-3 py-2 rounded-lg ${passwordMessage.includes('success') ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
              {passwordMessage}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          </div>
          <button type="submit" disabled={passwordSaving} className="btn-primary text-sm disabled:opacity-50">
            {passwordSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
