import React from 'react';
import { BarChart3, TrendingUp, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';

export const AnalyticsPage = () => {
  const { isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Agency Financial & Operational Analytics</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
          Agency Scope: <strong>{currentAgency.name}</strong> | All figures in INR (₹)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Portfolio AUM</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-success)', marginTop: '4px' }}>
            ₹ 56,70,000
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>Across all mutual fund folios</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Monthly SIP Book</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-accent)', marginTop: '4px' }}>
            ₹ 55,000 / mo
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>5 Active SIP installments</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Annual Insurance Premium</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-info)', marginTop: '4px' }}>
            ₹ 2,38,000 / yr
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>Total annualized premium</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Agency Customer Count</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
            3 Active
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>Unified Customer Records</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Insurance Premium Distribution</h3>
          <div style={{ height: '220px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Health (58%) • Term Life (42%) Breakdown Chart
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Mutual Fund Asset Allocation</h3>
          <div style={{ height: '220px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Large Cap (45%) • Mid Cap (35%) • Hybrid (20%)
          </div>
        </div>
      </div>
    </div>
  );
};
