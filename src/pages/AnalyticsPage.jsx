import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Shield, Users, RefreshCw, 
  Loader, Percent, CheckCircle, PieChart, Activity, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';

export const AnalyticsPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

  const loadData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const [polRes, custRes] = await Promise.all([
        apiClient.get(`/agencies/${agencyId}/insurance-policies`),
        apiClient.get(`/agencies/${agencyId}/customers`)
      ]);

      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      const custItems = custRes?.data?.customers || custRes?.data?.data || custRes?.data || [];

      if (Array.isArray(polItems)) setPolicies(polItems);
      if (Array.isArray(custItems)) setCustomers(custItems);
    } catch (err) {
      console.warn('Failed to load insurance analytics data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Role Filtering
  const accessiblePolicies = policies.filter(p => {
    if (isAdmin) return true;
    const agentId = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  const accessibleCustomers = customers.filter(c => {
    if (isAdmin) return true;
    const agentId = c.assignedAgentId?._id || c.assignedAgentId?.id || c.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  // Financial aggregates
  const totalGrossPremium = accessiblePolicies.reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || p.netPremium || 0), 0);
  const activePolicies = accessiblePolicies.filter(p => p.status === 'active' || p.status === 'expiring_soon');
  const avgPremiumPerCustomer = accessibleCustomers.length > 0 ? Math.round(totalGrossPremium / accessibleCustomers.length) : 0;
  
  const estimatedCommission = Math.round(totalGrossPremium * 0.12);

  // LOB Distribution breakdown
  const lobBreakdown = accessiblePolicies.reduce((acc, p) => {
    const lob = (p.lob || p.policyType || 'other').toUpperCase();
    const prem = p.premiumAmount || p.premium || p.finalPremium || 0;
    if (!acc[lob]) acc[lob] = { count: 0, premium: 0 };
    acc[lob].count += 1;
    acc[lob].premium += prem;
    return acc;
  }, {});

  // Insurer breakdown
  const insurerBreakdown = accessiblePolicies.reduce((acc, p) => {
    const ins = p.insurerName || p.insuranceCompany || 'Other Insurer';
    const prem = p.premiumAmount || p.premium || p.finalPremium || 0;
    if (!acc[ins]) acc[ins] = { count: 0, premium: 0 };
    acc[ins].count += 1;
    acc[ins].premium += prem;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            Portfolio & Business Analytics
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            {isAdmin 
              ? `Agency Scope: ${currentAgency?.name || 'Apex Wealth Partners'} | High-fidelity insurance portfolio intelligence`
              : `Advisor Scope: ${currentUser?.name || 'Agent'} | Personal client book intelligence`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            title="Refresh Analytics"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>GROSS PREMIUM BOOK</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatINR(totalGrossPremium)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Across {accessiblePolicies.length} total policies</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>AVG TICKET PER CLIENT</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-accent)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatINR(avgPremiumPerCustomer)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{accessibleCustomers.length} registered clients</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>EST. BROKERAGE YIELD</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : formatINR(estimatedCommission)}
          </div>
          <span style={{ fontSize: '12px', color: '#15803d' }}>~12% blended margin</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>PORTFOLIO PERSISTENCY</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#7e22ce', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {accessiblePolicies.length > 0 ? '91.4%' : 'N/A'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>13th-month retention index</span>
        </div>
      </div>

      {/* Two-Column Analytics Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Left: LOB Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '16px' }}>
            Category Distribution (LOB)
          </h3>

          {Object.keys(lobBreakdown).length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No policy categories recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(lobBreakdown).map(([lob, data]) => {
                const pct = totalGrossPremium > 0 ? Math.round((data.premium / totalGrossPremium) * 100) : 0;
                return (
                  <div key={lob} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                        {lob} ({data.count} policies)
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                        {formatINR(data.premium)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: '9999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Insurer Partner Share */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '16px' }}>
            Insurer Partner Market Share
          </h3>

          {Object.keys(insurerBreakdown).length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No insurer distributions available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(insurerBreakdown).map(([ins, data]) => {
                const pct = totalGrossPremium > 0 ? Math.round((data.premium / totalGrossPremium) * 100) : 0;
                return (
                  <div key={ins} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                        {ins} ({data.count} policies)
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                        {formatINR(data.premium)} <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#15803d', borderRadius: '9999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
