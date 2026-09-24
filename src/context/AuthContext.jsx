import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../api/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Default to Admin for comprehensive initial view, switchable anytime
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('insecure_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[0];
  });

  const [token, setToken] = useState(() => localStorage.getItem('insecure_token') || 'mock-jwt-token-admin');

  useEffect(() => {
    localStorage.setItem('insecure_user', JSON.stringify(currentUser));
    localStorage.setItem('insecure_token', token);
  }, [currentUser, token]);

  const switchRole = (role) => {
    const matched = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setCurrentUser(matched);
  };

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || MOCK_USERS[0];
    setCurrentUser(found);
    setToken(`mock-token-${found.id}`);
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('insecure_user');
    localStorage.removeItem('insecure_token');
  };

  const isAdmin = currentUser?.role === 'Admin';
  const isAgent = currentUser?.role === 'Agent';

  return (
    <AuthContext.Provider value={{ currentUser, token, isAdmin, isAgent, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
