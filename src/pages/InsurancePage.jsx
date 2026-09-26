import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Shield, Search, Filter, UploadCloud, MessageSquare, 
  RefreshCw, FileText, Loader, ExternalLink, AlertCircle, CheckCircle, ChevronRight, User
} from 'lucide-react';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { PolicyFormModal } from '../components/insurance/PolicyFormModal';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getDaysRemaining, getLOBBadge } from '../utils/formatters';

export const InsurancePage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expiringFilter, setExpiringFilter] = useState('ALL');

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [selectedPolicyForWhatsapp, setSelectedPolicyForWhatsapp] = useState(null);

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
      console.warn('Failed to load policies from backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchPolicies();

    const handleSync = () => fetchPolicies();
    window.addEventListener('policyCreated', handleSync);
    window.addEventListener('customerCreated', handleSync);
    return () => {
      window.removeEventListener('policyCreated', handleSync);
      window.removeEventListener('customerCreated', handleSync);
    };
  }, [fetchPolicies]);

  // Filter policies based on role, search, status, type, and renewal window
  const displayedPolicies = policies.filter(p => {
    // RBAC: Agents see only their assigned policies
    const agentId = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
    if (!isAdmin && agentId && agentId !== (currentUser?._id || currentUser?.id)) return false;

    // Status filter
    if (statusFilter !== 'ALL') {
      if (p.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Type / LOB filter
    if (typeFilter !== 'ALL') {
      const polLob = (p.lob || p.policyType || '').toLowerCase();
      if (polLob !== typeFilter.toLowerCase()) return false;
    }

    // Search query
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const polNum = (p.policyNumber || '').toLowerCase();
      const custName = (p.customerId?.name || p.customerName || '').toLowerCase();
      const insurer = (p.insuranceCompany || p.insurerName || '').toLowerCase();
      const vehReg = (p.vehicleDetails?.registrationNumber || '').toLowerCase();
      const plan = (p.productName || p.planName || '').toLowerCase();

      if (!polNum.includes(q) && !custName.includes(q) && !insurer.includes(q) && !vehReg.includes(q) && !plan.includes(q)) {
        return false;
      }
    }

    // Expiring within days
    if (expiringFilter !== 'ALL' && (p.renewalDate || p.endDate)) {
      const targetDate = p.renewalDate || p.endDate;
      const diffDays = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
      const targetDays = parseInt(expiringFilter, 10);
      if (diffDays < 0 || diffDays > targetDays) return false;
    }

    return true;
  });

  const handleOpenWhatsapp = (policy) => {
    const cust = policy.customerId || { name: policy.customerName, mobile: policy.customerMobile };
    setWhatsappCustomer(cust);
    setSelectedPolicyForWhatsapp(policy);
  };

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Policy Management
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {displayedPolicies.length} Policies
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            Multi-insurer portfolio spanning Health, Motor, Life, Term, Travel, Home, and Commercial policies.
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

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsManualModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Manual Entry</span>
          </button>

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
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
            placeholder="Search policy #, client name, insurer, vehicle reg..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '160px', fontSize: '13px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Lines (LOB)</option>
          <option value="health">Health</option>
          <option value="motor">Motor</option>
          <option value="term">Term</option>
          <option value="life">Life</option>
          <option value="travel">Travel</option>
          <option value="home">Home</option>
          <option value="commercial">Commercial</option>
          <option value="general">General</option>
        </select>

        <select
          className="select"
          style={{ width: '140px', fontSize: '13px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="renewed">Renewed</option>
        </select>

        <select
          className="select"
          style={{ width: '160px', fontSize: '13px' }}
          value={expiringFilter}
          onChange={(e) => setExpiringFilter(e.target.value)}
        >
          <option value="ALL">All Expiry Windows</option>
          <option value="7">Expiring in 7 Days</option>
          <option value="15">Expiring in 15 Days</option>
          <option value="30">Expiring in 30 Days</option>
        </select>
      </div>

      {/* Policies Data Table */}
      {loading && policies.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading policy portfolio...</p>
        </div>
      ) : displayedPolicies.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>No policies found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px auto' }}>
            {searchTerm ? 'No policy matched your search criteria. Try a different query.' : 'Upload your first insurance policy PDF (AI OCR) to start building your book.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)}>
            <UploadCloud size={14} /> Upload Policy PDF
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Policy & Insurer</th>
                  <th>Client</th>
                  <th>Coverage & Plan</th>
                  <th>Sum Assured</th>
                  <th>Premium</th>
                  <th>Renewal Countdown</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPolicies.map(p => {
                  const polId = p.id || p._id;
                  const cust = p.customerId;
                  const custName = cust?.name || p.customerName || 'Insured Client';
                  const custId = cust?._id || cust?.id;
                  const insurer = p.insuranceCompany || p.insurerName || 'Insurer';
                  const lob = p.lob || p.policyType || 'General';
                  const prem = p.premiumAmount || p.premium || p.finalPremium || 0;
                  const days = getDaysRemaining(p.renewalDate || p.endDate);

                  return (
                    <tr key={polId}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--color-accent)' }}>
                            {p.policyNumber || 'Draft'}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-main)', marginTop: '1px' }}>
                            {insurer}
                          </div>
                          <span className="badge badge-neutral" style={{ fontSize: '10px', marginTop: '2px', textTransform: 'uppercase' }}>
                            {lob}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div 
                          style={{ fontWeight: '600', fontSize: '13px', color: custId ? 'var(--color-text-main)' : 'inherit', cursor: custId ? 'pointer' : 'default' }}
                          onClick={() => custId && navigate(`/customers/${custId}`)}
                        >
                          {custName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                          {cust?.mobile || p.customerMobile || '—'}
                        </div>
                      </td>

                      <td>
                        {p.policyType === 'motor' && p.vehicleDetails?.registrationNumber ? (
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-main)' }}>
                              {p.vehicleDetails.registrationNumber}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                              {p.vehicleDetails.make} {p.vehicleDetails.model}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                              {p.productName || p.planName || 'Comprehensive Plan'}
                            </div>
                            {p.insuredMembers?.length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {p.insuredMembers.length} Insured Lives
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--color-text-body)' }}>
                          {p.sumAssured ? formatINR(p.sumAssured) : '—'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                          {formatINR(prem)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {p.premiumFrequency || 'Yearly'}
                        </div>
                      </td>

                      <td>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '500' }}>
                            {p.renewalDate ? formatDate(p.renewalDate) : (p.endDate ? formatDate(p.endDate) : '—')}
                          </div>
                          {days !== null && (
                            <span className={`badge ${days < 0 ? 'badge-danger' : days <= 7 ? 'badge-warning' : days <= 30 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                              {days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due Today' : `${days}d left`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <PolicyStatusBadge status={p.status} />
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => fetchPolicies()}
      />

      <PolicyFormModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveSuccess={() => fetchPolicies()}
      />

      {whatsappCustomer && (
        <WhatsappPreviewModal
          isOpen={!!whatsappCustomer}
          onClose={() => { setWhatsappCustomer(null); setSelectedPolicyForWhatsapp(null); }}
          customer={whatsappCustomer}
          policy={selectedPolicyForWhatsapp}
        />
      )}
    </div>
  );
};
