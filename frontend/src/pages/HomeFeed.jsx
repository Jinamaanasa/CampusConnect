import React, { useEffect, useState, useCallback } from 'react';
import { postApi, notifApi, requestApi } from '../api/axios';
import {
    Heart, MessageSquare, Send, Tag, MapPin, Search, PlusCircle,
    AlertCircle, CheckCircle2, Clock, UserCheck, X, BookOpen, Filter, Image, UploadCloud
} from 'lucide-react';

// ── Inline Toast ──────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const colors = {
        success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
        error:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
        warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
    };
    const c = colors[type] || colors.success;
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '340px',
            animation: 'toastIn 0.25s ease'
        }}>
            {type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}><X size={14}/></button>
        </div>
    );
};

// ── Type configuration ────────────────────────────────────────────────────────
const TYPE_META = {
    HELP:  { label: 'Help Request', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
    LOST:  { label: 'Lost Item',    color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
    FOUND: { label: 'Found Item',   color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' },
};

const STATUS_CHIP = ({ count, accepted, requesterName }) => {
    if (accepted) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.875rem', background: '#ecfdf5', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>
            <CheckCircle2 size={13}/> Claimed by {requesterName || 'a member'}
        </div>
    );
    if (count > 0) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.875rem', background: '#eff6ff', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>
            <UserCheck size={13}/> {count} member{count > 1 ? 's' : ''} interested
        </div>
    );
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.875rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            <Clock size={13}/> Awaiting responses
        </div>
    );
};

// ── Helper: Relative Timestamp ────────────────────────────────────────────────
const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (isNaN(diffMs) || diffMs < 0) return 'Just now';
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return '';
    }
};

