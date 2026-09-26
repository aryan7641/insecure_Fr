import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Calendar, CreditCard, Shield, 
  FileText, CalendarCheck, MessageSquare, Activity, DollarSign, Plus, Eye, Loader, UploadCloud, RefreshCw
} from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { PolicyFormModal } from '../components/insurance/PolicyFormModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';

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

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

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

      // 2. Load Customer's Policies
      const polRes = await apiClient.get(`/agencies/${agencyId}/insurance-policies?customerId=${id}`);
      const polData = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      if (Array.isArray(polData)) {
        setPolicies(polData);
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
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Loader size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <p>Loading customer unified profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Customer Not Found</h3>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>The requested customer record does not exist or has been removed.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/customers')}>
          Back to Directory
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Customer Profile' },
    { id: 'insurance', label: 'Insurance Policies', count: policies.length },
    { id: 'documents', label: 'Document Vault', count: documents.length },
    { id: 'followups', label: 'Renewal Follow-ups', count: followups.length }
  ];

  const totalPremium = policies.reduce((acc, p) => acc + (p.premium || p.finalPremium || 0), 0);
  const activePoliciesCount = policies.filter(p => p.status === 'active' || p.status === 'expiring_soon').length;

  const handleOpenWhatsapp = (policy = null) => {
    setSelectedPolicyForWhatsapp(policy || policies[0] || null);
    setWhatsappModal(true);
  };

  return (
    <div>
      {/* Customer Header Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '22px'
            }}>
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{customer.name}</h1>
                <span className="badge badge-info">
                  Agent: {customer.assignedAgentName || customer.assignedAgentId?.name || 'Assigned Agent'}
                </span>
                {customer.customerType && (
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                    {customer.customerType}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                <span><Phone size={14} style={{ verticalAlign: 'middle' }} /> {customer.mobile}</span>
                <span><Mail size={14} style={{ verticalAlign: 'middle' }} /> {customer.email || '—'}</span>
                <span><CreditCard size={14} style={{ verticalAlign: 'middle' }} /> PAN: {customer.pan || '—'}</span>
                <span><MapPin size={14} style={{ verticalAlign: 'middle' }} /> {customer.city ? `${customer.city}, ${customer.state || ''}` : 'India'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPdfModalOpen(true)}
              style={{ backgroundColor: '#2563eb', color: '#fff' }}
            >
              <UploadCloud size={14} /> Upload Policy PDF (AI OCR)
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleOpenWhatsapp()} 
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Demographic & KYC Information</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><strong>DOB:</strong> {customer.dob ? new Date(customer.dob).toLocaleDateString('en-IN') : '—'}</div>
              <div><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{customer.gender || '—'}</span></div>
              <div><strong>PAN Card:</strong> <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{customer.pan || '—'}</code></div>
              <div><strong>Aadhaar Number:</strong> {customer.aadhaar || '—'}</div>
              <div><strong>Occupation:</strong> {customer.occupation || '—'}</div>
              <div><strong>Annual Income:</strong> ₹ {(customer.annualIncome || customer.income || 0).toLocaleString('en-IN')}</div>
              <div>
                <strong>Residential Address:</strong><br />
                {typeof customer.address === 'object' ? `${customer.address?.street || ''}, ${customer.address?.city || customer.city || ''} ${customer.address?.state || customer.state || ''} - ${customer.address?.pincode || customer.pincode || ''}` : customer.address || '—'}
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '18px', marginBottom: '8px' }}>Nominee Information</h4>
            {customer.nominee?.name ? (
              <div style={{ fontSize: '13px', padding: '10px 12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <div><strong>Name:</strong> {customer.nominee.name}</div>
                <div><strong>Relationship:</strong> {customer.nominee.relation || 'Nominee'}</div>
                <div><strong>Share:</strong> {customer.nominee.share || 100}%</div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No nominee specified</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Insurance Portfolio Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active Policies</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-accent)' }}>
                  {activePoliciesCount}
                </div>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Annual Premium</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>
                  ₹ {totalPremium.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Upcoming Renewals</h4>
            {policies.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No policies currently active</div>
            ) : (
              policies.map(p => {
                const renewalStr = p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                return (
                  <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{p.insuranceCompany}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.policyNumber} ({p.subLob || p.policyType})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: 'var(--color-warning)' }}>{renewalStr}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>₹ {(p.premium || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Insurance Policies */}
      {activeTab === 'insurance' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Attached Insurance Policies</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)} style={{ backgroundColor: '#2563eb' }}>
                <UploadCloud size={14} /> Upload Policy PDF (AI OCR)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsManualPolicyModalOpen(true)}>
                <Plus size={14} /> Add Policy
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Number</th>
                <th>Insurer</th>
                <th>Category & Plan</th>
                <th>Sum Assured</th>
                <th>Premium (INR)</th>
                <th>Renewal Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No insurance policies attached yet. Click "+ Upload Policy PDF (AI OCR)" above.
                  </td>
                </tr>
              ) : (
                policies.map(p => {
                  const polId = p._id || p.id;
                  const renewalFormatted = p.renewalDate ? new Date(p.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  const premiumFormatted = (p.premium || p.finalPremium || 0).toLocaleString('en-IN');

                  return (
                    <tr key={polId}>
                      <td style={{ fontWeight: '700', color: 'var(--color-accent)' }}>
                        {p.policyNumber}
                      </td>
                      <td style={{ fontWeight: '500' }}>{p.insuranceCompany}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{p.policyType}</span>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {p.vehicleDetails?.registrationNumber ? `${p.vehicleDetails.registrationNumber} (${p.vehicleDetails.make} ${p.vehicleDetails.model})` : (p.productName || p.planName || 'Comprehensive')}
                        </div>
                      </td>
                      <td>{p.sumAssured ? `₹ ${(p.sumAssured).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                        ₹ {premiumFormatted}
                      </td>
                      <td style={{ fontWeight: '600' }}>{renewalFormatted}</td>
                      <td><PolicyStatusBadge status={p.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Send WhatsApp Renewal Notice"
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
                              title="Download Original S3 Policy PDF"
                            >
                              <FileText size={14} />
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
      )}

      {/* Tab 3: Centralized Document Vault */}
      {activeTab === 'documents' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Customer Centralized Document Vault</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)} style={{ backgroundColor: '#2563eb' }}>
              <UploadCloud size={14} /> Upload Policy PDF to S3
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Verification State</th>
                <th>Uploaded Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No documents uploaded yet for this customer.
                  </td>
                </tr>
              ) : (
                documents.map(d => (
                  <tr key={d._id || d.id}>
                    <td style={{ fontWeight: '600' }}>{d.fileName}</td>
                    <td><span className="badge badge-neutral">{d.category}</span></td>
                    <td>
                      <span className={`badge ${d.verificationState === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                        {d.verificationState || d.ocrStatus || 'Verified'}
                      </span>
                    </td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      {d.blobUrl ? (
                        <a 
                          href={d.blobUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={14} /> View File
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Stored</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Renewal Follow-ups */}
      {activeTab === 'followups' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Renewal Reminders & Tasks</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task / Reminder</th>
                <th>Due Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {followups.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No pending renewal follow-ups for this customer.
                  </td>
                </tr>
              ) : (
                followups.map(f => (
                  <tr key={f._id || f.id}>
                    <td style={{ fontWeight: '500' }}>{f.notes || 'Automated Policy Renewal Reminder'}</td>
                    <td style={{ fontWeight: '600' }}>
                      {f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
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
      )}

      {/* Policy PDF AI OCR Modal */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => loadData()}
      />

      {/* Manual Policy Entry Modal */}
      <PolicyFormModal
        isOpen={isManualPolicyModalOpen}
        onClose={() => setIsManualPolicyModalOpen(false)}
        customerId={id}
        onSaveSuccess={() => loadData()}
      />

      {/* WhatsApp Modal */}
      <WhatsappPreviewModal
        isOpen={whatsappModal}
        onClose={() => setWhatsappModal(false)}
        customer={customer}
        policy={selectedPolicyForWhatsapp}
      />
    </div>
  );
};
