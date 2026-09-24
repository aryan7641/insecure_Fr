import React, { useState } from 'react';
import { Search, User, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { MOCK_CUSTOMERS, MOCK_POLICIES, MOCK_MUTUAL_FUNDS } from '../../api/mockData';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const trimmed = query.trim().toLowerCase();

  const matchingCustomers = trimmed ? MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(trimmed) ||
    c.mobile.includes(trimmed) ||
    c.pan.toLowerCase().includes(trimmed) ||
    c.email.toLowerCase().includes(trimmed)
  ) : [];

  const matchingPolicies = trimmed ? MOCK_POLICIES.filter(p =>
    p.policyNumber.toLowerCase().includes(trimmed) ||
    p.company.toLowerCase().includes(trimmed) ||
    p.policyType.toLowerCase().includes(trimmed)
  ) : [];

  const matchingFolios = trimmed ? MOCK_MUTUAL_FUNDS.filter(m =>
    m.folioNumber.includes(trimmed) ||
    m.amc.toLowerCase().includes(trimmed) ||
    m.schemeName.toLowerCase().includes(trimmed)
  ) : [];

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="640px">
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={20} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '44px', fontSize: '15px' }}
          placeholder="Search by name, mobile (9876...), PAN, policy#, folio#, AMC..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {!trimmed ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Type a name, phone number, PAN card, policy or folio number to search across all records.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
          {/* Customers Group */}
          {matchingCustomers.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Customers ({matchingCustomers.length})
              </div>
              {matchingCustomers.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(`/customers/${c.id}`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-surface-hover)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={16} style={{ color: 'var(--color-accent)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Mobile: {c.mobile} | PAN: {c.pan}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--color-text-light)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Policies Group */}
          {matchingPolicies.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Insurance Policies ({matchingPolicies.length})
              </div>
              {matchingPolicies.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(`/customers/${p.customerId}?tab=insurance`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-surface-hover)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={16} style={{ color: 'var(--color-info)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{p.policyNumber} — {p.company}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {p.policyType} | Customer: {p.customerName}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--color-text-light)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Folios Group */}
          {matchingFolios.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Mutual Fund Folios ({matchingFolios.length})
              </div>
              {matchingFolios.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(`/customers/${m.customerId}?tab=mutualfunds`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-surface-hover)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>Folio: {m.folioNumber} — {m.amc}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {m.schemeName} | Customer: {m.customerName}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--color-text-light)' }} />
                </div>
              ))}
            </div>
          )}

          {matchingCustomers.length === 0 && matchingPolicies.length === 0 && matchingFolios.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No matching customers, policies, or folios found for "{query}".
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
