import React, { useState } from 'react';
import { Search, Plus, Building2, UploadCloud, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAgency } from '../../context/AgencyContext';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Header = ({ onOpenCustomerModal, onOpenPolicyPdfModal }) => {
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
        padding: '0 24px',
        userSelect: 'none'
      }}>
        {/* Global Search Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            width: '320px',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.backgroundColor = 'var(--color-bg)';
          }}
        >
          <Search size={15} style={{ color: 'var(--color-text-light)' }} />
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
            Search customer, policy, vehicle #...
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '2px 5px'
          }}>
            <span>⌘</span><span>K</span>
          </div>
        </button>

        {/* Right Section: Agency Switcher & Primary Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Agency Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '12.5px',
            color: 'var(--color-text-body)'
          }}>
            <Building2 size={15} style={{ color: 'var(--color-text-muted)' }} />
            {isAdmin && agencies && agencies.length > 1 ? (
              <select
                value={currentAgency?.id || currentAgency?._id}
                onChange={(e) => switchAgency(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontWeight: '600',
                  color: 'var(--color-text-main)',
                  outline: 'none',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {agencies.map(a => (
                  <option key={a.id || a._id} value={a.id || a._id}>{a.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                {currentAgency?.name || 'Apex Wealth Partners'}
              </span>
            )}
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />

          {/* Quick PDF Upload Action */}
          {onOpenPolicyPdfModal && (
            <button 
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent)',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
              }}
              onClick={onOpenPolicyPdfModal}
            >
              <UploadCloud size={15} />
              <span>Upload Policy PDF</span>
            </button>
          )}

          {/* Add Customer Button */}
          {onOpenCustomerModal && (
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: 'var(--radius-md)'
              }}
              onClick={onOpenCustomerModal}
            >
              <Plus size={15} />
              <span>Customer</span>
            </button>
          )}
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
