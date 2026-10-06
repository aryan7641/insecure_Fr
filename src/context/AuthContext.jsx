import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('insecure_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('insecure_token') || '');
  const [agencyId, setAgencyId] = useState(() => localStorage.getItem('insecure_agency_id') || '');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('insecure_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('insecure_user');
    }

    if (token) {
      localStorage.setItem('insecure_token', token);
    } else {
      localStorage.removeItem('insecure_token');
    }

    if (agencyId) {
      localStorage.setItem('insecure_agency_id', agencyId);
    } else {
      localStorage.removeItem('insecure_agency_id');
    }
  }, [currentUser, token, agencyId]);

  // Verify stored token on startup
  useEffect(() => {
    async function verifyToken() {
      const storedToken = localStorage.getItem('insecure_token');
      if (storedToken && !storedToken.startsWith('mock-')) {
        try {
          const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const json = await res.json();
            const userData = json?.data?.user || json?.data;
            if (userData) {
              setCurrentUser(userData);
              const userAgency = userData.activeAgencyId || userData.agencies?.[0]?.agencyId;
              if (userAgency) {
                const rawId = typeof userAgency === 'object' ? (userAgency._id || userAgency.id) : userAgency;
                setAgencyId(rawId);
                localStorage.setItem('insecure_agency_id', rawId);
              }
              return;
            }
          } else {
            // Expired or invalid token: clean storage so app stays in clean state
            setCurrentUser(null);
            setToken('');
            setAgencyId('');
            localStorage.removeItem('insecure_token');
            localStorage.removeItem('insecure_user');
            localStorage.removeItem('insecure_agency_id');
            localStorage.removeItem('insecure_agency');
          }
        } catch (e) {
          // Network error: preserve existing cached user if present
        }
      }
    }

    verifyToken();
  }, []);

  const login = async (email, password, role = 'ADMIN') => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: (role || 'ADMIN').toUpperCase() })
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data.accessToken && data.user) {
          setToken(data.accessToken);
          localStorage.setItem('insecure_token', data.accessToken);
          const activeAgency = data.user.activeAgencyId || (data.user.agencies && data.user.agencies[0]?.agencyId);
          if (activeAgency) {
            const rawId = typeof activeAgency === 'object' ? (activeAgency._id || activeAgency.id) : activeAgency;
            setAgencyId(rawId);
            localStorage.setItem('insecure_agency_id', rawId);
          }
          setCurrentUser(data.user);
          localStorage.setItem('insecure_user', JSON.stringify(data.user));
          return data;
        }
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Invalid email or password');
      }
    } catch (err) {
      console.warn('Backend login endpoint error:', err.message);
      throw err;
    }
  };

  const switchRole = (role) => {
    if (currentUser) {
      const updated = { ...currentUser, role: role.toLowerCase() };
      setCurrentUser(updated);
      localStorage.setItem('insecure_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken('');
    setAgencyId('');
    localStorage.removeItem('insecure_user');
    localStorage.removeItem('insecure_token');
    localStorage.removeItem('insecure_agency_id');
    localStorage.removeItem('insecure_agency');
    window.location.href = '/login';
  };

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isAgent = currentUser?.role?.toLowerCase() === 'agent';

  return (
    <AuthContext.Provider value={{ currentUser, token, agencyId, isAdmin, isAgent, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
