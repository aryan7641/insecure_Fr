import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Phone, Shield, UserCheck, 
  MessageSquare, Loader, RefreshCw, MapPin, CreditCard, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { ReassignCustomerModal } from '../components/customers/ReassignCustomerModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { formatINR, formatDate } from '../utils/formatters';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [reassignCustomer, setReassignCustomer] = useState(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const fetchCustomers = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/customers`);
      const items = res?.data?.customers || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setCustomers(items);
      }
    } catch (err) {
      console.warn('Failed to load customers from backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchCustomers();

    const handleCustomerCreated = () => fetchCustomers();
    window.addEventListener('customerCreated', handleCustomerCreated);
    window.addEventListener('policyCreated', handleCustomerCreated);
    return () => {
      window.removeEventListener('customerCreated', handleCustomerCreated);
      window.removeEventListener('policyCreated', handleCustomerCreated);
    };
  }, [fetchCustomers]);

  // Filter based on role, search query, and customer type
  const displayedCustomers = customers.filter(c => {
    const agentId = c.assignedAgentId?._id || c.assignedAgentId?.id || c.assignedAgentId;
    if (!isAdmin && agentId && agentId !== (currentUser?._id || currentUser?.id)) return false;

    if (typeFilter !== 'ALL') {
      const cType = (c.customerType || 'individual').toLowerCase();
      if (cType !== typeFilter.toLowerCase()) return false;
    }

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.pan && c.pan.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Customer 360 Directory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Unified client profiles managing insurance portfolios, S3 documents, and renewal lifecycles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchCustomers}
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', width: '100%' }}
            placeholder="Search by customer name, mobile number, PAN, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Account Types</option>
          <option value="individual">Individual</option>
          <option value="corporate">Corporate / SME</option>
          <option value="hni">HNI</option>
        </select>
      </div>

      {/* Customers Table */}
      {loading && customers.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading customer records...</p>
        </div>
      ) : displayedCustomers.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <UserPlus size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>No customers found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Click "+ Add Customer" or "Upload Policy PDF (AI OCR)" to register new clients.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Primary Mobile</th>
                  <th>Location</th>
                  <th>PAN</th>
                  <th>Account Type</th>
                  <th>Insurance Portfolio</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map(c => {
                  const customerId = c.id || c._id;
                  const activePolicies = c.insuranceSummary?.activePolicies ?? 0;
                  const totalPremium = c.insuranceSummary?.totalPremium ?? 0;

                  return (
                    <tr key={customerId}>
                      <td>
                        <div 
                          style={{ fontWeight: '700', color: 'var(--color-accent)', cursor: 'pointer' }}
                          onClick={() => navigate(`/customers/${customerId}`)}
                        >
                          {c.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.email || '—'}</div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                          <Phone size={13} style={{ color: 'var(--color-text-muted)' }} />
                          {c.mobile}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: 'var(--color-text-muted)' }} />
                          {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : (c.address?.city || 'India')}
                        </div>
                      </td>

                      <td>
                        <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                          {c.pan || '—'}
                        </code>
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {c.customerType || 'Individual'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} style={{ color: 'var(--color-accent)' }} />
                          <span style={{ fontWeight: '600', fontSize: '13px' }}>
                            {activePolicies} Active <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>({formatINR(totalPremium)}/yr)</span>
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Send WhatsApp Message"
                            onClick={() => setWhatsappCustomer(c)}
                            style={{ color: '#16a34a', borderColor: '#bbf7d0', padding: '6px 8px' }}
                          >
                            <MessageSquare size={13} />
                          </button>

                          {isAdmin && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Reassign Agent"
                              onClick={() => setReassignCustomer(c)}
                              style={{ padding: '6px 8px' }}
                            >
                              <UserCheck size={13} />
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/customers/${customerId}`)}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            360 View <ArrowUpRight size={12} />
                          </button>
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
      <CustomerFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveSuccess={() => fetchCustomers()}
      />

      <ReassignCustomerModal
        isOpen={!!reassignCustomer}
        onClose={() => setReassignCustomer(null)}
        customer={reassignCustomer}
        onSaveSuccess={() => fetchCustomers()}
      />

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
