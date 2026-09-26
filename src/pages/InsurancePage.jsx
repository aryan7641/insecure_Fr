import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Shield, Search, Filter, UploadCloud, MessageSquare, 
  RefreshCw, FileText, Loader, ExternalLink, AlertCircle, CheckCircle
} from 'lucide-react';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { PolicyFormModal } from '../components/insurance/PolicyFormModal';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';

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
      if (p.policyType?.toLowerCase() !== typeFilter.toLowerCase()) return false;
    }

    // Search query
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const polNum = (p.policyNumber || '').toLowerCase();
      const custName = (p.customerId?.name || p.customerName || '').toLowerCase();
      const insurer = (p.insuranceCompany || '').toLowerCase();
      const vehReg = (p.vehicleDetails?.registrationNumber || '').toLowerCase();
      const plan = (p.productName || p.planName || '').toLowerCase();

      if (!polNum.includes(q) && !custName.includes(q) && !insurer.includes(q) && !vehReg.includes(q) && !plan.includes(q)) {
        return false;
      }
    }

    // Expiring within days
    if (expiringFilter !== 'ALL' && p.renewalDate) {
      const diffDays = Math.ceil((new Date(p.renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
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

  const calculateDaysRemaining = (renewalDate) => {
    if (!renewalDate) return null;
    const diff = Math.ceil((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>Expired ({Math.abs(diff)}d ago)</span>;
    if (diff === 0) return <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>Due Today</span>;
    if (diff <= 30) return <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>Due in {diff} days</span>;
    return <span style={{ color: 'var(--color-text-muted)' }}>{diff} days</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Policy Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Centralized Indian Insurance CRM: Health, Motor, Life, Term, General. Automated renewal tracking.
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
          <button 
            className="btn btn-primary"
            onClick={() => setIsPdfModalOpen(true)}
            style={{ backgroundColor: '#2563eb' }}
          >
            <UploadCloud size={16} /> Upload Policy PDF (AI OCR)
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsManualModalOpen(true)}
          >
            <Plus size={16} /> Manual Entry
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search policy #, customer, insurer, vehicle reg (e.g. MH02EK4921)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Insurance Lines</option>
          <option value="health">Health Insurance</option>
          <option value="motor">Motor Insurance</option>
          <option value="term">Term Life Insurance</option>
          <option value="life">Life Insurance</option>
          <option value="travel">Travel Insurance</option>
          <option value="home">Home Insurance</option>
          <option value="commercial">Commercial Insurance</option>
          <option value="group">Group Insurance</option>
          <option value="other">Other Insurance</option>
        </select>

        <select
          className="form-select"
          style={{ width: '160px' }}
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
          className="form-select"
          style={{ width: '180px' }}
          value={expiringFilter}
          onChange={(e) => setExpiringFilter(e.target.value)}
        >
          <option value="ALL">All Renewal Dates</option>
          <option value="7">Expiring in 7 Days</option>
          <option value="15">Expiring in 15 Days</option>
          <option value="30">Expiring in 30 Days</option>
        </select>
      </div>

      {/* Policies Data Table */}
      <div className="table-container">
        {loading && policies.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading insurance policies from database...</p>
          </div>
        ) : displayedPolicies.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Shield size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No policies found</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Click <strong>"Upload Policy PDF (AI OCR)"</strong> above to extract and create your first policy.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Details</th>
                <th>Customer</th>
                <th>Plan / Vehicle Details</th>
                <th>Sum Assured & Premium</th>
                <th>Renewal Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedPolicies.map(p => {
                const polId = p.id || p._id;
                const cust = p.customerId;
                const custName = cust?.name || p.customerName || 'Customer';
                const custId = cust?._id || cust?.id;
                const premiumFormatted = (p.premium || p.finalPremium || 0).toLocaleString('en-IN');
                const sumAssuredFormatted = p.sumAssured ? `₹ ${(p.sumAssured).toLocaleString('en-IN')}` : '—';
                const renewalFormatted = p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                return (
                  <tr key={polId}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--color-accent)' }}>
                        {p.policyNumber}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                        {p.insuranceCompany}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {p.subLob || p.policyType?.toUpperCase()}
                      </div>
                    </td>

                    <td>
                      <div 
                        style={{ fontWeight: '600', cursor: custId ? 'pointer' : 'default', color: custId ? 'var(--color-primary)' : 'inherit' }}
                        onClick={() => custId && navigate(`/customers/${custId}`)}
                      >
                        {custName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {cust?.mobile || p.customerMobile || '—'}
                      </div>
                    </td>

                    <td>
                      {p.policyType === 'motor' && p.vehicleDetails?.registrationNumber ? (
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px' }}>
                            {p.vehicleDetails.registrationNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {p.vehicleDetails.make} {p.vehicleDetails.model} {p.vehicleDetails.variant || ''}
                          </div>
                          {p.vehicleDetails.idv && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              IDV: ₹{Number(p.vehicleDetails.idv).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '13px' }}>
                            {p.productName || p.planName || 'Comprehensive Coverage'}
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
                      <div style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                        ₹ {premiumFormatted}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {p.premiumFrequency || 'yearly'} • Sum: {sumAssuredFormatted}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>
                        {renewalFormatted}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        {calculateDaysRemaining(p.renewalDate)}
                      </div>
                    </td>

                    <td>
                      <PolicyStatusBadge status={p.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Send WhatsApp Renewal Reminder"
                          onClick={() => handleOpenWhatsapp(p)}
                          style={{ color: '#25D366' }}
                        >
                          <MessageSquare size={14} />
                        </button>

                        {p.originalDocumentUrl && (
                          <a
                            href={p.originalDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="View Original S3 Policy PDF"
                          >
                            <FileText size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Policy PDF AI OCR Upload Modal */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => fetchPolicies()}
      />

      {/* Manual Policy Entry Modal */}
      <PolicyFormModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSaveSuccess={() => fetchPolicies()}
      />

      {/* WhatsApp Click-to-Chat Modal */}
      <WhatsappPreviewModal
        isOpen={!!whatsappCustomer}
        onClose={() => { setWhatsappCustomer(null); setSelectedPolicyForWhatsapp(null); }}
        customer={whatsappCustomer}
        policy={selectedPolicyForWhatsapp}
      />
    </div>
  );
};
