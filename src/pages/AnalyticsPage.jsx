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

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

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
  const totalGrossPremium = accessiblePolicies.reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.netPremium || 0), 0);
  const activePolicies = accessiblePolicies.filter(p => p.status === 'active' || p.status === 'expiring_soon');
  const avgPremiumPerCustomer = accessibleCustomers.length > 0 ? Math.round(totalGrossPremium / accessibleCustomers.length) : 0;
  
  const estimatedCommission = Math.round(totalGrossPremium * 0.12);

  // LOB Distribution breakdown
  const lobBreakdown = accessiblePolicies.reduce((acc, p) => {
    const lob = (p.lob || p.policyType || 'other').toLowerCase();
    const prem = p.premiumAmount || p.premium || 0;
    if (!acc[lob]) acc[lob] = { count: 0, premium: 0 };
    acc[lob].count += 1;
    acc[lob].premium += prem;
    return acc;
  }, {});

  // Insurer breakdown
  const insurerBreakdown = accessiblePolicies.reduce((acc, p) => {
    const ins = p.insurerName || p.insuranceCompany || 'Other Insurer';
    const prem = p.premiumAmount || p.premium || 0;
    if (!acc[ins]) acc[ins] = { count: 0, premium: 0 };
    acc[ins].count += 1;
    acc[ins].premium += prem;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Business Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            {isAdmin 
              ? `Agency Scope: ${currentAgency?.name || 'Apex Wealth Partners'} | Real-time insurance performance metrics`
              : `Advisor Portfolio: ${currentUser?.name || 'Agent'} | Individual insurance book analytics`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh Analytics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL GROSS PREMIUM</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            {formatINR(totalGrossPremium)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Across {accessiblePolicies.length} issued policies</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>ACTIVE POLICIES</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {activePolicies.length}
          </div>
          <span style={{ fontSize: '11px', color: '#047857' }}>In-force risk covers</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>ESTIMATED COMMISSION</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#7e22ce', marginTop: '4px' }}>
            {formatINR(estimatedCommission)}
          </div>
          <span style={{ fontSize: '11px', color: '#7e22ce' }}>Blended 12% revenue</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>AVG PREMIUM / CLIENT</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
            {formatINR(avgPremiumPerCustomer)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Client account value</span>
        </div>
      </div>

      {/* Analytics Breakdown Charts / Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Line of Business Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            Portfolio by Line of Business (LOB)
          </h3>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
            </div>
          ) : Object.keys(lobBreakdown).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No policy breakdown available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(lobBreakdown).map(([lob, data]) => {
                const lobBadge = getLOBBadge(lob);
                const percent = totalGrossPremium > 0 ? Math.round((data.premium / totalGrossPremium) * 100) : 0;

                return (
                  <div key={lob} style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: lobBadge.bg, 
                          color: lobBadge.color,
                          border: `1px solid ${lobBadge.border}`
                        }}>
                          {lobBadge.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          ({data.count} {data.count === 1 ? 'policy' : 'policies'})
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {formatINR(data.premium)} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({percent}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: lobBadge.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Insurer Distribution Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            Underwriting Insurer Distribution
          </h3>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
            </div>
          ) : Object.keys(insurerBreakdown).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No insurer data available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(insurerBreakdown).map(([insurer, data]) => {
                const percent = totalGrossPremium > 0 ? Math.round((data.premium / totalGrossPremium) * 100) : 0;

                return (
                  <div key={insurer} style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>
                        {insurer}
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {formatINR(data.premium)} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({percent}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: '3px' }} />
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
