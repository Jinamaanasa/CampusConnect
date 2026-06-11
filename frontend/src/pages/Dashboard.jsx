import React, { useEffect, useState } from 'react';
import { userApi, notifApi, postApi, requestApi } from '../api/axios';
import { BookOpen, Settings, LogOut, ShieldCheck, X, CheckCircle2, AlertCircle, Trash2, UserCheck, Bell, TrendingUp, Award } from 'lucide-react';

const STATUS_META = {
    PENDING:   { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending Review' },
    ACCEPTED:  { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7', label: 'Accepted' },
    REJECTED:  { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', label: 'Not Selected' },
    COMPLETED: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd', label: 'Completed' },
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META.PENDING;
    return (
        <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '0.25rem' }}>
            {m.label}
        </span>
    );
};

const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            padding: '0.875rem 1.25rem', borderRadius: '0.75rem', maxWidth: '340px',
            background: type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
            color: type === 'error' ? '#991b1b' : '#166534',
            fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
            {type === 'error' ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>}
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={13}/></button>
        </div>
    );
};

const getRank = (score) => {
    if (score >= 200) return { label: 'Gold Member',    color: '#b45309', bg: '#fef3c7', pct: 100,                                    next: null };
    if (score >= 50)  return { label: 'Silver Member',  color: '#475569', bg: '#f1f5f9', pct: Math.round(score / 200 * 100),           next: { label: 'Gold',   pts: 200 - score } };
    return             { label: 'Bronze Student', color: '#92400e', bg: '#fef3c7', pct: Math.round(score / 50 * 100),             next: { label: 'Silver', pts: 50  - score } };
};

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [postRequests, setPostRequests] = useState({});
    const [mySentRequests, setMySentRequests] = useState([]);
    const [resolvedTitles, setResolvedTitles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ name: '', department: '' });
    const [activeTab, setActiveTab] = useState('notifications');
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const fetchData = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const userRes = await userApi.get(`/${userId}`);
            setUser(userRes.data);
            setSettingsForm({ name: userRes.data.name || '', department: userRes.data.department || '' });

            const [notifRes, postsRes, myReqRes] = await Promise.all([
                notifApi.get(''),
                postApi.get(`/user/${userId}`),
                requestApi.get('/my-requests'),
            ]);
            setNotifications(notifRes.data);
            setUserPosts(postsRes.data);

            const reqMap = {};
            await Promise.all(postsRes.data.map(async post => {
                try { const r = await requestApi.get(`/post/${post.postId}`); reqMap[post.postId] = r.data; } catch {}
            }));
            setPostRequests(reqMap);

            const myReqs = myReqRes.data;
            setMySentRequests(myReqs);

            // Resolve missing post titles by scanning all posts
            const needsTitle = myReqs.filter(r => !r.postTitle && r.postId);
            if (needsTitle.length > 0) {
                try {
                    const allPosts = await postApi.get('/search?query=');
                    const map = {};
                    needsTitle.forEach(r => {
                        const match = allPosts.data.find(p => p.postId === r.postId);
                        if (match) map[r.postId] = match.title;
                    });
                    setResolvedTitles(map);
                } catch {}
            }
        } catch { setError('Failed to load dashboard data.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleLogout = () => {
        ['token', 'userId', 'userName'].forEach(k => localStorage.removeItem(k));
        window.location.href = '/login';
    };

    const handleSaveSettings = () => {
        const userId = localStorage.getItem('userId');
        if (!userId || !settingsForm.name.trim()) return;
        userApi.put(`/${userId}`, settingsForm)
            .then(res => {
                setUser(res.data);
                localStorage.setItem('userName', res.data.name);
                setShowSettings(false);
                showToast('Profile updated.');
                setTimeout(() => window.location.reload(), 800);
            })
            .catch(() => showToast('Failed to save settings.', 'error'));
    };

    const handleAccept = (reqId, requesterId, name, title) => {
        requestApi.post(`/${reqId}/accept`)
            .then(() => {
                showToast(`Accepted request from ${name || 'member'}.`);
                notifApi.post('', { userId: requesterId, message: `${localStorage.getItem('userName') || 'Author'} accepted your interest in: "${title}".` }).catch(() => {});
                fetchData();
            })
            .catch(() => showToast('Failed to accept.', 'error'));
    };

    const handleComplete = (reqId, postType, requesterId, name, title) => {
        requestApi.post(`/${reqId}/complete?type=${postType}`)
            .then(() => {
                showToast('Marked as completed. Reputation points awarded.');
                notifApi.post('', { userId: requesterId, message: `Interaction completed for: "${title}". Reputation points awarded.` }).catch(() => {});
                fetchData();
            })
            .catch(() => showToast('Failed to complete.', 'error'));
    };

    const handleDeletePost = (postId) => {
        if (!window.confirm('Delete this post permanently?')) return;
        postApi.delete(`/${postId}`)
            .then(() => { showToast('Post deleted.'); fetchData(); })
            .catch(() => showToast('Failed to delete.', 'error'));
    };

    const handleMarkRead = (id) => {
        notifApi.put(`/${id}/read`).then(() => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))).catch(() => {});
    };

    const handleMarkAllRead = async () => {
        const unreadNotifs = notifications.filter(n => !n.isRead);
        if (unreadNotifs.length === 0) return;
        try {
            await Promise.all(unreadNotifs.map(n => notifApi.put(`/${n.id}/read`)));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showToast('All notifications marked as read.');
            setTimeout(() => window.location.reload(), 500);
        } catch {
            showToast('Failed to mark all as read.', 'error');
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
            <div className="loader" style={{ margin: '0 auto 1.5rem' }}/>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading dashboard...</p>
        </div>
    );

    if (error || !user) return (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '420px', margin: '4rem auto' }}>
            <ShieldCheck size={40} style={{ color: '#ef4444', marginBottom: '1rem' }}/>
            <h3 style={{ marginBottom: '0.5rem' }}>Session Expired</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Please log in to continue.'}</p>
            <button className="btn-primary" onClick={() => window.location.href = '/login'}>Go to Login</button>
        </div>
    );

    const rank = getRank(user.reputationScore || 0);
    const unread = notifications.filter(n => !n.isRead).length;

    const TabBtn = ({ id, label, badge }) => (
        <button onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: '0.6rem 0.5rem', border: 'none', cursor: 'pointer',
            borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s',
            background: activeTab === id ? 'var(--bg-card)' : 'transparent',
            color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            position: 'relative',
        }}>
            {label}
            {badge > 0 && <span style={{ position: 'absolute', top: '4px', right: '6px', background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '0.6rem', padding: '1px 5px', fontWeight: 800 }}>{badge}</span>}
        </button>
    );

    return (
        <div className="fade-in">
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Welcome back, <strong style={{ color: 'var(--primary)' }}>{user.name}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.875rem' }} onClick={() => setShowSettings(true)}>
                        <Settings size={15}/> Settings
                    </button>
                    <button className="btn-primary" style={{ width: 'auto', padding: '0.55rem 1rem', marginTop: 0, fontSize: '0.875rem' }} onClick={handleLogout}>
                        <LogOut size={15}/> Logout
                    </button>
                </div>
            </div>

            {/* Dashboard Stats Banner */}
            <div className="stats-banner" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'My Posts', count: userPosts.length, color: 'var(--primary)', bg: 'rgba(79, 70, 229, 0.08)', border: 'var(--primary-glow)', icon: <BookOpen size={20}/> },
                    { label: 'Interests Sent', count: mySentRequests.length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', icon: <UserCheck size={20}/> },
                    { label: 'Unread Alerts', count: unread, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', icon: <Bell size={20}/> },
                    { label: 'Reputation Score', count: user.reputationScore || 0, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: <Award size={20}/> }
                ].map((s, idx) => (
                    <div key={idx} className="stat-card" style={{
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        color: s.color,
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div className="stat-icon-wrap" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(4px)', color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--text-main)' }}>{s.count}</div>
                            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                {/* Left Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Profile */}
                    <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', background: `hsl(${(user.name?.charCodeAt(0) || 0) * 47 % 360}, 60%, 50%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{user.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{user.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>{user.department || 'No department'}</p>

                        {/* Rank */}
                        <div style={{ marginTop: '1.25rem', padding: '1rem', background: rank.bg, borderRadius: '0.75rem', border: `1px solid ${rank.color}22` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justify_content: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                                <Award size={16} style={{ color: rank.color }}/>
                                <span style={{ fontWeight: 800, color: rank.color, fontSize: '0.9rem' }}>{rank.label}</span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: rank.color }}>{user.reputationScore || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>pts</span></div>
                            {rank.next && (
                                <>
                                    <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.08)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}>
                                        <div style={{ width: `${rank.pct}%`, height: '100%', background: rank.color, transition: 'width 0.8s ease', borderRadius: '999px' }}/>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: rank.color, marginTop: '4px', opacity: 0.8 }}>{rank.next.pts} pts to {rank.next.label}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Reputation Info */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <TrendingUp size={16} style={{ color: 'var(--primary)' }}/>
                            <h4 style={{ fontWeight: 800, fontSize: '0.875rem' }}>Reputation Points</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                ['Help Request Resolved', '+5 pts'],
                                ['Lost / Found Item Resolved', '+3 pts'],
                            ].map(([label, pts]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: '0.375rem', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                    <strong style={{ color: '#059669' }}>{pts}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="btn-secondary" style={{ padding: '0.75rem', fontSize: '0.875rem' }} onClick={() => window.location.href = '/'}>
                        <BookOpen size={15}/> Browse Feed
                    </button>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.3rem', borderRadius: '0.75rem' }}>
                        <TabBtn id="notifications" label="Notifications" badge={unread}/>
                        <TabBtn id="myPosts" label="My Posts" badge={0}/>
                        <TabBtn id="myActivity" label="My Interests" badge={0}/>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '380px' }}>

                        {/* Notifications */}
                        {activeTab === 'notifications' && (
                            <div className="fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Bell size={16} style={{ color: 'var(--primary)' }}/>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Notifications</h4>
                                        {unread > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '0.65rem', padding: '1px 7px', fontWeight: 800 }}>{unread} new</span>}
                                    </div>
                                    {unread > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary)',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>No notifications yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {notifications.map(n => (
                                            <div key={n.id} onClick={() => !n.isRead && handleMarkRead(n.id)} style={{
                                                padding: '0.75rem 1rem', borderRadius: '0.5rem', cursor: n.isRead ? 'default' : 'pointer',
                                                background: n.isRead ? 'var(--bg-main)' : 'rgba(79, 70, 229, 0.08)',
                                                border: `1px solid ${n.isRead ? 'var(--border-light)' : 'var(--primary-glow)'}`,
                                                transition: 'all 0.15s'
                                            }}>
                                                <p style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.85rem' }}>{n.message}</p>
                                                {!n.isRead && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '3px' }}>Click to mark as read</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* My Posts */}
                        {activeTab === 'myPosts' && (
                            <div className="fade-in">
                                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.25rem' }}>My Posts</h4>
                                {userPosts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>You have not published any posts yet.</p>
                                        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => window.location.href = '/'}>Create Post</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {userPosts.map(post => (
                                            <div key={post.postId} style={{ border: '1px solid var(--border-light)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--bg-main)', borderBottom: (postRequests[post.postId] || []).length > 0 ? '1px solid var(--border-light)' : 'none' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{post.title}</p>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{post.type} · {post.status}</p>
                                                    </div>
                                                    <button onClick={() => handleDeletePost(post.postId)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '0.25rem' }}>
                                                        <Trash2 size={15}/>
                                                    </button>
                                                </div>
                                                {(postRequests[post.postId] || []).length > 0 && (
                                                    <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {(postRequests[post.postId] || []).map(req => (
                                                            <div key={req.requestId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem', background: 'var(--bg-card)', borderRadius: '0.375rem', border: '1px solid var(--border-light)' }}>
                                                                 <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{req.requesterName || `User #${req.requesterId}`}</span>
                                                                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                     <StatusBadge status={req.status}/>
                                                                     {req.status === 'PENDING' && (
                                                                         <button onClick={() => handleAccept(req.requestId, req.requesterId, req.requesterName, post.title)} className="btn-primary" style={{ padding: '2px 10px', fontSize: '0.7rem', marginTop: 0 }}>Accept</button>
                                                                     )}
                                                                     {req.status === 'ACCEPTED' && (
                                                                         <button onClick={() => handleComplete(req.requestId, post.type, req.requesterId, req.requesterName, post.title)} className="btn-secondary" style={{ padding: '2px 10px', fontSize: '0.7rem', marginTop: 0 }}>Mark Complete</button>
                                                                     )}
                                                                 </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* My Interests */}
                        {activeTab === 'myActivity' && (
                            <div className="fade-in">
                                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.25rem' }}>My Interests</h4>
                                {mySentRequests.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                        <UserCheck size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.75rem' }}/>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You have not expressed interest in any post yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        {mySentRequests.map(req => {
                                            const title = req.postTitle || resolvedTitles[req.postId] || `Post #${req.postId}`;
                                            const statusDesc = {
                                                PENDING:   'Awaiting author review',
                                                ACCEPTED:  'The author accepted your request',
                                                REJECTED:  'Another respondent was selected',
                                                COMPLETED: 'Interaction completed',
                                            }[req.status] || req.status;
                                            return (
                                                <div key={req.requestId} style={{ padding: '0.875rem 1rem', borderRadius: '0.625rem', border: '1px solid var(--border-light)', background: req.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{statusDesc}</p>
                                                    </div>
                                                    <StatusBadge status={req.status}/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-light)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>Account Settings</h3>
                            <button onClick={() => setShowSettings(false)} style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15}/></button>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Full Name</label>
                            <input type="text" value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}/>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Department</label>
                            <input type="text" value={settingsForm.department} onChange={e => setSettingsForm({ ...settingsForm, department: e.target.value })}/>
                        </div>
                        <button className="btn-primary" onClick={handleSaveSettings} style={{ width: '100%', marginTop: 0, fontSize: '0.9rem' }}>Save Changes</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
