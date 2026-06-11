import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import HomeFeed from './pages/HomeFeed';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { Home, LayoutDashboard, LogIn, UserPlus, LogOut, Sun, Moon } from 'lucide-react';
import { notifApi } from './api/axios';
import './index.css';

// Guards a route — redirects to /login if no token is stored
const ProtectedRoute = ({ element }) => {
  const isLoggedIn = !!localStorage.getItem('token');
  return isLoggedIn ? element : <Navigate to="/login" replace />;
};

function App() {
  const isLoggedIn = !!localStorage.getItem('token');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnreadCount = () => {
      notifApi.get('')
        .then(res => {
          const unread = res.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = () => {
    ['token', 'userId', 'userName'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="logo" onClick={() => window.location.href = isLoggedIn ? '/' : '/login'}>
              CampusConnect
            </h1>
            {isLoggedIn && localStorage.getItem('userName') && (
              <span className="nav-greeting" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                {getGreeting()}, <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{localStorage.getItem('userName')}</span> 👋
              </span>
            )}
          </div>

          <div className="nav-links">
            {isLoggedIn && (
              <>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                  <Home size={16} /> Feed
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''} style={{ position: 'relative' }}>
                  <LayoutDashboard size={16} /> Dashboard
                  {unreadCount > 0 && (
                    <span className="nav-notif-badge" style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '999px',
                      fontSize: '0.625rem',
                      padding: '1px 5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 2px var(--bg-nav)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </>
            )}

            {!isLoggedIn ? (
              <>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
                  <LogIn size={16} /> Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
                  <UserPlus size={16} /> Sign Up
                </NavLink>
              </>
            ) : (
              <a href="#" onClick={handleLogout} style={{ color: '#ef4444' }}>
                <LogOut size={16} /> Logout
              </a>
            )}

            {/* Dark mode toggle */}
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </nav>

        <div className="content-container">
          <Routes>
            <Route path="/"          element={<ProtectedRoute element={<HomeFeed />} />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
