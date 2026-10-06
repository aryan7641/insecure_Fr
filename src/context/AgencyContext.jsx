import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AgencyContext = createContext(null);

export const AgencyProvider = ({ children }) => {
  const [agencies, setAgencies] = useState([]);
  const [currentAgency, setCurrentAgency] = useState(() => {
    const saved = localStorage.getItem('insecure_agency');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    async function loadAgencies() {
      const storedToken = localStorage.getItem('insecure_token');
      if (!storedToken) return;

      try {
        const res = await apiClient.get('/agencies');
        const list = res?.data?.agencies || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(list) && list.length > 0) {
          setAgencies(list);
          const savedAgencyId = localStorage.getItem('insecure_agency_id');
          const matched = (savedAgencyId ? list.find(a => (a.id || a._id) === savedAgencyId) : null) || list[0];
          setCurrentAgency(matched);
          const rawId = matched.id || matched._id;
          if (rawId) {
            localStorage.setItem('insecure_agency_id', rawId);
          }
        }
      } catch (e) {
        // network error
      }
    }
    loadAgencies();
  }, []);

  useEffect(() => {
    if (currentAgency) {
      localStorage.setItem('insecure_agency', JSON.stringify(currentAgency));
      const agencyId = currentAgency.id || currentAgency._id;
      if (agencyId) {
        localStorage.setItem('insecure_agency_id', agencyId);
      }
    } else {
      localStorage.removeItem('insecure_agency');
    }
  }, [currentAgency]);

  const switchAgency = (agencyId) => {
    const found = agencies.find(a => (a.id || a._id) === agencyId);
    if (found) {
      setCurrentAgency(found);
    }
  };

  return (
    <AgencyContext.Provider value={{ currentAgency, agencies, switchAgency }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => useContext(AgencyContext);
