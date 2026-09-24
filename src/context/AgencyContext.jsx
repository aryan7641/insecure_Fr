import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_AGENCIES } from '../api/mockData';

const AgencyContext = createContext(null);

export const AgencyProvider = ({ children }) => {
  const [agencies, setAgencies] = useState(MOCK_AGENCIES);
  const [currentAgency, setCurrentAgency] = useState(() => {
    const saved = localStorage.getItem('insecure_agency');
    return saved ? JSON.parse(saved) : MOCK_AGENCIES[0];
  });

  useEffect(() => {
    localStorage.setItem('insecure_agency', JSON.stringify(currentAgency));
    localStorage.setItem('insecure_agency_id', currentAgency.id);
  }, [currentAgency]);

  const switchAgency = (agencyId) => {
    const found = agencies.find(a => a.id === agencyId);
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
