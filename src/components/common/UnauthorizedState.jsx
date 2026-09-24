import React from 'react';
import { ShieldAlert } from 'lucide-react';

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
