import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../utils/api.js';

export default function Register({ onSwitch }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} id="register-form">
      {error && <div className="auth-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="register-username">Username</label>
        <input
          id="register-username"
          type="text"
          placeholder="cooluser123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          autoComplete="username"
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-confirm">Confirm Password</label>
        <input
          id="register-confirm"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="auth-btn" disabled={loading} id="register-submit">
        {loading ? (
          <span className="btn-loader"></span>
        ) : (
          'Create Account'
        )}
      </button>
      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}>Sign in</button>
      </p>
    </form>
  );
}
