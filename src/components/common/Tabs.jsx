import React from 'react';

export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      borderBottom: '1px solid var(--color-border)',
      marginBottom: '20px',
      overflowX: 'auto'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? '600' : '500',
            color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  );
};
