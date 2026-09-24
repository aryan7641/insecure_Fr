import React, { useState } from 'react';
import { Plus, Shield, Search, Filter } from 'lucide-react';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { PolicyFormModal } from '../components/insurance/PolicyFormModal';
import { MOCK_POLICIES } from '../api/mockData';
import { useAuth } from '../context/AuthContext';

export const InsurancePage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayedPolicies = MOCK_POLICIES.filter(p => {
    if (!isAdmin && p.assignedAgentName !== currentUser?.name) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      p.policyNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) ||
      p.policyType.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Policy Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Health, Term, Motor and General insurance policies. Manual status control.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Policy
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search policy number, customer, insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon (30 days)</option>
          <option value="Expired">Expired</option>
          <option value="Renewed">Renewed</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy Number</th>
              <th>Customer</th>
              <th>Insurance Company</th>
              <th>Policy Type</th>
              <th>Premium (INR)</th>
              <th>Renewal Date</th>
              <th>Status (Manual)</th>
            </tr>
          </thead>
          <tbody>
            {displayedPolicies.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: '700' }}>{p.policyNumber}</td>
                <td style={{ fontWeight: '500' }}>{p.customerName}</td>
                <td>{p.company}</td>
                <td>{p.policyType}</td>
                <td>₹ {p.premium.toLocaleString('en-IN')} / {p.frequency}</td>
                <td>
                  <span style={{ color: p.status === 'Expiring Soon' ? 'var(--color-warning)' : 'inherit', fontWeight: p.status === 'Expiring Soon' ? '700' : 'normal' }}>
                    {p.renewalDate}
                  </span>
                </td>
                <td><PolicyStatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PolicyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
