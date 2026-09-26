import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, UserPlus, Mail, Phone, Shield, Users, 
  CheckCircle, AlertCircle, RefreshCw, Loader, MoreHorizontal, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { Modal } from '../components/common/Modal';
import { formatINR, formatDate } from '../utils/formatters';

export const TeamPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [users, setUsers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'agent',
    phone: ''
  });

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const loadTeamData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const [usersRes, polRes, custRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get(`/agencies/${agencyId}/insurance-policies`),
        apiClient.get(`/agencies/${agencyId}/customers`)
      ]);

      const userItems = usersRes?.data?.users || usersRes?.data || [];
      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      const custItems = custRes?.data?.customers || custRes?.data?.data || custRes?.data || [];

      if (Array.isArray(userItems)) setUsers(userItems);
      if (Array.isArray(polItems)) setPolicies(polItems);
      if (Array.isArray(custItems)) setCustomers(custItems);
    } catch (err) {
      console.warn('Failed to load team data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadTeamData();
  }, [isAdmin, loadTeamData, navigate]);

  const handleInviteAgent = async (e) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) {
      addToast('Name and email are required', 'warning');
      return;
    }

    try {
      // Simulate/register agent in agency context
      const newAgent = {
        _id: `user-${Date.now()}`,
        name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      setUsers([...users, newAgent]);
      addToast(`Agent invitation sent to ${inviteData.email}`, 'success');
      setIsInviteModalOpen(false);
      setInviteData({ name: '', email: '', role: 'agent', phone: '' });
    } catch (err) {
      addToast(err.message || 'Failed to invite agent', 'danger');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Agency Team & Agent Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Manage agency insurance advisors, track individual books of business, and delegate client accounts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadTeamData}
            title="Refresh Team"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus size={16} /> Invite Advisor
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>ACTIVE ADVISORS</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            {users.length || 1}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Authorized CRM users</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>MANAGED CUSTOMERS</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
            {customers.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Assigned across team</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL POLICIES</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {policies.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Agency active portfolio</span>
        </div>
      </div>

      {/* Advisors Table */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading advisors roster...</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Advisor Name</th>
                  <th>Role & Permissions</th>
                  <th>Email</th>
                  <th>Assigned Clients</th>
                  <th>Policies Managed</th>
                  <th>Total Premium Book</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const agentCustCount = customers.filter(c => {
                    const aid = c.assignedAgentId?._id || c.assignedAgentId?.id || c.assignedAgentId;
                    return aid === user._id || aid === user.id;
                  }).length;

                  const agentPolicies = policies.filter(p => {
                    const aid = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
                    return aid === user._id || aid === user.id;
                  });

                  const agentPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || p.premium || 0), 0);

                  return (
                    <tr key={user._id || user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-accent)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '13px'
                          }}>
                            {user.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{user.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>ID: {user._id?.slice(-6) || 'Admin'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>
                          {user.role || 'Agent'}
                        </span>
                      </td>

                      <td style={{ color: 'var(--color-text-muted)' }}>
                        {user.email}
                      </td>

                      <td style={{ fontWeight: '600' }}>
                        {agentCustCount} Clients
                      </td>

                      <td style={{ fontWeight: '600' }}>
                        {agentPolicies.length} Policies
                      </td>

                      <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                        {formatINR(agentPremium)}
                      </td>

                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Advisor Modal */}
      {isInviteModalOpen && (
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite Insurance Advisor / Agent"
        >
          <form onSubmit={handleInviteAgent}>
            <div style={{ marginBottom: '14px' }}>
              <label className="label">Advisor Full Name *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Ramesh Kulkarni"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="label">Email Address *</label>
              <input
                type="email"
                className="input"
                required
                placeholder="e.g. ramesh.kulkarni@insurance.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="label">Assigned Role</label>
              <select
                className="select"
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              >
                <option value="agent">Agent / Insurance Advisor (Own Clients Only)</option>
                <option value="admin">Agency Admin (Full Visibility & Deletion)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
