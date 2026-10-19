'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminLogin } from '@/lib/api';
import { EyeIcon, EyeOffIcon } from '@/components/PasswordToggleIcons';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await adminLogin(email, password);
      localStorage.setItem('checkhub_admin_token', data.token);
      localStorage.setItem('checkhub_admin_user', JSON.stringify(data.user));
      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="login-brand-header">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="site-logo-badge large">
              <span className="logo-text">Check</span>
              <span className="hub-pill">Hub</span>
            </div>
          </Link>
          <h2>ADMINISTRATOR PORTAL</h2>
          <p>Real-time Video Views &amp; User IP Analytics</p>
        </div>

        {error && (
          <div className="admin-alert-box admin-alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="adminEmail">Admin Email</label>
            <input
              id="adminEmail"
              type="email"
              required
              className="admin-form-input"
              placeholder="e.g. admin@softlogic.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="adminPassword">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className="admin-form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: showPassword ? 'var(--hub-orange)' : 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn-primary admin-btn-block"
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Panel →'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
