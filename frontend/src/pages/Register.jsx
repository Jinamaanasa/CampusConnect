import React, { useState } from 'react';
import { authApi } from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: ''
    });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await authApi.post('/register', formData);
            // Auto Login after registration
            const loginRes = await authApi.post('/login', { 
                email: formData.email, 
                password: formData.password 
            });
            localStorage.setItem('token', loginRes.data.token);
            localStorage.setItem('userId', loginRes.data.userId);
            localStorage.setItem('userName', loginRes.data.name);
            window.location.href = '/'; // Force reload to update navbar state
        } catch (error) {
            alert(error.response?.data || 'Registration failed');
        }
    };

    return (
        <div className="glass-panel auth-card fade-in">
            <div className="auth-header">
                <h2>Join CampusConnect</h2>
                <p>Create an account to start helping and sharing.</p>
            </div>
            
            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label><User size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Full Name</label>
                    <input 
                        type="text" 
                        placeholder="John Doe" 
                        required
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                </div>
                
                <div className="form-group">
                    <label><Mail size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Email Address</label>
                    <input 
                        type="email" 
                        placeholder="john@university.edu" 
                        required
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label><Lock size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        required
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                    />
                </div>

                <div className="form-group">
                    <label><Briefcase size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> Department</label>
                    <select 
                        required
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business</option>
                        <option value="Arts & Science">Arts & Science</option>
                        <option value="Medicine">Medicine</option>
                    </select>
                </div>

                <button type="submit" className="btn-primary">
                    <UserPlus size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
                    Sign Up
                </button>
            </form>

            <div className="auth-footer">
                Already have an account? <Link to="/login">Login here</Link>
            </div>
        </div>
    );
};

export default Register;
