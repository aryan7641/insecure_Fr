import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@apexwealth.in');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '22px',
            marginBottom: '12px'
          }}>
            IN
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Sign in to INSecure</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Financial CRM for Insurance & Mutual Funds
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            <Lock size={16} /> Sign In
          </button>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', textContent: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', textAlign: 'center' }}>
              Quick Demo Login Shortcuts:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => { setEmail('admin@apexwealth.in'); login('admin@apexwealth.in', 'pass'); navigate('/dashboard'); }}
              >
                Login Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => { setEmail('priya@apexwealth.in'); login('priya@apexwealth.in', 'pass'); navigate('/dashboard'); }}
              >
                Login Agent
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