// ── Main Component ────────────────────────────────────────────────────────────
const HomeFeed = () => {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [postRequests, setPostRequests] = useState({});
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');
    const [isCreating, setIsCreating] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', description: '', type: 'LOST', category: '', location: '', imageUrl: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [submittingId, setSubmittingId] = useState(null);
    const [toast, setToast] = useState(null);
    const currentUserId = localStorage.getItem('userId');

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const fetchPosts = useCallback(() => {
        postApi.get('/search?query=' + searchQuery)
            .then(res => {
                setPosts(res.data);
                res.data.forEach(p => {
                    fetchRequestsForPost(p.postId);
                    // Fetch actual comment count for each post
                    postApi.get(`/${p.postId}/comments`)
                        .then(cRes => {
                            const count = cRes.data ? cRes.data.length : 0;
                            setComments(prev => ({ ...prev, [p.postId]: cRes.data }));
                            setPosts(prev => prev.map(pp =>
                                pp.postId === p.postId ? { ...pp, commentsCount: count } : pp
                            ));
                        })
                        .catch(() => {});
                });
            })
            .catch(() => {});
    }, [searchQuery]);

    const fetchRequestsForPost = (postId) => {
        requestApi.get(`/post/${postId}`)
            .then(res => setPostRequests(prev => ({ ...prev, [postId]: res.data })))
            .catch(() => {});
    };

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleLike = (post) => {
        postApi.post(`/${post.postId}/like`)
            .then(res => {
                setPosts(posts.map(p => p.postId === post.postId ? res.data : p));
                if (post.authorId) {
                    notifApi.post('', { userId: post.authorId, message: `${localStorage.getItem('userName') || 'Someone'} liked your post: "${post.title}"` }).catch(() => {});
                }
            })
            .catch(() => showToast('Please login to like posts', 'error'));
    };

    const toggleComments = (postId) => {
        if (activeCommentPostId === postId) { setActiveCommentPostId(null); return; }
        setActiveCommentPostId(postId);
        postApi.get(`/${postId}/comments`)
            .then(res => {
                setComments(prev => ({ ...prev, [postId]: res.data }));
                setPosts(prev => prev.map(p =>
                    p.postId === postId ? { ...p, commentsCount: res.data.length } : p
                ));
            })
            .catch(() => {});
    };

    const handleAddComment = (post) => {
        if (!newComment.trim()) return;
        const userName = localStorage.getItem('userName') || 'Anonymous';
        postApi.post(`/${post.postId}/comments`, { content: newComment, authorName: userName })
            .then(res => {
                setComments(prev => ({ ...prev, [post.postId]: [...(prev[post.postId] || []), res.data] }));
                setNewComment('');
                setPosts(posts.map(p => p.postId === post.postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
                if (post.authorId) notifApi.post('', { userId: post.authorId, message: `${userName} commented on "${post.title}"` }).catch(() => {});
            })
            .catch(() => showToast('Please login to comment', 'error'));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be smaller than 2MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setNewPost(prev => ({ ...prev, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setNewPost(prev => ({ ...prev, imageUrl: '' }));
    };

    const handleCreatePost = (e) => {
        e.preventDefault();
        const userName = localStorage.getItem('userName');
        if (!userName) { showToast('Please login first', 'error'); return; }
        postApi.post('/create', { ...newPost, authorName: userName })
            .then(() => {
                setIsCreating(false);
                setNewPost({ title: '', description: '', type: 'LOST', category: '', location: '', imageUrl: '' });
                setImagePreview(null);
                fetchPosts();
                showToast('Post published successfully.');
            })
            .catch(() => showToast('Failed to create post.', 'error'));
    };

    const handleInterested = (post) => {
        const userName = localStorage.getItem('userName') || 'Someone';
        setSubmittingId(post.postId);
        requestApi.post('/create', { postId: post.postId, postTitle: post.title, requesterName: userName, reason: 'Interested' })
            .then(() => {
                if (post.authorId) notifApi.post('', { userId: post.authorId, message: `${userName} expressed interest in your post: "${post.title}"` }).catch(() => {});
                showToast('Request submitted. The author has been notified.');
                fetchRequestsForPost(post.postId);
            })
            .catch(err => {
                const msg = err.response?.data || '';
                if (msg.includes('already showed interest')) showToast('You have already submitted a request for this post.', 'warning');
                else if (msg.includes('accepted request')) showToast('This post already has an active respondent.', 'warning');
                else showToast('Failed to submit request. Please ensure you are logged in.', 'error');
            })
            .finally(() => setSubmittingId(null));
    };

    const filtered = filterType === 'ALL' ? posts : posts.filter(p => p.type === filterType);
    const sortedAndFiltered = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return b.postId - a.postId;
        if (sortBy === 'oldest') return a.postId - b.postId;
        if (sortBy === 'liked') return (b.likesCount || 0) - (a.likesCount || 0);
        if (sortBy === 'comments') return (b.commentsCount || 0) - (a.commentsCount || 0);
        return 0;
    });

    return (
        <div className="fade-in">
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            <style>{`@keyframes toastIn { from { transform: translateY(10px); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>Campus Feed</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{posts.length} active posts</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16}/>
                        <input
                            type="text" placeholder="Search posts..." className="comment-input"
                            style={{ paddingLeft: '2.5rem', height: '42px', borderRadius: '0.625rem', width: '160px', fontSize: '0.875rem' }}
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="comment-input"
                        style={{
                            height: '42px',
                            borderRadius: '0.625rem',
                            fontSize: '0.875rem',
                            padding: '0 1rem',
                            cursor: 'pointer',
                            background: 'var(--bg-card)',
                            border: '1.5px solid var(--border-light)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                            outline: 'none'
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="liked">Most Liked</option>
                        <option value="comments">Most Comments</option>
                    </select>
                    <button className="btn-primary" style={{ width: 'auto', marginTop: 0, padding: '0 1rem', borderRadius: '0.625rem', height: '42px', fontSize: '0.875rem' }} onClick={() => setIsCreating(!isCreating)}>
                        {isCreating ? <><X size={15}/> Cancel</> : <><PlusCircle size={15}/> New Post</>}
                    </button>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="stats-banner">
                {[
                    { label: 'All Posts', count: posts.length, color: 'var(--primary)', bg: 'rgba(79, 70, 229, 0.08)', border: 'var(--primary-glow)', icon: <BookOpen size={20}/> },
                    { label: 'Lost Items', count: posts.filter(p => p.type === 'LOST').length, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', icon: <AlertCircle size={20}/> },
                    { label: 'Found Items', count: posts.filter(p => p.type === 'FOUND').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', icon: <CheckCircle2 size={20}/> },
                    { label: 'Help Requests', count: posts.filter(p => p.type === 'HELP').length, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: <Clock size={20}/> }
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

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', alignItems: 'center' }}>
                <Filter size={15} style={{ color: 'var(--text-muted)' }}/>
                {[
                    { key: 'ALL', label: 'All Posts' },
                    { key: 'LOST', label: 'Lost Items' },
                    { key: 'FOUND', label: 'Found Items' },
                    { key: 'HELP', label: 'Help Requests' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilterType(f.key)} style={{
                        padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: `1px solid ${filterType === f.key ? 'var(--primary)' : 'var(--border-light)'}`,
                        background: filterType === f.key ? 'var(--primary)' : 'var(--bg-card)',
                        color: filterType === f.key ? 'white' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                        {f.label}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sortedAndFiltered.length} result{sortedAndFiltered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Create Post */}
            {isCreating && (
                <div className="glass-panel fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary)', borderRadius: '1rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem', color: 'var(--text-main)' }}>New Community Post</h3>
                    <form onSubmit={handleCreatePost} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Title</label>
                            <input type="text" placeholder="Brief description of your request..." required value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })}/>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <label style={{ margin: 0 }}>Details</label>
                                <span style={{ fontSize: '0.72rem', color: newPost.description.length >= 200 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                                    {newPost.description.length}/200
                                </span>
                            </div>
                            <textarea
                                placeholder="Provide clear details (e.g. description, color, reward, urgency)..."
                                required
                                maxLength={200}
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    background: 'var(--bg-input)',
                                    border: '1.5px solid var(--border-light)',
                                    padding: '0.875rem 1.125rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.95rem',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: '500',
                                    outline: 'none',
                                    transition: 'var(--transition)'
                                }}
                                value={newPost.description}
                                onChange={e => setNewPost({ ...newPost, description: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <input type="text" placeholder="e.g. Electronics, ID Card, Notes" required value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input type="text" placeholder="e.g. Library Block A, Canteen" required value={newPost.location} onChange={e => setNewPost({ ...newPost, location: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select value={newPost.type} onChange={e => {
                                setNewPost({ ...newPost, type: e.target.value, imageUrl: '' });
                                setImagePreview(null);
                            }}>
                                <option value="LOST">Lost Item</option>
                                <option value="FOUND">Found Item</option>
                                <option value="HELP">Help Request</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ marginTop: 0, fontSize: '0.9rem' }}>Publish Post</button>
                        </div>

                        {/* Image Upload — only for LOST / FOUND */}
                        {(newPost.type === 'LOST' || newPost.type === 'FOUND') && (
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Image size={14}/> Item Photo <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional, max 2 MB)</span>
                                </label>
                                {imagePreview ? (
                                    <div style={{ position: 'relative', display: 'inline-block', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--border-light)' }}>
                                        <img src={imagePreview} alt="Preview" style={{ display: 'block', maxHeight: '220px', maxWidth: '100%', objectFit: 'cover', borderRadius: '0.75rem' }}/>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                                                width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', cursor: 'pointer', color: 'white',
                                                backdropFilter: 'blur(4px)', transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.8)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
                                        >
                                            <X size={14}/>
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="post-image-upload" style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        gap: '0.5rem', padding: '1.75rem 1rem',
                                        border: '2px dashed var(--border-light)', borderRadius: '0.75rem',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'; }}
                                    >
                                        <UploadCloud size={28} style={{ color: 'var(--primary)', opacity: 0.7 }}/>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Click to upload a photo</span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PNG, JPG or WEBP</span>
                                        <input id="post-image-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }}/>
                                    </label>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* Posts Grid */}
            <div className="posts-grid">
                {sortedAndFiltered.map(post => {
                    const requests = postRequests[post.postId] || [];
                    const acceptedReq = requests.find(r => r.status === 'ACCEPTED' || r.status === 'COMPLETED');
                    const pendingCount = requests.filter(r => r.status === 'PENDING').length;
                    const userHasRequest = currentUserId ? requests.some(r => String(r.requesterId) === String(currentUserId)) : false;
                    const isSubmitting = submittingId === post.postId;
                    const meta = TYPE_META[post.type] || TYPE_META.HELP;
                    const currentUserName = localStorage.getItem('userName');
                    const isOwnPost = (currentUserId && post.authorId && String(post.authorId) === String(currentUserId))
                        || (currentUserName && post.authorName && post.authorName === currentUserName);
                    const btnDisabled = post.status !== 'OPEN' || userHasRequest || isSubmitting || isOwnPost;

                    return (
                        <div key={post.postId} className="glass-panel post-card" style={{ padding: '1.75rem' }}>
                            {/* Type badge + user-request indicator */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 700, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '0.25rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                    {meta.label}
                                </span>
                                {userHasRequest && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#065f46', background: '#ecfdf5', padding: '3px 8px', borderRadius: '0.25rem', border: '1px solid #86efac' }}>
                                        Request Submitted
                                    </span>
                                )}
                            </div>

                            {/* Author */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '30px', height: '30px', flexShrink: 0,
                                        background: `hsl(${(post.authorId || 0) * 61 % 360}, 55%, 50%)`,
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 700, color: 'white'
                                    }}>
                                        {post.authorName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{post.authorName || 'Anonymous'}</span>
                                </div>
                                {post.createdAt && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {timeAgo(post.createdAt)}
                                    </span>
                                )}
                            </div>

                            <h3 className="post-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{post.title}</h3>
                            <p className="post-desc" style={{ fontSize: '0.875rem' }}>{post.description}</p>

                            {/* Post Image */}
                            {post.imageUrl && (
                                <div style={{ margin: '0.875rem 0', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', border: '1px solid var(--border-light)', position: 'relative' }}>
                                    <img
                                        src={post.imageUrl.startsWith('data:') ? post.imageUrl : `data:image/jpeg;base64,${post.imageUrl}`}
                                        alt={post.title}
                                        style={{ display: 'block', width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '0.75rem' }}
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: '48px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 100%)',
                                        borderRadius: '0 0 0.75rem 0.75rem'
                                    }}/>
                                </div>
                            )}

                            {/* Meta tags */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {post.category && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '3px 8px', borderRadius: '0.25rem', border: '1px solid var(--border-light)' }}>
                                        <Tag size={11}/> {post.category}
                                    </span>
                                )}
                                {post.location && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '3px 8px', borderRadius: '0.25rem', border: '1px solid var(--border-light)' }}>
                                        <MapPin size={11}/> {post.location}
                                    </span>
                                )}
                            </div>

                            {/* Status */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <STATUS_CHIP count={pendingCount} accepted={!!acceptedReq} requesterName={acceptedReq?.requesterName}/>
                            </div>

                            {/* Actions */}
                            <div className="post-meta">
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button className="interaction-btn" onClick={() => handleLike(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: post.likesCount > 0 ? 'var(--secondary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Heart size={16} fill={post.likesCount > 0 ? 'var(--secondary)' : 'none'} color="currentColor"/>
                                        {post.likesCount || 0}
                                    </button>
                                    <button className="interaction-btn" onClick={() => toggleComments(post.postId)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <MessageSquare size={16}/>
                                        {(comments[post.postId] ? comments[post.postId].length : post.commentsCount) || 0}
                                    </button>
                                </div>
                                {!isOwnPost && (
                                    <button
                                        className="btn-primary"
                                        disabled={btnDisabled}
                                        style={{
                                            width: 'auto', padding: '0.45rem 1rem', marginTop: 0, fontSize: '0.82rem',
                                            opacity: btnDisabled && !userHasRequest ? 0.5 : 1,
                                            cursor: btnDisabled ? 'not-allowed' : 'pointer',
                                            background: userHasRequest ? '#059669' : post.status !== 'OPEN' ? '#94a3b8' : 'var(--primary)',
                                        }}
                                        onClick={() => !btnDisabled && handleInterested(post)}
                                    >
                                        {userHasRequest ? 'Submitted' : isSubmitting ? 'Submitting...' : post.status !== 'OPEN' ? post.status : post.type === 'HELP' ? 'Offer Help' : 'Show Interest'}
                                    </button>
                                )}
                            </div>

                            {/* Comments */}
                            {activeCommentPostId === post.postId && (
                                <div className="comment-section fade-in">
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                        <input type="text" className="comment-input" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComment(post)}/>
                                        <button onClick={() => handleAddComment(post)} style={{ background: 'var(--primary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
                                            <Send size={16}/>
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {(comments[post.postId] || []).map(c => (
                                            <div key={c.id} style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ width: '26px', height: '26px', background: `hsl(${c.authorName?.charCodeAt(0) * 17 % 360 || 200}, 50%, 50%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                    {c.authorName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '0.375rem 0.875rem 0.875rem 0.875rem', padding: '0.45rem 0.75rem', border: '1px solid var(--border-light)', flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{c.authorName}</div>
                                                        {c.createdAt && <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{timeAgo(c.createdAt)}</div>}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{c.content}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {comments[post.postId]?.length === 0 && <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.75rem' }}>No comments yet.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {sortedAndFiltered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                    <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.3 }}/>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No posts match your filter</p>
                </div>
            )}
        </div>
    );
};

export default HomeFeed;
