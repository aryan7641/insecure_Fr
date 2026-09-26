import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Search, Filter, Phone, Mail, Calendar, 
  MessageSquare, UserCheck, CheckCircle, Clock, AlertCircle, 
  ArrowRight, Shield, RefreshCw, Loader, MoreHorizontal, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';

const LEAD_STAGES = [
  { id: 'all', label: 'All Leads' },
  { id: 'new', label: 'New Inquiries' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'proposal_sent', label: 'Proposal Sent' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Won / Converted' },
  { id: 'lost', label: 'Lost' }
];

export const LeadsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    leadSource: 'Referral',
    productInterest: 'health',
    expectedPremium: '',
    priority: 'medium',
    status: 'new',
    nextFollowUpDate: '',
    notes: ''
  });

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  // Load leads from storage / backend
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch customers with lead tags or stored leads
      const localLeads = JSON.parse(localStorage.getItem(`insecure_leads_${agencyId}`) || '[]');
      if (localLeads.length > 0) {
        setLeads(localLeads);
      } else {
        // Initial sample leads
        const initialLeads = [
          {
            id: 'lead-1',
            name: 'Vikramaditya Singhania',
            mobile: '9820192837',
            email: 'vikram.singhania@apexcorp.in',
            leadSource: 'Walk-in Referral',
            productInterest: 'health',
            expectedPremium: 35000,
            status: 'proposal_sent',
            priority: 'high',
            nextFollowUpDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
            notes: 'Looking for 25L family floater covering senior citizen parents with zero copay.',
            assignedAgentId: currentUser?._id || currentUser?.id,
            createdAt: new Date().toISOString()
          },
          {
            id: 'lead-2',
            name: 'Pooja Deshmukh',
            mobile: '9987612345',
            email: 'pooja.deshmukh@gmail.com',
            leadSource: 'Web Campaign',
            productInterest: 'motor',
            expectedPremium: 18500,
            status: 'contacted',
            priority: 'medium',
            nextFollowUpDate: new Date(Date.now() + 48*60*60*1000).toISOString(),
            notes: 'Hyundai Creta comprehensive renewal quote comparison.',
            assignedAgentId: currentUser?._id || currentUser?.id,
            createdAt: new Date().toISOString()
          },
          {
            id: 'lead-3',
            name: 'Anand Kumar Varma',
            mobile: '9765432109',
            email: 'anand.varma@techsolutions.com',
            leadSource: 'Client Referral',
            productInterest: 'term',
            expectedPremium: 28000,
            status: 'new',
            priority: 'high',
            nextFollowUpDate: new Date().toISOString(),
            notes: '1 Crore pure term plan with critical illness rider.',
            assignedAgentId: currentUser?._id || currentUser?.id,
            createdAt: new Date().toISOString()
          }
        ];
        setLeads(initialLeads);
        localStorage.setItem(`insecure_leads_${agencyId}`, JSON.stringify(initialLeads));
      }
    } catch (err) {
      console.warn('Failed to load leads:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId, currentUser]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const saveLeadsToStorage = (updatedLeads) => {
    setLeads(updatedLeads);
    localStorage.setItem(`insecure_leads_${agencyId}`, JSON.stringify(updatedLeads));
  };

  const handleCreateOrUpdateLead = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      addToast('Name and mobile number are required', 'warning');
      return;
    }

    if (editingLead) {
      const updated = leads.map(l => l.id === editingLead.id ? { ...l, ...formData } : l);
      saveLeadsToStorage(updated);
      addToast('Lead updated successfully', 'success');
    } else {
      const newLead = {
        id: `lead-${Date.now()}`,
        ...formData,
        expectedPremium: Number(formData.expectedPremium) || 0,
        assignedAgentId: currentUser?._id || currentUser?.id,
        createdAt: new Date().toISOString()
      };
      saveLeadsToStorage([newLead, ...leads]);
      addToast('Lead created successfully', 'success');
    }

    setIsCreateModalOpen(false);
    setEditingLead(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      leadSource: 'Referral',
      productInterest: 'health',
      expectedPremium: '',
      priority: 'medium',
      status: 'new',
      nextFollowUpDate: '',
      notes: ''
    });
  };

  const handleConvertToCustomer = async (lead) => {
    try {
      // 1. Create real customer on backend API
      const res = await apiClient.post(`/agencies/${agencyId}/customers`, {
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email || undefined,
        notes: `Converted from lead (${lead.productInterest.toUpperCase()}). Initial notes: ${lead.notes || 'None'}`
      });

      // 2. Mark lead as won
      const updated = leads.map(l => l.id === lead.id ? { ...l, status: 'won' } : l);
      saveLeadsToStorage(updated);

      addToast(`Lead successfully converted to Customer: ${lead.name}`, 'success');
      
      const createdCustomer = res?.data?.customer || res?.data;
      if (createdCustomer?._id || createdCustomer?.id) {
        navigate(`/customers/${createdCustomer._id || createdCustomer.id}`);
      } else {
        navigate('/customers');
      }
    } catch (err) {
      addToast(err.message || 'Failed to convert lead to customer', 'danger');
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    if (activeStage !== 'all' && lead.status !== activeStage) return false;
    if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = lead.name?.toLowerCase().includes(q);
      const mobMatch = lead.mobile?.includes(q);
      const emailMatch = lead.email?.toLowerCase().includes(q);
      if (!nameMatch && !mobMatch && !emailMatch) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Lead Pipeline</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Capture prospect inquiries, track sales stages, and convert leads into lifelong policyholders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadLeads}
            title="Refresh Leads"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingLead(null);
              setFormData({
                name: '',
                mobile: '',
                email: '',
                leadSource: 'Referral',
                productInterest: 'health',
                expectedPremium: '',
                priority: 'medium',
                status: 'new',
                nextFollowUpDate: '',
                notes: ''
              });
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={16} /> New Prospect Lead
          </button>
        </div>
      </div>

      {/* Stage Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {LEAD_STAGES.map(stage => {
          const count = stage.id === 'all' 
            ? leads.length 
            : leads.filter(l => l.status === stage.id).length;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeStage === stage.id ? '600' : '500',
                color: activeStage === stage.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderBottom: activeStage === stage.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <span>{stage.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: activeStage === stage.id ? 'var(--color-accent-light)' : 'var(--color-bg)',
                color: activeStage === stage.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontWeight: '700'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search leads by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <select 
          className="select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Leads Grid / Cards */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading prospects...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <UserPlus size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>No leads found in this view</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Click "New Prospect Lead" above to record a new client inquiry.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredLeads.map((lead) => {
            const lob = getLOBBadge(lead.productInterest);

            return (
              <div 
                key={lead.id}
                className="card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${lead.priority === 'high' ? 'var(--color-danger)' : lead.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-accent)'}`
                }}
              >
                <div>
                  {/* Lead Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {lead.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '700', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: lob.bg, 
                          color: lob.color,
                          border: `1px solid ${lob.border}`
                        }}>
                          {lob.label}
                        </span>
                        <span className={`badge ${lead.priority === 'high' ? 'badge-danger' : lead.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                          {lead.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', textAlign: 'right' }}>
                      {formatINR(lead.expectedPremium)}
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                        Exp. Premium
                      </div>
                    </div>
                  </div>

                  {/* Contact & Meta */}
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} /> <span>{lead.mobile}</span>
                    </div>
                    {lead.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{lead.email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock size={12} /> <span>Source: <strong>{lead.leadSource}</strong></span>
                    </div>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div style={{ 
                      padding: '8px 10px', 
                      backgroundColor: 'var(--color-bg)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '11px', 
                      color: 'var(--color-text-main)',
                      marginBottom: '14px',
                      lineHeight: '1.4'
                    }}>
                      "{lead.notes}"
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ 
                  paddingTop: '12px', 
                  borderTop: '1px solid var(--color-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 8px' }}
                      title="WhatsApp Outreach"
                      onClick={() => setWhatsappCustomer({ name: lead.name, mobile: lead.mobile })}
                    >
                      <MessageSquare size={13} />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '6px 8px' }}
                      onClick={() => {
                        setEditingLead(lead);
                        setFormData({
                          name: lead.name,
                          mobile: lead.mobile,
                          email: lead.email || '',
                          leadSource: lead.leadSource || 'Referral',
                          productInterest: lead.productInterest || 'health',
                          expectedPremium: lead.expectedPremium || '',
                          priority: lead.priority || 'medium',
                          status: lead.status || 'new',
                          nextFollowUpDate: lead.nextFollowUpDate || '',
                          notes: lead.notes || ''
                        });
                        setIsCreateModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  {lead.status !== 'won' ? (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => handleConvertToCustomer(lead)}
                    >
                      Convert to Customer <ArrowRight size={12} />
                    </button>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      <CheckCircle size={12} style={{ marginRight: '4px' }} /> Converted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Lead Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingLead ? "Edit Lead Information" : "Create New Insurance Prospect"}
        >
          <form onSubmit={handleCreateOrUpdateLead}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="label">Prospect Name *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. Anand Varma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. anand@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Lead Source</label>
                <select
                  className="select"
                  value={formData.leadSource}
                  onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                >
                  <option value="Referral">Client Referral</option>
                  <option value="Web Campaign">Web / Social Campaign</option>
                  <option value="Walk-in">Walk-in Inquiry</option>
                  <option value="Cold Call">Cold Outreach</option>
                  <option value="Partner">Broker / Partner</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="label">Product Interest</label>
                <select
                  className="select"
                  value={formData.productInterest}
                  onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                >
                  <option value="health">Health Insurance</option>
                  <option value="motor">Motor Insurance</option>
                  <option value="life">Life Insurance</option>
                  <option value="term">Term Life</option>
                  <option value="travel">Travel Insurance</option>
                  <option value="home">Home Insurance</option>
                  <option value="commercial">Commercial / Group</option>
                </select>
              </div>

              <div>
                <label className="label">Expected Premium (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 25000"
                  value={formData.expectedPremium}
                  onChange={(e) => setFormData({ ...formData, expectedPremium: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Priority</label>
                <select
                  className="select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="label">Sales Pipeline Stage</label>
                <select
                  className="select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="new">New Inquiry</option>
                  <option value="contacted">Contacted</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won / Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="label">Next Follow-up Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.nextFollowUpDate ? formData.nextFollowUpDate.slice(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="label">Requirements / Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Specific sum insured requirements, existing policy details, preferred insurers..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {editingLead ? "Save Changes" : "Create Lead"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* WhatsApp Outreach Modal */}
      {whatsappCustomer && (
        <WhatsappPreviewModal
          isOpen={!!whatsappCustomer}
          onClose={() => setWhatsappCustomer(null)}
          customer={whatsappCustomer}
        />
      )}
    </div>
  );
};
