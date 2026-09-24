import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone, Shield, TrendingUp, UserCheck, MessageSquare } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../api/mockData';
import { useAuth } from '../context/AuthContext';
import { ReassignCustomerModal } from '../components/customers/ReassignCustomerModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('ALL');
  
  const [reassignCustomer, setReassignCustomer] = useState(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);

  // Filter based on role and search query
  const displayedCustomers = MOCK_CUSTOMERS.filter(c => {
    // Role check
    if (!isAdmin && c.assignedAgentId !== currentUser?.id) return false;
    // Agent filter
    if (selectedAgentFilter !== 'ALL' && c.assignedAgentId !== selectedAgentFilter) return false;
    // Search query
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.pan.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
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
            {displayedCustomers.map(c => (
              <tr key={c.id}>
                <td>
                  <div 
                    style={{ fontWeight: '700', color: 'var(--color-accent)', cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.email}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                    <Phone size={14} style={{ color: 'var(--color-text-muted)' }} />
                    {c.mobile}
                  </div>
                </td>
                <td>
                  <code style={{ backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                    {c.pan}
                  </code>
                </td>
                <td>
                  <span className="badge badge-neutral">
                    {c.assignedAgentName}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} style={{ color: 'var(--color-info)' }} />
                    <span>{c.insuranceSummary.activePolicies} Active (₹ {c.insuranceSummary.totalPremium.toLocaleString('en-IN')}/yr)</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--color-success)' }}>
                    <TrendingUp size={14} />
                    <span>₹ {c.mfSummary.currentPortfolioValue.toLocaleString('en-IN')}</span>
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
            ))}
          </tbody>
        </table>
      </div>

      <ReassignCustomerModal
        isOpen={!!reassignCustomer}
        onClose={() => setReassignCustomer(null)}
        customer={reassignCustomer}
      />

      <WhatsappPreviewModal
        isOpen={!!whatsappCustomer}
        onClose={() => setWhatsappCustomer(null)}
        customer={whatsappCustomer}
      />
    </div>
  );
};
