import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Calendar, CreditCard, Shield, 
  FileText, CalendarCheck, MessageSquare, Activity, DollarSign, Plus, Eye, Loader, UploadCloud, RefreshCw,
  ArrowLeft, ChevronRight, CheckCircle2, AlertTriangle, ExternalLink, Percent
} from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { PolicyFormModal } from '../components/insurance/PolicyFormModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { CommissionModal } from '../components/commissions/CommissionModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate, getDaysRemaining, getLOBBadge } from '../utils/formatters';

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const { currentAgency } = useAgency();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [customer, setCustomer] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isManualPolicyModalOpen, setIsManualPolicyModalOpen] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [selectedPolicyForWhatsapp, setSelectedPolicyForWhatsapp] = useState(null);
  const [commissionPolicyTarget, setCommissionPolicyTarget] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

  const loadData = useCallback(async () => {
    if (!agencyId || !id) return;
    setLoading(true);
    try {
      // 1. Load Customer Profile
      const custRes = await apiClient.get(`/agencies/${agencyId}/customers/${id}`);
      const custData = custRes?.data?.customer || custRes?.data;
      if (custData) {
        setCustomer(custData);
      }

      // 2. Load Customer's Policies & Dedicated Commissions
      const [polRes, commRes] = await Promise.all([
        apiClient.get(`/agencies/${agencyId}/insurance-policies?customerId=${id}`),
        apiClient.get(`/agencies/${agencyId}/commissions?customerId=${id}`).catch(() => ({ data: { commissions: [] } }))
      ]);
      const polData = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      const commData = commRes?.data?.commissions || commRes?.data?.data || commRes?.data || [];

      const commMap = {};
      if (Array.isArray(commData)) {
        for (const c of commData) {
          const pId = c.policyId?._id || c.policyId?.id || c.policyId;
          if (pId) commMap[String(pId)] = c;
        }
      }

      if (Array.isArray(polData)) {
        const enrichedPolicies = polData.map(p => {
          const pId = String(p._id || p.id);
          const comm = commMap[pId] || p.commission;
          return { ...p, commission: comm };
        });
        setPolicies(enrichedPolicies);
      }

      // 3. Load Customer's Documents
      const docRes = await apiClient.get(`/agencies/${agencyId}/documents?customerId=${id}`);
      const docData = docRes?.data?.documents || docRes?.data || [];
      if (Array.isArray(docData)) {
        setDocuments(docData);
      }

      // 4. Load Customer's Follow-ups
      const fuRes = await apiClient.get(`/agencies/${agencyId}/follow-ups?customerId=${id}`);
      const fuData = fuRes?.data?.followUps || fuRes?.data?.data || fuRes?.data || [];
      if (Array.isArray(fuData)) {
        setFollowups(fuData);
      }
    } catch (err) {
      console.warn('Error loading customer detail data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId, id]);

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('policyCreated', handleSync);
    window.addEventListener('customerCreated', handleSync);
    return () => {
      window.removeEventListener('policyCreated', handleSync);
      window.removeEventListener('customerCreated', handleSync);
    };
  }, [loadData]);

  if (loading && !customer) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Loader size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--color-accent)' }} />
        <p style={{ fontSize: '14px' }}>Loading client unified 360 profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-main)' }}>Client Record Not Found</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '8px' }}>
          The requested customer record does not exist or has been removed from this agency.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/customers')}>
          Back to Directory
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Profile' },
    { id: 'insurance', label: 'Insurance Policies', count: policies.length },
    { id: 'documents', label: 'Document Vault', count: documents.length },
    { id: 'followups', label: 'Renewal Follow-ups', count: followups.length }
  ];

  const totalPremium = policies.reduce((acc, p) => acc + (p.premium || p.premiumAmount || p.finalPremium || 0), 0);
  const activePoliciesCount = policies.filter(p => p.status === 'active' || p.status === 'expiring_soon').length;
  const initials = customer.name ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';

  const handleOpenWhatsapp = (policy = null) => {
    setSelectedPolicyForWhatsapp(policy || policies[0] || null);
    setWhatsappModal(true);
  };

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => navigate('/customers')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}
        >
          <ArrowLeft size={14} />
          <span>Customers</span>
        </button>
        <ChevronRight size={13} style={{ color: 'var(--color-text-light)' }} />
        <span style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '600' }}>
          {customer.name}
        </span>
      </div>

      {/* Customer 360 Header Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Avatar & Core Profile */}
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '22px',
              flexShrink: 0
            }}>
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                  {customer.name}
                </h1>
                <span className="badge badge-info" style={{ fontSize: '11px' }}>
                  Agent: {customer.assignedAgentName || customer.assignedAgentId?.name || 'Assigned Agent'}
                </span>
                {customer.customerType && (
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {customer.customerType}
                  </span>
                )}
              </div>

              {/* Contact Chips */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px', flexWrap: 'wrap' }}>
                {customer.mobile && (
                  <a href={`tel:${customer.mobile}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-body)' }}>
                    <Phone size={13} style={{ color: 'var(--color-text-light)' }} /> {customer.mobile}
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-body)' }}>
                    <Mail size={13} style={{ color: 'var(--color-text-light)' }} /> {customer.email}
                  </a>
                )}
                {customer.pan && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CreditCard size={13} style={{ color: 'var(--color-text-light)' }} /> PAN: <strong style={{ color: 'var(--color-text-main)' }}>{customer.pan}</strong>
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} style={{ color: 'var(--color-text-light)' }} /> {customer.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ''}` : 'India'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsPdfModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-accent)'
              }}
            >
              <UploadCloud size={14} />
              <span>Upload Policy PDF</span>
            </button>

            <button 
              onClick={() => handleOpenWhatsapp()}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsManualPolicyModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Add Policy</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip inside Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Policies</span>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-accent)', marginTop: '2px' }}>
              {activePoliciesCount}
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Annual Premium</span>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-success)', marginTop: '2px' }}>
              {formatINR(totalPremium)}
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Documents in Vault</span>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-main)', marginTop: '2px' }}>
              {documents.length}
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Follow-ups</span>
            <div style={{ fontSize: '18px', fontWeight: '700', color: followups.length > 0 ? '#b45309' : 'var(--color-text-main)', marginTop: '2px' }}>
              {followups.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          
          {/* Demographic & KYC */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '16px' }}>
              Demographic & KYC Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Date of Birth</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{customer.dob ? formatDate(customer.dob) : '—'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Gender</span>
                <strong style={{ color: 'var(--color-text-main)', textTransform: 'capitalize' }}>{customer.gender || '—'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>PAN Card</span>
                <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  {customer.pan || '—'}
                </code>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Aadhaar</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{customer.aadhaar || '—'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Occupation</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{customer.occupation || '—'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Annual Income</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{customer.annualIncome ? formatINR(customer.annualIncome) : '—'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>Residential Address</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-body)', marginTop: '4px', lineHeight: 1.4 }}>
                {typeof customer.address === 'object' 
                  ? `${customer.address?.street || ''}, ${customer.address?.city || customer.city || ''} ${customer.address?.state || customer.state || ''} - ${customer.address?.pincode || customer.pincode || ''}` 
                  : customer.address || '—'
                }
              </p>
            </div>

            {/* Nominee Details */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '8px' }}>Nominee Information</h4>
              {customer.nominee?.name ? (
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--color-text-main)' }}>{customer.nominee.name}</strong>
                    <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>{customer.nominee.relation || 'Nominee'}</span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Share: {customer.nominee.share || 100}%
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>No nominee registered</span>
              )}
            </div>
          </div>

          {/* Right: Portfolio Snapshot */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '14px' }}>
              Attached Insurance Policies
            </h3>

            {policies.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Shield size={28} style={{ margin: '0 auto 8px auto', color: 'var(--color-text-light)' }} />
                <p style={{ fontSize: '13px' }}>No policies attached yet.</p>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsPdfModalOpen(true)}
                  style={{ marginTop: '12px', fontSize: '12px' }}
                >
                  <UploadCloud size={13} /> Upload Policy PDF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {policies.map(p => {
                  const days = getDaysRemaining(p.renewalDate || p.endDate);
                  const insurer = p.insuranceCompany || p.insurerName || 'Insurer';
                  const prem = p.premiumAmount || p.premium || p.finalPremium || 0;

                  return (
                    <div 
                      key={p._id || p.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--color-bg)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          {insurer}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                          {p.policyNumber} • {p.policyType || 'General'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                          {formatINR(prem)}
                        </div>
                        <span className={`badge ${days !== null && days <= 30 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                          {days !== null ? (days <= 0 ? 'Due' : `${days}d left`) : 'Active'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Insurance Policies */}
      {activeTab === 'insurance' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Insurance Policies ({policies.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)} style={{ backgroundColor: 'var(--color-accent)' }}>
                <UploadCloud size={14} /> Upload Policy PDF
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsManualPolicyModalOpen(true)}>
                <Plus size={14} /> Add Policy
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Policy Number</th>
                  <th>Insurer</th>
                  <th>Category</th>
                  <th>Sum Assured</th>
                  <th>Annual Premium</th>
                  <th>Commission</th>
                  <th>Renewal Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No insurance policies attached yet. Click "+ Upload Policy PDF" above.
                    </td>
                  </tr>
                ) : (
                  policies.map(p => {
                    const polId = p._id || p.id;
                    const days = getDaysRemaining(p.renewalDate || p.endDate);
                    const prem = p.premiumAmount || p.premium || p.finalPremium || 0;

                    return (
                      <tr key={polId}>
                        <td style={{ paddingLeft: '20px', fontWeight: '700', color: 'var(--color-accent)' }}>
                          {p.policyNumber}
                        </td>
                        <td style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                          {p.insuranceCompany || p.insurerName || '—'}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
                            {p.policyType || 'HEALTH'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--color-text-body)' }}>
                          {p.sumAssured ? formatINR(p.sumAssured) : '—'}
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                          {formatINR(prem)}
                        </td>
                        <td>
                          {p.commission && (p.commission.commissionAmount || p.commission.amount || p.commission.commissionPercentage || p.commission.percentage) ? (
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#15803d' }}>
                                {formatINR(p.commission.commissionAmount ?? p.commission.amount ?? 0)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {(p.commission.commissionType === 'flat' || p.commission.type === 'flat')
                                  ? 'Flat'
                                  : `${p.commission.commissionPercentage ?? p.commission.percentage ?? 0}% (${(p.commission.commissionBasis || p.commission.basis || 'Net').replace(/_/g, ' ')})`}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              Commission not set
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12.5px', fontWeight: '500' }}>
                            {p.renewalDate ? formatDate(p.renewalDate) : (p.endDate ? formatDate(p.endDate) : '—')}
                          </span>
                        </td>
                        <td>
                          <PolicyStatusBadge status={p.status} />
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Set or Edit Policy Commission"
                              onClick={() => setCommissionPolicyTarget(p)}
                              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
                            >
                              <Percent size={12} />
                              <span>Commission</span>
                            </button>
                            <button 
                              title="Send WhatsApp Renewal Notice"
                              onClick={() => handleOpenWhatsapp(p)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#25D366',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MessageSquare size={13} />
                            </button>
                            {p.originalDocumentUrl && (
                              <a
                                href={p.originalDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '5px 8px' }}
                                title="Download S3 Policy PDF"
                              >
                                <FileText size={13} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Centralized Document Vault */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Document Vault ({documents.length})
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)} style={{ backgroundColor: 'var(--color-accent)' }}>
              <UploadCloud size={14} /> Upload Policy PDF to S3
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Document Name</th>
                  <th>Category</th>
                  <th>OCR Verification</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No documents stored in vault yet.
                    </td>
                  </tr>
                ) : (
                  documents.map(d => (
                    <tr key={d._id || d.id}>
                      <td style={{ paddingLeft: '20px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                        {d.fileName}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{d.category || 'Policy Document'}</span>
                      </td>
                      <td>
                        <span className={`badge ${d.verificationState === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                          {d.verificationState || 'Verified'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                        {d.createdAt ? formatDate(d.createdAt) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        {d.blobUrl ? (
                          <a 
                            href={d.blobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} /> View File
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>Stored</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Renewal Follow-ups */}
      {activeTab === 'followups' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Renewal Reminders & Follow-ups ({followups.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Task Description</th>
                  <th>Due Date</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No active renewal follow-ups for this customer.
                    </td>
                  </tr>
                ) : (
                  followups.map(f => (
                    <tr key={f._id || f.id}>
                      <td style={{ paddingLeft: '20px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                        {f.notes || 'Automated Policy Renewal Reminder'}
                      </td>
                      <td style={{ fontWeight: '600', fontSize: '12.5px' }}>
                        {f.dueDate ? formatDate(f.dueDate) : '—'}
                      </td>
                      <td><span className="badge badge-info">{f.type || 'Renewal'}</span></td>
                      <td>
                        <span className={`badge ${f.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {f.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => loadData()}
      />

      <PolicyFormModal
        isOpen={isManualPolicyModalOpen}
        onClose={() => setIsManualPolicyModalOpen(false)}
        customerId={id}
        onSaveSuccess={() => loadData()}
      />

      {whatsappModal && (
        <WhatsappPreviewModal
          isOpen={whatsappModal}
          onClose={() => setWhatsappModal(false)}
          customer={customer}
          policy={selectedPolicyForWhatsapp}
        />
      )}

      {commissionPolicyTarget && (
        <CommissionModal
          isOpen={!!commissionPolicyTarget}
          onClose={() => setCommissionPolicyTarget(null)}
          policy={commissionPolicyTarget}
          commission={commissionPolicyTarget.commission}
          agencyId={agencyId}
          onSaveSuccess={() => loadData()}
          onDeleteSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
