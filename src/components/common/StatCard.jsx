import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'blue', onClick }) => {
  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
          {title}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '4px' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>
            {subtext}
          </div>
        )}
      </div>

      {Icon && (
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: `var(--color-${color}-bg, #eff6ff)`,
          color: `var(--color-${color}, #2563eb)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};
