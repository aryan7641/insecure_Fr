import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone, Shield, TrendingUp, UserCheck, MessageSquare, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { ReassignCustomerModal } from '../components/customers/ReassignCustomerModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('ALL');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [reassignCustomer, setReassignCustomer] = useState(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

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
  }, [fetchCustomers]);

  // Filter based on role and search query
  const displayedCustomers = customers.filter(c => {
    const agentId = c.assignedAgentId?._id || c.assignedAgentId?.id || c.assignedAgentId;
    if (!isAdmin && agentId && agentId !== (currentUser?._id || currentUser?.id)) return false;
    if (selectedAgentFilter !== 'ALL' && agentId !== selectedAgentFilter) return false;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.pan && c.pan.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Unified Customer Directory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Unified profile managing Insurance policies & Mutual Fund investments.
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
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search by customer name, mobile, PAN card..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isAdmin && (
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
          >
            <option value="ALL">All Assigned Agents</option>
            <option value="user-agent-1">Priya Sundaram</option>
            <option value="user-agent-2">Amitabh Sharma</option>
          </select>
        )}
      </div>

      {/* Customers Table */}
      <div className="table-container">
        {loading && customers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading customers from database...</p>
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No customers found</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Click "+ Add Customer" above to create a new customer record.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile / Primary ID</th>
                <th>PAN Number</th>
                <th>Assigned Agent</th>
                <th>Insurance Policies</th>
                <th>Mutual Fund Valuation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedCustomers.map(c => {
                const customerId = c.id || c._id;
                const agentName = c.assignedAgentName || c.assignedAgentId?.name || (typeof c.assignedAgentId === 'string' ? c.assignedAgentId : 'Unassigned');
                const activePolicies = c.insuranceSummary?.activePolicies ?? 0;
                const totalPremium = c.insuranceSummary?.totalPremium ?? 0;
                const currentPortfolioValue = c.mfSummary?.currentPortfolioValue ?? 0;

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
                        <Phone size={14} style={{ color: 'var(--color-text-muted)' }} />
                        {c.mobile}
                      </div>
                    </td>
                    <td>
                      <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {c.pan || '—'}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {agentName}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} style={{ color: 'var(--color-info)' }} />
                        <span>{activePolicies} Active (₹ {totalPremium.toLocaleString('en-IN')}/yr)</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--color-success)' }}>
                        <TrendingUp size={14} />
                        <span>₹ {currentPortfolioValue.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Send WhatsApp Message"
                          onClick={() => setWhatsappCustomer(c)}
                          style={{ color: '#25D366' }}
                        >
                          <MessageSquare size={14} />
                        </button>

                        {isAdmin && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Reassign Agent"
                            onClick={() => setReassignCustomer(c)}
                          >
                            <UserCheck size={14} /> Reassign
                          </button>
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

      <WhatsappPreviewModal
        isOpen={!!whatsappCustomer}
        onClose={() => setWhatsappCustomer(null)}
        customer={whatsappCustomer}
      />
    </div>
  );
};
