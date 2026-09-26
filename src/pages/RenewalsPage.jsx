import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, Shield, 
  MessageSquare, User, Phone, Search, Filter, ArrowUpRight, ExternalLink, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { formatINR, formatDate, getDaysRemaining, getLOBBadge } from '../utils/formatters';

export const RenewalsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || '30d');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lobFilter, setLobFilter] = useState('ALL');

  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [whatsappPolicy, setWhatsappPolicy] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const fetchPolicies = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/insurance-policies`);
      const items = res?.data?.policies || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setPolicies(items);
      }
    } catch (err) {
      console.warn('Failed to load renewal policies:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Filter policies based on user permissions
  const accessiblePolicies = policies.filter(p => {
    if (isAdmin) return true;
    const agentId = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  // Filter based on tab horizon
  const filteredPolicies = accessiblePolicies.filter(p => {
    const targetDate = p.renewalDate || p.endDate;
    const days = getDaysRemaining(targetDate);

    // Tab filtering
    if (activeTab === 'today') {
      if (days !== 0) return false;
    } else if (activeTab === '7d') {
      if (days === null || days < 0 || days > 7) return false;
    } else if (activeTab === '15d') {
      if (days === null || days < 0 || days > 15) return false;
    } else if (activeTab === '30d') {
      if (days === null || days < 0 || days > 30) return false;
    } else if (activeTab === 'upcoming') {
      if (days === null || days <= 30) return false;
    } else if (activeTab === 'expired') {
      if (p.status !== 'expired' && (days === null || days >= 0)) return false;
    } else if (activeTab === 'renewed') {
      if (p.status !== 'renewed' && !p.renewedToPolicyId) return false;
    }

    // LOB filtering
    if (lobFilter !== 'ALL') {
      const polLob = (p.lob || p.policyType || '').toLowerCase();
      if (polLob !== lobFilter.toLowerCase()) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const custName = (p.customerId?.name || p.customerName || '').toLowerCase();
      const polNum = (p.policyNumber || '').toLowerCase();
      const insName = (p.insurerName || p.insuranceCompany || '').toLowerCase();
      const mobile = (p.customerId?.mobile || p.customerMobile || '').toLowerCase();
      if (!custName.includes(q) && !polNum.includes(q) && !insName.includes(q) && !mobile.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleOpenWhatsapp = (policy) => {
    const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };
    setWhatsappCustomer(cust);
    setWhatsappPolicy(policy);
  };

  const tabs = [
    { id: 'today', label: 'Due Today', count: accessiblePolicies.filter(p => getDaysRemaining(p.renewalDate || p.endDate) === 0).length },
    { id: '7d', label: 'Next 7 Days', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return d !== null && d >= 0 && d <= 7; }).length },
    { id: '15d', label: 'Next 15 Days', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return d !== null && d >= 0 && d <= 15; }).length },
    { id: '30d', label: 'Next 30 Days', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return d !== null && d >= 0 && d <= 30; }).length },
    { id: 'upcoming', label: 'Upcoming', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return d !== null && d > 30; }).length },
    { id: 'expired', label: 'Overdue / Expired', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return p.status === 'expired' || (d !== null && d < 0); }).length },
    { id: 'renewed', label: 'Renewed', count: accessiblePolicies.filter(p => p.status === 'renewed' || p.renewedToPolicyId).length }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Renewal Operations Center</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Daily contact list answering: <strong style={{ color: 'var(--color-primary)' }}>Who do I need to reach out to today?</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchPolicies}
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
              backgroundColor: activeTab === tab.id ? 'var(--color-accent-light)' : 'var(--color-bg)',
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontWeight: '700'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by customer name, mobile, policy #, insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <select 
          className="select"
          value={lobFilter}
          onChange={(e) => setLobFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="ALL">All Lines of Business</option>
          <option value="health">Health Insurance</option>
          <option value="motor">Motor Insurance</option>
          <option value="life">Life Insurance</option>
          <option value="term">Term Life</option>
          <option value="travel">Travel Insurance</option>
          <option value="home">Home Insurance</option>
          <option value="commercial">Commercial / Group</option>
        </select>
      </div>

      {/* Renewal List */}
      {loading ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
          <Loader size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading renewal portfolio...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <CheckCircle size={40} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>You're all caught up!</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            No policies matching this horizon filter require action.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPolicies.map((policy) => {
            const targetDate = policy.renewalDate || policy.endDate;
            const days = getDaysRemaining(targetDate);
            const lob = getLOBBadge(policy.lob || policy.policyType);
            const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };

            return (
              <div 
                key={policy._id || policy.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${days <= 7 ? 'var(--color-danger)' : days <= 15 ? 'var(--color-warning)' : 'var(--color-accent)'}`
                }}
              >
                {/* Customer & Policy Details */}
                <div style={{ flex: 2, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: lob.bg, 
                      color: lob.color,
                      border: `1px solid ${lob.border}`
                    }}>
                      {lob.label}
                    </span>
                    <button
                      onClick={() => policy.customerId?._id && navigate(`/customers/${policy.customerId._id}`)}
                      style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)', textAlign: 'left' }}
                    >
                      {cust.name || 'Unnamed Customer'}
                    </button>
                    {cust.mobile && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {cust.mobile}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span><strong>Insurer:</strong> {policy.insurerName || policy.insuranceCompany || '—'}</span>
                    <span><strong>Policy No:</strong> #{policy.policyNumber}</span>
                    {policy.vehicleDetails?.registrationNumber && (
                      <span><strong>Vehicle:</strong> {policy.vehicleDetails.registrationNumber} ({policy.vehicleDetails.make} {policy.vehicleDetails.model})</span>
                    )}
                  </div>
                </div>

                {/* Financials & Expiry Horizon */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {formatINR(policy.premiumAmount || policy.premium)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Expires: <strong style={{ color: 'var(--color-text-main)' }}>{formatDate(targetDate)}</strong>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${days <= 0 ? 'badge-danger' : days <= 7 ? 'badge-danger' : days <= 15 ? 'badge-warning' : 'badge-info'}`}>
                      {days === null ? 'No Date' : days === 0 ? 'Expires Today' : days < 0 ? `Overdue by ${Math.abs(days)}d` : `${days} days remaining`}
                    </span>
                  </div>
                </div>

                {/* Direct Outreach Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ color: '#16a34a', borderColor: '#bbf7d0', gap: '6px' }}
                    onClick={() => handleOpenWhatsapp(policy)}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </button>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => policy.customerId?._id ? navigate(`/customers/${policy.customerId._id}?tab=policies`) : navigate('/insurance')}
                  >
                    View Policy <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Template Modal */}
      {whatsappCustomer && (
        <WhatsappPreviewModal
          isOpen={!!whatsappCustomer}
          onClose={() => {
            setWhatsappCustomer(null);
            setWhatsappPolicy(null);
          }}
          customer={whatsappCustomer}
          policy={whatsappPolicy}
        />
      )}
    </div>
  );
};
