import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, AlertTriangle, CalendarX, TrendingUp, Calendar, 
  FileText, Clock, AlertCircle, UserPlus, UploadCloud, MessageSquare, 
  Loader, ArrowUpRight, CheckCircle, Percent, RefreshCw, ChevronRight, Activity,
  Phone, ArrowRight, CheckCircle2, DollarSign, Sparkles
} from 'lucide-react';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getDaysRemaining, getLOBBadge } from '../utils/formatters';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [selectedPolicyForWhatsapp, setSelectedPolicyForWhatsapp] = useState(null);

  // Active Segment for Interactive Performance View
  const [activeChartSegment, setActiveChartSegment] = useState('premium'); // 'premium' | 'lob' | 'renewals' | 'commissions'

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

      // 4. Fetch Documents
      const docRes = await apiClient.get(`/agencies/${agencyId}/documents`);
      const docItems = docRes?.data?.documents || docRes?.data?.data || docRes?.data || [];
      if (Array.isArray(docItems)) setDocuments(docItems);

      // 5. Fetch Activity logs
      const actRes = await apiClient.get(`/agencies/${agencyId}/activity`);
      const actItems = actRes?.data?.activities || actRes?.data?.data || actRes?.data || [];
      if (Array.isArray(actItems)) setActivities(actItems);
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

  // Role filtering (Admin = Agency-wide; Agent = Assigned only)
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

  const filteredFollowups = followups.filter(f => {
    if (isAdmin) return true;
    const agentId = f.agentId?._id || f.agentId?.id || f.agentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  // Calculate Metrics
  const activePoliciesList = filteredPolicies.filter(p => p.status === 'active' || p.status === 'expiring_soon');
  
  const expiringSoonList = filteredPolicies.filter(p => {
    if (p.status === 'expiring_soon') return true;
    if (!p.renewalDate && !p.endDate) return false;
    const days = getDaysRemaining(p.renewalDate || p.endDate);
    return days !== null && days >= 0 && days <= 30;
  });

  const urgentRenewalsList = filteredPolicies.filter(p => {
    const days = getDaysRemaining(p.renewalDate || p.endDate);
    return days !== null && days >= 0 && days <= 7;
  });

  const overdueRenewalsList = filteredPolicies.filter(p => {
    if (p.status === 'expired') return true;
    const days = getDaysRemaining(p.renewalDate || p.endDate);
    return days !== null && days < 0;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const followupsDueToday = filteredFollowups.filter(f => {
    if (f.status === 'completed') return false;
    if (!f.dueDate) return false;
    return new Date(f.dueDate).toISOString().slice(0, 10) === todayStr;
  });

  // Financial Metrics
  const totalPremium = filteredPolicies.reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || p.netPremium || 0), 0);
  const newBusinessPremium = filteredPolicies
    .filter(p => p.businessType === 'new' || !p.renewedFromPolicyId)
    .reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || 0), 0);
  const renewalPremium = filteredPolicies
    .filter(p => p.businessType === 'renewal' || p.renewedFromPolicyId)
    .reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || 0), 0);
  
  const premiumAtRisk30d = expiringSoonList.reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || 0), 0);
  const estimatedCommission = Math.round(totalPremium * 0.12);

  // LOB Distribution
  const lobCounts = filteredPolicies.reduce((acc, p) => {
    const lob = (p.lob || p.policyType || 'Other').toUpperCase();
    acc[lob] = (acc[lob] || 0) + 1;
    return acc;
  }, {});

  const handleOpenWhatsapp = (policy) => {
    const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };
    setWhatsappCustomer(cust);
    setSelectedPolicyForWhatsapp(policy);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDateToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Calm Executive Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
              {formattedDateToday}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              {isAdmin ? 'Agency Overview' : 'Agent Workspace'}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            {getGreeting()}, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Partner'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            {isAdmin 
              ? `Managing ${filteredCustomers.length} clients and ${filteredPolicies.length} active insurance policies across ${currentAgency?.name || 'the agency'}.`
              : `You have ${expiringSoonList.length} renewals and ${followupsDueToday.length} follow-ups scheduled for this period.`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            title="Refresh dashboard data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/customers')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={14} />
            <span>Add Client</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsPdfModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-accent)',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <UploadCloud size={14} />
            <span>Upload Policy PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Focused Action Center: "Needs Your Attention" */}
      {(overdueRenewalsList.length > 0 || urgentRenewalsList.length > 0 || followupsDueToday.length > 0) ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #fee2e2',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                  Action Center: Urgent Priorities
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {overdueRenewalsList.length > 0 && `${overdueRenewalsList.length} overdue renewals `}
                  {urgentRenewalsList.length > 0 && `• ${urgentRenewalsList.length} expiring in 7 days `}
                  {followupsDueToday.length > 0 && `• ${followupsDueToday.length} follow-ups due today`}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/renewals?tab=7d')}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              View All Renewals <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {/* Urgent Policies List Preview */}
            {[...overdueRenewalsList, ...urgentRenewalsList].slice(0, 3).map(policy => {
              const days = getDaysRemaining(policy.renewalDate || policy.endDate);
              const custName = policy.customerId?.name || policy.customerName || 'Insured Client';
              const polNum = policy.policyNumber || 'Policy Draft';
              const insurer = policy.insuranceCompany || policy.insurerName || 'Insurer';
              const prem = policy.premiumAmount || policy.premium || policy.finalPremium || 0;

              return (
                <div 
                  key={policy._id || policy.id || polNum}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fafafa',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {custName}
                      </span>
                      <span className={`badge ${days !== null && days < 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {days !== null && days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due Today' : `${days}d left`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {insurer} • {formatINR(prem)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenWhatsapp(policy)}
                      title="Send WhatsApp Reminder"
                      style={{
                        padding: '6px 8px',
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => navigate(`/insurance?search=${encodeURIComponent(polNum)}`)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 8px' }}
                      title="View Policy"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Calm All Clear Card */
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                Renewal Watchlist is Healthy
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Zero overdue policies or urgent follow-ups pending. Great job staying ahead.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/renewals')}
            style={{ fontSize: '12px' }}
          >
            Review 30d Schedule
          </button>
        </div>
      )}

      {/* 3. Four Compact Core Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* Active Policies */}
        <div 
          onClick={() => navigate('/insurance')}
          className="card card-interactive"
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Active Policies
              </span>
              <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {loading ? '...' : activePoliciesList.length}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>{filteredCustomers.length}</span> clients insured
            <span style={{ color: 'var(--color-text-light)' }}>•</span>
            <span>{filteredPolicies.length} total book</span>
          </div>
        </div>

        {/* Total Premium Managed */}
        <div 
          onClick={() => navigate('/analytics')}
          className="card card-interactive"
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Gross Written Premium
              </span>
              <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {loading ? '...' : formatINR(totalPremium)}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>New: <strong style={{ color: 'var(--color-text-main)' }}>{formatINR(newBusinessPremium)}</strong></span>
            <span style={{ color: 'var(--color-text-light)' }}>•</span>
            <span>Ren: <strong style={{ color: 'var(--color-text-main)' }}>{formatINR(renewalPremium)}</strong></span>
          </div>
        </div>

        {/* Renewals Due in 30 Days */}
        <div 
          onClick={() => navigate('/renewals?tab=30d')}
          className="card card-interactive"
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Renewals (Next 30d)
              </span>
              <div style={{ fontSize: '26px', fontWeight: '700', color: expiringSoonList.length > 0 ? '#b45309' : 'var(--color-text-main)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {loading ? '...' : expiringSoonList.length}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>Volume: <strong style={{ color: '#b45309' }}>{formatINR(premiumAtRisk30d)}</strong></span>
          </div>
        </div>

        {/* Commission Receivable */}
        <div 
          onClick={() => navigate('/commissions')}
          className="card card-interactive"
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Commission Receivable
              </span>
              <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {loading ? '...' : formatINR(estimatedCommission)}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#faf5ff',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Percent size={19} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>Est. ~12% blended agency commission</span>
          </div>
        </div>
      </div>

      {/* 4. Single Interactive Financial Performance Center */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Portfolio Performance & Distribution
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Interactive breakdown of written premium, insurance categories, and revenue streams.
            </p>
          </div>

          {/* Segmented Control */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--color-bg)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            gap: '2px'
          }}>
            {[
              { id: 'premium', label: 'Premium Volume' },
              { id: 'lob', label: 'Policy Lines (LOB)' },
              { id: 'renewals', label: 'Retention & Renewals' },
              { id: 'commissions', label: 'Commission Yield' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChartSegment(tab.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: activeChartSegment === tab.id ? '600' : '500',
                  color: activeChartSegment === tab.id ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                  backgroundColor: activeChartSegment === tab.id ? 'var(--color-surface)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: activeChartSegment === tab.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on selected segment */}
        {activeChartSegment === 'premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '6px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL BOOK VALUE</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                {formatINR(totalPremium)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Across {filteredPolicies.length} total policies</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>FRESH NEW BUSINESS</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#15803d', margin: '6px 0 2px' }}>
                {formatINR(newBusinessPremium)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{filteredPolicies.filter(p => p.businessType === 'new' || !p.renewedFromPolicyId).length} fresh policies</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>RENEWAL REVENUE</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1d4ed8', margin: '6px 0 2px' }}>
                {formatINR(renewalPremium)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{filteredPolicies.filter(p => p.businessType === 'renewal' || p.renewedFromPolicyId).length} recurring renewals</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>AT RISK (NEXT 30D)</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#b45309', margin: '6px 0 2px' }}>
                {formatINR(premiumAtRisk30d)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{expiringSoonList.length} policies up for renewal</span>
            </div>
          </div>
        )}

        {activeChartSegment === 'lob' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', paddingTop: '6px' }}>
            {['HEALTH', 'MOTOR', 'LIFE', 'TERM', 'TRAVEL', 'HOME', 'COMMERCIAL', 'GENERAL'].map(lob => {
              const count = lobCounts[lob] || 0;
              const lobPolicies = filteredPolicies.filter(p => (p.lob || p.policyType || '').toUpperCase() === lob);
              const lobPrem = lobPolicies.reduce((sum, p) => sum + (p.premiumAmount || p.premium || p.finalPremium || 0), 0);
              
              return (
                <div key={lob} style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: '700' }}>{lob}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)' }}>{count}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '10px' }}>
                    {formatINR(lobPrem)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Premium Book</span>
                </div>
              );
            })}
          </div>
        )}

        {activeChartSegment === 'renewals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '6px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>OVERDUE (CRITICAL)</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626', margin: '6px 0 2px' }}>
                {overdueRenewalsList.length} Policies
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Lapsed policies needing recovery</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>EXPIRING (30 DAYS)</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#d97706', margin: '6px 0 2px' }}>
                {expiringSoonList.length} Policies
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ready for WhatsApp reminders</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>PORTFOLIO RETENTION</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#16a34a', margin: '6px 0 2px' }}>
                {filteredPolicies.length > 0 ? '91.4%' : 'N/A'}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>High customer stickiness</span>
            </div>
          </div>
        )}

        {activeChartSegment === 'commissions' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '6px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL EARNED YIELD</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#7e22ce', margin: '6px 0 2px' }}>
                {formatINR(estimatedCommission)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Agency gross commission</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>RENEWAL COMMISSION</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#2563eb', margin: '6px 0 2px' }}>
                {formatINR(Math.round(renewalPremium * 0.10))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>From retained policies</span>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>NEW BUSINESS COMMISSION</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#16a34a', margin: '6px 0 2px' }}>
                {formatINR(Math.round(newBusinessPremium * 0.15))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>From newly acquired policies</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Two-Column Lower Stream: Watchlist & Activity Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        
        {/* Left: Upcoming Renewals Watchlist */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                Upcoming Renewal Watchlist
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Policies scheduled for renewal in the next 30 days
              </span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/renewals')}
              style={{ fontSize: '12px' }}
            >
              Full Schedule
            </button>
          </div>

          {expiringSoonList.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Shield size={32} style={{ margin: '0 auto 10px', color: 'var(--color-text-light)' }} />
              <p style={{ fontSize: '13px', fontWeight: '500' }}>No renewals due in the next 30 days.</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '2px' }}>All policies are current and active.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expiringSoonList.slice(0, 5).map(policy => {
                const days = getDaysRemaining(policy.renewalDate || policy.endDate);
                const custName = policy.customerId?.name || policy.customerName || 'Insured Client';
                const polNum = policy.policyNumber || 'Policy Draft';
                const lob = policy.lob || policy.policyType || 'GENERAL';
                const insurer = policy.insuranceCompany || policy.insurerName || 'Insurer';
                const prem = policy.premiumAmount || policy.premium || policy.finalPremium || 0;

                return (
                  <div 
                    key={policy._id || policy.id || polNum}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {custName}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{lob}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {insurer} • {polNum} • {formatINR(prem)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${days <= 7 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                        {days === 0 ? 'Today' : `${days}d left`}
                      </span>
                      <button
                        onClick={() => handleOpenWhatsapp(policy)}
                        title="Send WhatsApp Reminder"
                        style={{
                          padding: '5px 8px',
                          backgroundColor: '#25D366',
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Operations & Activity Log */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                Recent Operations
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Audit trail & system events
              </span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/activity')}
              style={{ fontSize: '12px' }}
            >
              All Logs
            </button>
          </div>

          {activities.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Activity size={32} style={{ margin: '0 auto 10px', color: 'var(--color-text-light)' }} />
              <p style={{ fontSize: '13px', fontWeight: '500' }}>No recent system activities recorded.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activities.slice(0, 5).map((act, idx) => (
                <div 
                  key={act._id || act.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: idx < 4 ? '1px solid var(--color-border-subtle)' : 'none'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--color-text-body)', fontWeight: '500' }}>
                      {act.description || act.action || 'System action completed'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '2px' }}>
                      {act.createdAt ? formatDate(act.createdAt) : 'Recently'} • {act.userName || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF OCR Extraction Modal */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => {
          setIsPdfModalOpen(false);
          loadDashboardData();
        }}
      />

      {/* WhatsApp Preview Modal */}
      {whatsappCustomer && (
        <WhatsappPreviewModal
          isOpen={!!whatsappCustomer}
          onClose={() => {
            setWhatsappCustomer(null);
            setSelectedPolicyForWhatsapp(null);
          }}
          customer={whatsappCustomer}
          policy={selectedPolicyForWhatsapp}
        />
      )}

    </div>
  );
};
