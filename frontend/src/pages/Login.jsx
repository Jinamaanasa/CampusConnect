import React, { useState } from 'react';
import { authApi } from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await authApi.post('/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userId', res.data.userId);
            localStorage.setItem('userName', res.data.name);
            window.location.href = '/'; // Force reload to update navbar state
        } catch (error) {
            alert('Login failed: Invalid credentials');
        }
    };

    return (
        <div className="glass-panel auth-card fade-in">
            <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Log in to your CampusConnect account to continue.</p>
            </div>
            
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label><Mail size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Email Address</label>
                    <input 
                        type="email" 
                        placeholder="john@university.edu" 
                        required
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label><Lock size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                    />
                </div>
                <button type="submit" className="btn-primary">
                    <LogIn size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
                    Login
                </button>
            </form>

            <div className="auth-footer">
                Don't have an account? <Link to="/register">Sign up here</Link>
            </div>
        </div>
    );
};

export default Login;
