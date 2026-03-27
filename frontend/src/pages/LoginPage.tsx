import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

type Tab = 'login' | 'register';

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/feed');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(regUsername, regEmail, regPassword);
      navigate('/feed');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: 440 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="fw-bold fs-2 mb-1" style={{ letterSpacing: '-0.5px' }}>
              TLDR
            </h1>
            <p className="text-muted small">The BEST Social Network.</p>
          </div>

          <ul className="nav nav-pills nav-justified mb-4 bg-light rounded p-1">
            <li className="nav-item">
              <button
                className={`nav-link w-100 border-0 ${activeTab === 'login' ? 'active' : 'text-muted'}`}
                onClick={() => { setActiveTab('login'); setError(''); }}
              >
                Log In
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link w-100 border-0 ${activeTab === 'register' ? 'active' : 'text-muted'}`}
                onClick={() => { setActiveTab('register'); setError(''); }}
              >
                Register
              </button>
            </li>
          </ul>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="yourname"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1" />
            <span className="px-2 text-muted small">or continue with</span>
            <hr className="flex-grow-1" />
          </div>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-center">
              <GoogleLogin onSuccess={() => {}} onError={() => {}} />
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={() => {}}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#1877F2"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
