import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_AGENCIES } from '../api/mockData';
import { apiClient } from '../api/client';

const AgencyContext = createContext(null);

export const AgencyProvider = ({ children }) => {
  const [agencies, setAgencies] = useState(MOCK_AGENCIES);
  const [currentAgency, setCurrentAgency] = useState(() => {
    const saved = localStorage.getItem('insecure_agency');
    return saved ? JSON.parse(saved) : MOCK_AGENCIES[0];
  });

  useEffect(() => {
    async function loadAgencies() {
      try {
        const res = await apiClient.get('/agencies');
        const list = res?.data?.agencies || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(list) && list.length > 0) {
          setAgencies(list);
          const savedAgencyId = localStorage.getItem('insecure_agency_id');
          const matched = list.find(a => (a.id || a._id) === savedAgencyId) || list[0];
          setCurrentAgency(matched);
          const rawId = matched.id || matched._id;
          if (rawId) {
            localStorage.setItem('insecure_agency_id', rawId);
          }
        }
      } catch (e) {
        // use fallback
      }
    }
    loadAgencies();
  }, []);

  useEffect(() => {
    if (currentAgency) {
      localStorage.setItem('insecure_agency', JSON.stringify(currentAgency));
      const agencyId = currentAgency.id || currentAgency._id;
      if (agencyId && agencyId !== 'agency-1') {
        localStorage.setItem('insecure_agency_id', agencyId);
      }
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
