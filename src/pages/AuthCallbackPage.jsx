import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { apiClient } from '../api/client';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing Google authentication...');

  useEffect(() => {
    async function processCallback() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('accessToken');
      const agencyId = params.get('agencyId');

      if (token) {
        localStorage.setItem('insecure_token', token);
        if (agencyId) {
          localStorage.setItem('insecure_agency_id', agencyId);
        }

        try {
          // Fetch current user details
          const meRes = await apiClient.get('/auth/me');
          const userData = meRes?.data?.user || meRes?.data;
          if (userData) {
            localStorage.setItem('insecure_user', JSON.stringify(userData));
            const userAgency = userData.activeAgencyId || userData.agencies?.[0]?.agencyId;
            if (userAgency) {
              const rawAgencyId = typeof userAgency === 'object' ? (userAgency._id || userAgency.id) : userAgency;
              localStorage.setItem('insecure_agency_id', rawAgencyId);
            }
          }
        } catch (e) {
          console.warn('Unable to fetch user details:', e.message);
        }

        navigate('/dashboard', { replace: true });
        window.location.reload();
      } else {
        setStatus('Authentication failed or no token received. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    }

    processCallback();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '20px'
    }}>
      <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: '400px' }}>
        <Loader size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Authenticating</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{status}</p>
      </div>
    </div>
  );
};
