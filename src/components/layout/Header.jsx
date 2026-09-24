import React, { useState } from 'react';
import { Search, Plus, Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Header = ({ onOpenCustomerModal }) => {
  const { isAdmin } = useAuth();
  const { currentAgency, agencies, switchAgency } = useAgency();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            width: '320px',
            color: 'var(--color-text-muted)',
            fontSize: '13px'
          }}
        >
          <Search size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search customer, PAN, mobile, policy...</span>
          <kbd style={{
            fontSize: '10px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '2px 4px'
          }}>⌘K</kbd>
        </button>

        {/* Right Section: Agency Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Agency Switcher (Admin capability) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--color-text-muted)' }} />
            {isAdmin ? (
              <select
                value={currentAgency.id}
                onChange={(e) => switchAgency(e.target.value)}
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}
              >
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{currentAgency.name}</span>
            )}
          </div>

          {/* Quick Action Button */}
          {onOpenCustomerModal && (
            <button className="btn btn-primary btn-sm" onClick={onOpenCustomerModal}>
              <Plus size={16} />
              Add Customer
            </button>
          )}
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
