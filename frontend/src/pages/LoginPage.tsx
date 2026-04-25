import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Only for registration
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard"; // Redirect back or to search page

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"; // Move to config/env later

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Assuming backend returns { message: "...", username: "..." }
      // We'll simulate a token for now, as backend doesn't return one
      const fakeToken = "fake-jwt-token"; 
      login(data.username, fakeToken); // Update context
      navigate(from, { replace: true }); // Redirect after login

    } catch (err) {
      if (err instanceof Error) {
          setError(err.message || 'An error occurred during login.');
      } else {
          setError('An unknown error occurred during login.')
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }

        // Optionally log the user in automatically after registration
        // Or just show a success message and let them log in
        alert('Registration successful! Please log in.'); 
        setIsRegistering(false); // Switch back to login view
        // Clear fields?
        setUsername('');
        setPassword('');
        setEmail('');

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message || 'An error occurred during registration.');
        } else {
             setError('An unknown error occurred during registration.')
        }
    } finally {
        setLoading(false);
    }
};


  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="auth-subtitle">
          {isRegistering
            ? 'Create an account to start exploring retail intelligence insights.'
            : 'Sign in to explore customer spending, loyalty behavior, churn risk, and basket insights.'}
        </p>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {isRegistering && (
             <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

           {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>
           )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null); // Clear errors on switch
          }}
          className="secondary-link-button"
        >
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 
