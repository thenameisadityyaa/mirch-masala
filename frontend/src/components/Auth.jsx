import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Auth = ({ type, setUser }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/${type === 'login' ? 'login' : 'register'}`,
        formData
      );
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = type === 'login';

  return (
    <div className="auth-page">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="auth-card">

        <div className={`auth-icon ${isLogin ? 'login' : 'register'}`}>
          {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
        </div>

        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p>{isLogin ? 'Login to track orders and manage your account.' : 'Sign up to start ordering from The New Mirch Masala.'}</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
            <p className="error-text">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Rahul Sharma" required
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" required
              value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" placeholder="At least 8 characters" required
              value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 8, padding: '14px', fontSize: '1rem', borderRadius: 10 }}
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? <><LogIn size={17} /> Login to Account</>
                : <><UserPlus size={17} /> Create Account</>
            }
          </button>
        </form>

        <p className="auth-footer">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Create an account' : 'Login instead'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
