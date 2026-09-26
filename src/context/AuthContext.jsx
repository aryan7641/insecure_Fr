import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../api/mockData';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('insecure_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[0];
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
    }
  }, [currentUser, token, agencyId]);

  // Initial auto-sync with backend login if no valid JWT token is stored
  useEffect(() => {
    if (!token || token.startsWith('mock-')) {
      login('admin@apexwealth.in', 'password123', 'Admin').catch(err => {
        console.warn('Auto-login notice:', err.message);
      });
    }
  }, []);

  const login = async (email = 'admin@apexwealth.in', password = 'password123', role = 'Admin') => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: role.toUpperCase() })
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data.accessToken && data.user) {
          setToken(data.accessToken);
          const activeAgency = data.user.activeAgencyId || (data.user.agencies && data.user.agencies[0]?.agencyId);
          if (activeAgency) {
            const rawId = typeof activeAgency === 'object' ? (activeAgency._id || activeAgency.id) : activeAgency;
            setAgencyId(rawId);
          }
          setCurrentUser(data.user);
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend login endpoint unavailable, using mock user fallback:', err.message);
    }

    // Local fallback if server unreachable
    const found = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || MOCK_USERS[0];
    setCurrentUser(found);
    return { user: found };
  };

  const switchRole = (role) => {
    const matched = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    login(matched.email, 'password', matched.role);
  };

  const logout = () => {
    setCurrentUser(null);
    setToken('');
    setAgencyId('');
    localStorage.removeItem('insecure_user');
    localStorage.removeItem('insecure_token');
    localStorage.removeItem('insecure_agency_id');
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
