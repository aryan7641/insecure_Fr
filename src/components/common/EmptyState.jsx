import React from 'react';
import { Inbox, ShieldAlert } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', description = 'Try adjusting your search or filters.', action }) => {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Inbox size={28} />
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>{title}</h4>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: action ? '20px' : 0 }}>
        {description}
      </p>
      {action}
    </div>
  );
};

export const UnauthorizedState = ({ message = 'You do not have administrative permission to view this resource.' }) => {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--color-danger-bg)',
      border: '1px solid var(--color-danger-border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-danger)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#fee2e2',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <ShieldAlert size={30} />
      </div>
      <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Access Restricted (403 Forbidden)</h4>
      <p style={{ fontSize: '14px', marginTop: '6px' }}>{message}</p>
    </div>
  );
};
