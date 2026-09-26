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
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setAgencies(res.data);
          const savedAgencyId = localStorage.getItem('insecure_agency_id');
          const matched = res.data.find(a => (a.id || a._id) === savedAgencyId) || res.data[0];
          setCurrentAgency(matched);
          localStorage.setItem('insecure_agency_id', matched.id || matched._id);
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
      localStorage.setItem('insecure_agency_id', currentAgency.id || currentAgency._id || 'agency-1');
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
