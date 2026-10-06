import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, Shield, 
  MessageSquare, User, Phone, Search, Filter, ArrowUpRight, ExternalLink, Loader,
  CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { formatINR, formatDate, getDaysRemaining, getLOBBadge } from '../utils/formatters';
import { getSubtypeConfig } from '../schemas/insuranceTaxonomy';

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

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

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
    { id: 'expired', label: 'Overdue / Lapsed', count: accessiblePolicies.filter(p => { const d = getDaysRemaining(p.renewalDate || p.endDate); return p.status === 'expired' || (d !== null && d < 0); }).length },
    { id: 'renewed', label: 'Renewed', count: accessiblePolicies.filter(p => p.status === 'renewed' || p.renewedToPolicyId).length }
  ];

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Renewal Operations Center
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {filteredPolicies.length} in Horizon
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            Daily contact pipeline answering: <strong style={{ color: 'var(--color-text-main)' }}>Who do I need to reach out to today?</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchPolicies}
            title="Refresh List"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Horizon Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'var(--color-accent-subtle)' : '#f1f5f9',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by client name, mobile, policy #, insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <select 
          className="select"
          value={lobFilter}
          onChange={(e) => setLobFilter(e.target.value)}
          style={{ width: '170px', fontSize: '13px' }}
        >
          <option value="ALL">All Lines (LOB)</option>
          <option value="health">Health Insurance</option>
          <option value="motor">Motor Insurance</option>
          <option value="life">Life Insurance</option>
          <option value="term">Term Life</option>
          <option value="travel">Travel Insurance</option>
          <option value="home">Home Insurance</option>
          <option value="commercial">Commercial / Group</option>
        </select>
      </div>

      {/* Renewal List Cards */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading renewal portfolio...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>You're all caught up!</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            No policies matching this horizon filter require action right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPolicies.map((policy) => {
            const targetDate = policy.renewalDate || policy.endDate;
            const days = getDaysRemaining(targetDate);
            const lob = getLOBBadge(policy.lob || policy.policyType);
            const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };
            const custId = policy.customerId?._id || policy.customerId?.id;
            const insurer = policy.insuranceCompany || policy.insurerName || 'Insurer';
            const prem = policy.premiumAmount || policy.premium || policy.finalPremium || 0;

            const isUrgent = days !== null && days <= 7;
            const isOverdue = days !== null && days < 0;

            return (
              <div 
                key={policy._id || policy.id}
                className="card card-interactive"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${isOverdue ? '#dc2626' : isUrgent ? '#d97706' : 'var(--color-accent)'}`
                }}
              >
                {/* Customer & Policy Details */}
                <div style={{ flex: 2, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '10.5px', 
                      fontWeight: '700', 
                      padding: '2px 7px', 
                      borderRadius: '4px', 
                      backgroundColor: lob.bg, 
                      color: lob.color,
                      border: `1px solid ${lob.border}`,
                      textTransform: 'uppercase'
                    }}>
                      {lob.label}
                    </span>

                    {policy.insuranceSubtype && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        color: '#4f46e5',
                        fontWeight: '600'
                      }}>
                        {getSubtypeConfig(policy.insuranceSubtype)?.name || policy.insuranceSubtype}
                      </span>
                    )}

                    <span
                      onClick={() => custId && navigate(`/customers/${custId}`)}
                      style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--color-text-main)', cursor: custId ? 'pointer' : 'default' }}
                    >
                      {cust.name || 'Unnamed Client'}
                    </span>

                    {cust.mobile && (
                      <a 
                        href={`tel:${cust.mobile}`}
                        style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Phone size={11} style={{ color: 'var(--color-text-light)' }} /> {cust.mobile}
                      </a>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span><strong>Insurer:</strong> {insurer}</span>
                    <span><strong>Policy No:</strong> #{policy.policyNumber}</span>
                    {policy.vehicleDetails?.registrationNumber && (
                      <span><strong>Vehicle:</strong> {policy.vehicleDetails.registrationNumber} ({policy.vehicleDetails.make} {policy.vehicleDetails.model})</span>
                    )}
                  </div>
                </div>

                {/* Financials & Expiry Horizon */}
                <div style={{ flex: 1, minWidth: '170px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                    {formatINR(prem)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Due: <strong style={{ color: 'var(--color-text-body)' }}>{formatDate(targetDate)}</strong>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${isOverdue ? 'badge-danger' : isUrgent ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                      {days === null ? 'No Date' : days === 0 ? 'Due Today' : days < 0 ? `Overdue ${Math.abs(days)}d` : `${days} days left`}
                    </span>
                  </div>
                </div>

                {/* Direct Outreach Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenWhatsapp(policy)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => custId ? navigate(`/customers/${custId}?tab=insurance`) : navigate('/insurance')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View Policy</span>
                    <ArrowUpRight size={13} />
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
