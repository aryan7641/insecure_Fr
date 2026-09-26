import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Phone, Shield, UserCheck, 
  MessageSquare, Loader, RefreshCw, MapPin, CreditCard, ArrowUpRight,
  Mail, Users, Filter, ChevronRight
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
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Customer Directory
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {displayedCustomers.length} Clients
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            Unified Indian client profiles managing multi-insurer insurance portfolios, documents, and renewals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchCustomers}
            title="Refresh List"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-accent)'
            }}
          >
            <UserPlus size={14} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
            placeholder="Search by client name, mobile, PAN, city, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '170px', fontSize: '13px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Account Types</option>
          <option value="individual">Individual</option>
          <option value="corporate">Corporate / SME</option>
          <option value="hni">HNI</option>
        </select>
      </div>

      {/* Customers Table / Card List */}
      {loading && customers.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading client profiles...</p>
        </div>
      ) : displayedCustomers.length === 0 ? (
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
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>No clients found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px auto' }}>
            {searchTerm ? 'No customer matches your search criteria. Try a different query.' : 'Click "Add Customer" or "Upload Policy PDF" to onboard your first client.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <UserPlus size={14} /> Add First Customer
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Client Profile</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Tax ID (PAN)</th>
                  <th>Type</th>
                  <th>Portfolio Volume</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map(c => {
                  const customerId = c.id || c._id;
                  const activePolicies = c.insuranceSummary?.activePolicies ?? 0;
                  const totalPremium = c.insuranceSummary?.totalPremium ?? 0;
                  const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';

                  return (
                    <tr key={customerId} style={{ transition: 'background-color 0.15s ease' }}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: 'var(--color-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div 
                              style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--color-text-main)', cursor: 'pointer' }}
                              onClick={() => navigate(`/customers/${customerId}`)}
                            >
                              {c.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {c.email || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                          <Phone size={13} style={{ color: 'var(--color-text-light)' }} />
                          {c.mobile || '—'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--color-text-body)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} style={{ color: 'var(--color-text-light)' }} />
                          {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : (c.address?.city || 'India')}
                        </div>
                      </td>

                      <td>
                        {c.pan ? (
                          <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600', color: 'var(--color-text-body)' }}>
                            {c.pan}
                          </code>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                          {c.customerType || 'Individual'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={13} style={{ color: 'var(--color-accent)' }} />
                          <span style={{ fontWeight: '600', fontSize: '12.5px', color: 'var(--color-text-main)' }}>
                            {activePolicies} Active
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '11.5px' }}>
                            ({formatINR(totalPremium)}/yr)
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            title="Send WhatsApp Message"
                            onClick={() => setWhatsappCustomer(c)}
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

                          {isAdmin && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Reassign Agent"
                              onClick={() => setReassignCustomer(c)}
                              style={{ padding: '5px 8px' }}
                            >
                              <UserCheck size={13} />
                            </button>
                          )}

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/customers/${customerId}`)}
                            style={{ padding: '4px 10px', fontSize: '11.5px', backgroundColor: 'var(--color-accent)' }}
                          >
                            <span>Profile</span>
                            <ChevronRight size={13} />
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
