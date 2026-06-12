import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import CandidateDetail from './pages/CandidateDetail';
import Analytics from './pages/Analytics';
import Interviews from './pages/Interviews';
import Profile from './pages/Profile';
import Templates from './pages/Templates';
import Offers from './pages/Offers';
import Careers from './pages/Careers';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationBell from './components/NotificationBell';

const API_URL = import.meta.env.VITE_API_URL || '';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Auth Context
const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { API_URL };

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('hr_token');
    const savedUser = localStorage.getItem('hr_user');
    if (savedToken && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      axios.get('/api/auth/me').then(res => {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }).catch(() => {
        localStorage.removeItem('hr_token');
        localStorage.removeItem('hr_user');
        delete axios.defaults.headers.common['Authorization'];
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('hr_token', newToken);
    localStorage.setItem('hr_user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdminOrHR }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Role badge colors
const roleBadgeColors = {
  admin: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
  hr: 'bg-success-500/20 text-success-400 border-success-500/30',
  viewer: 'bg-surface-500/20 text-surface-300 border-surface-500/30',
};

// Navbar
function Navbar() {
  const { user, logout, isAdminOrHR } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isJobsActive = location.pathname.startsWith('/jobs') || location.search.includes('tab=jobs');

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard?tab=jobs', label: 'Jobs', match: isJobsActive },
    { path: '/interviews', label: 'Interviews' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/templates', label: 'Templates' },
    ...(isAdminOrHR ? [{ path: '/offers', label: 'Offers' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface-900/70 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-300">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              HR Agent
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  (link.match ?? isActive(link.path)) ? 'bg-white/10 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'
                }`}>{link.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/profile" className="hidden sm:flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200" title="Profile">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeColors[user.role] || roleBadgeColors.viewer}`}>
                  {user.role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold shadow-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/10 transition-all duration-200" title="Logout">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/10 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/[0.06] pt-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    (link.match ?? isActive(link.path)) ? 'bg-white/10 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`}>{link.label}</Link>
              ))}
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/profile') ? 'bg-white/10 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'
                }`}>Profile</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
          <div className="min-h-screen bg-surface-900">
            <ErrorBoundary><Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/careers" element={<Careers />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidates/:id"
              element={
                <ProtectedRoute>
                  <CandidateDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute>
                  <Interviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <Offers />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></ErrorBoundary>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
