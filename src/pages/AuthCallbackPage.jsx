import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [status, setStatus] = useState('Completing Google authentication...');

  useEffect(() => {
    async function processCallback() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('accessToken');
      let agencyId = params.get('agencyId');
      if (agencyId === 'agency-1') agencyId = null;

      // Clean out any legacy agency-1 from storage
      if (localStorage.getItem('insecure_agency_id') === 'agency-1') {
        localStorage.removeItem('insecure_agency_id');
      }
      try {
        const savedAgency = JSON.parse(localStorage.getItem('insecure_agency') || '{}');
        if (savedAgency?.id === 'agency-1' || savedAgency?._id === 'agency-1') {
          localStorage.removeItem('insecure_agency');
        }
      } catch (e) {}

      if (token) {
        localStorage.setItem('insecure_token', token);
        if (agencyId) {
          localStorage.setItem('insecure_agency_id', agencyId);
        }

        let userData = null;
        try {
          // Fetch current user details with newly received token
          const meRes = await apiClient.get('/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          userData = meRes?.data?.user || meRes?.data;
          if (userData) {
            localStorage.setItem('insecure_user', JSON.stringify(userData));
            const userAgency = userData.activeAgencyId || userData.agencies?.[0]?.agencyId;
            if (userAgency) {
              const rawAgencyId = typeof userAgency === 'object' ? (userAgency._id || userAgency.id) : userAgency;
              if (rawAgencyId && rawAgencyId !== 'agency-1') {
                agencyId = rawAgencyId;
                localStorage.setItem('insecure_agency_id', rawAgencyId);
              }
            }
          }
        } catch (e) {
          console.warn('Unable to fetch user details:', e.message);
        }

        if (setAuthSession) {
          setAuthSession({ token, user: userData, agencyId });
        }

        // Clean direct redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setStatus('Authentication failed or no token received. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }

    processCallback();
  }, [navigate, setAuthSession]);

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
