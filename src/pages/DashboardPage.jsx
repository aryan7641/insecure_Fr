import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, AlertTriangle, CalendarX, TrendingUp, Calendar, 
  FileText, Clock, AlertCircle, UserPlus, UploadCloud, MessageSquare, Loader, ArrowUpRight
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [selectedPolicyForWhatsapp, setSelectedPolicyForWhatsapp] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const loadDashboardData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      // 1. Fetch Customers
      const custRes = await apiClient.get(`/agencies/${agencyId}/customers`);
      const custItems = custRes?.data?.customers || custRes?.data?.data || custRes?.data || [];
      if (Array.isArray(custItems)) setCustomers(custItems);

      // 2. Fetch Policies
      const polRes = await apiClient.get(`/agencies/${agencyId}/insurance-policies`);
      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      if (Array.isArray(polItems)) setPolicies(polItems);

      // 3. Fetch Follow-ups
      const fuRes = await apiClient.get(`/agencies/${agencyId}/follow-ups`);
      const fuItems = fuRes?.data?.followUps || fuRes?.data?.data || fuRes?.data || [];
      if (Array.isArray(fuItems)) setFollowups(fuItems);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadDashboardData();

    const handleSync = () => loadDashboardData();
    window.addEventListener('policyCreated', handleSync);
    window.addEventListener('customerCreated', handleSync);
    return () => {
      window.removeEventListener('policyCreated', handleSync);
      window.removeEventListener('customerCreated', handleSync);
    };
  }, [loadDashboardData]);

  // Role filtering
  const filteredPolicies = policies.filter(p => {
    if (isAdmin) return true;
    const agentId = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  const filteredCustomers = customers.filter(c => {
    if (isAdmin) return true;
    const agentId = c.assignedAgentId?._id || c.assignedAgentId?.id || c.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  // KPI Calculations
  const activePolicies = filteredPolicies.filter(p => p.status === 'active' || p.status === 'expiring_soon');
  
  const expiringSoonPolicies = filteredPolicies.filter(p => {
    if (p.status === 'expiring_soon') return true;
    if (!p.renewalDate) return false;
    const diffDays = Math.ceil((new Date(p.renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  const totalPremiumValue = activePolicies.reduce((acc, p) => acc + (p.premium || p.finalPremium || 0), 0);
  const pendingFollowupsCount = followups.filter(f => f.status === 'pending').length;

  const handleOpenWhatsapp = (policy) => {
    const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };
    setWhatsappCustomer(cust);
    setSelectedPolicyForWhatsapp(policy);
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Executive Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Agency: <strong>{currentAgency.name || 'Apex Wealth Partners'}</strong> | Role View: <strong>{currentUser?.role || 'Admin'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={loadDashboardData}
            title="Refresh metrics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsPdfModalOpen(true)}
            style={{ backgroundColor: '#2563eb' }}
          >
            <UploadCloud size={16} /> Upload Policy PDF (AI OCR)
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/customers')}
          >
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* 1. Total Customers */}
        <StatCard
          title="Total Customers"
          value={filteredCustomers.length}
          subtext="Unified Profiles"
          icon={Users}
          color="accent"
          onClick={() => navigate('/customers')}
        />

        {/* 2. Active Insurance Policies */}
        <StatCard
          title="Active Policies"
          value={activePolicies.length}
          subtext="Covered Lives & Assets"
          icon={Shield}
          color="info"
          onClick={() => navigate('/insurance')}
        />

        {/* 3. Expiring Within 30 Days */}
        <StatCard
          title="Expiring in 30 Days"
          value={expiringSoonPolicies.length}
          subtext="Requires Immediate Renewal"
          icon={AlertTriangle}
          color="warning"
          onClick={() => navigate('/insurance')}
        />

        {/* 4. Total Annual Premium Portfolio */}
        <StatCard
          title="Annual Premium"
          value={`₹ ${totalPremiumValue.toLocaleString('en-IN')}`}
          subtext="Total GWP Managed (INR)"
          icon={TrendingUp}
          color="success"
          onClick={() => navigate('/insurance')}
        />

        {/* 5. Pending Renewal Follow-ups */}
        <StatCard
          title="Renewal Tasks"
          value={pendingFollowupsCount}
          subtext="Pending Follow-ups"
          icon={Clock}
          color="accent"
          onClick={() => navigate('/followups')}
        />
      </div>

      {/* Urgent Renewals & Portfolio Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Urgent Expiring Policies */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Policies Expiring Soon (Action Watchlist)</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Policies requiring renewal reminders in the next 30 days</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/insurance')}>View All Policies</button>
          </div>

          <div className="table-container">
            {expiringSoonPolicies.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Shield size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', fontWeight: '600' }}>No policies expiring in the next 30 days</p>
                <p style={{ fontSize: '12px' }}>All policies are current and up to date.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Customer</th>
                    <th>Insurer & Plan</th>
                    <th>Renewal Date</th>
                    <th>Premium</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoonPolicies.slice(0, 6).map(p => {
                    const cust = p.customerId;
                    const custName = cust?.name || p.customerName || 'Customer';
                    const renewalStr = p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    const daysRemaining = p.renewalDate ? Math.ceil((new Date(p.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

                    return (
                      <tr key={p._id || p.id}>
                        <td style={{ fontWeight: '700', color: 'var(--color-accent)' }}>
                          {p.policyNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{custName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{cust?.mobile || p.customerMobile || '—'}</div>
                        </td>
                        <td>
                          <div>{p.insuranceCompany}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.subLob || p.policyType?.toUpperCase()}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-warning)' }}>{renewalStr}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-danger)' }}>In {daysRemaining} days</div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                          ₹ {(p.premium || p.finalPremium || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Send WhatsApp Renewal Reminder"
                            onClick={() => handleOpenWhatsapp(p)}
                            style={{ color: '#25D366' }}
                          >
                            <MessageSquare size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Launchpad & Portfolio Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick PDF OCR Launchpad */}
          <div className="card" style={{ backgroundColor: 'var(--color-accent-light)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <UploadCloud size={24} style={{ color: 'var(--color-accent)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>AI Policy PDF Intake</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '16px', lineHeight: '1.5' }}>
              Upload any insurer's policy schedule PDF. The system extracts customer info, vehicle details, premium, and dates for your 1-click confirmation.
            </p>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setIsPdfModalOpen(true)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <UploadCloud size={14} /> Launch PDF OCR Extractor
            </button>
          </div>

          {/* Insurance Line Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Portfolio by Insurance Line</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Health Insurance', type: 'health', count: filteredPolicies.filter(p => p.policyType === 'health').length, color: '#3b82f6' },
                { name: 'Motor Insurance', type: 'motor', count: filteredPolicies.filter(p => p.policyType === 'motor').length, color: '#10b981' },
                { name: 'Term Life Insurance', type: 'term', count: filteredPolicies.filter(p => p.policyType === 'term').length, color: '#8b5cf6' },
                { name: 'Life & Savings', type: 'life', count: filteredPolicies.filter(p => p.policyType === 'life').length, color: '#f59e0b' },
                { name: 'Other Insurance', type: 'other', count: filteredPolicies.filter(p => !['health', 'motor', 'term', 'life'].includes(p.policyType)).length, color: '#6b7280' }
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: '700' }}>{item.count} Policies</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF OCR Modal */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => loadDashboardData()}
      />

      {/* WhatsApp Modal */}
      <WhatsappPreviewModal
        isOpen={!!whatsappCustomer}
        onClose={() => { setWhatsappCustomer(null); setSelectedPolicyForWhatsapp(null); }}
        customer={whatsappCustomer}
        policy={selectedPolicyForWhatsapp}
      />
    </div>
  );
};
