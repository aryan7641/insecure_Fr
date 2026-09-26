import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, AlertCircle, CheckCircle, Plus, MessageSquare, Loader, RefreshCw } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const FollowupsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentAgency } = useAgency();
  const { currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [whatsappPolicy, setWhatsappPolicy] = useState(null);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const fetchFollowups = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/follow-ups`);
      const items = res?.data?.followUps || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setFollowups(items);
      }
    } catch (err) {
      console.warn('Failed to load follow-ups:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleStatusChange = async (followUpId, newStatus) => {
    try {
      await apiClient.put(`/agencies/${agencyId}/follow-ups/${followUpId}`, {
        status: newStatus
      });
      addToast(`Follow-up marked as ${newStatus}`, 'success');
      fetchFollowups();
    } catch (err) {
      addToast(err.message || 'Failed to update follow-up status', 'danger');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Tasks & Renewals' },
    { id: 'pending', label: 'Pending Action' },
    { id: 'today', label: "Today's Due" },
    { id: 'completed', label: 'Completed' }
  ];

  const displayedFollowups = followups.filter(f => {
    // RBAC: Agents see only assigned follow-ups
    const agentId = f.agentId?._id || f.agentId?.id || f.agentId;
    if (!isAdmin && agentId && agentId !== (currentUser?._id || currentUser?.id)) return false;

    if (activeTab === 'pending') return f.status?.toLowerCase() === 'pending';
    if (activeTab === 'completed') return f.status?.toLowerCase() === 'completed';
    if (activeTab === 'today') {
      if (!f.dueDate) return false;
      const dueStr = new Date(f.dueDate).toISOString().slice(0, 10);
      const todayStr = new Date().toISOString().slice(0, 10);
      return dueStr === todayStr;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Renewal Reminders & Follow-up Tasks</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Automated Indian insurance renewal reminders (30d, 15d, 7d, 1d) and servicing tasks.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchFollowups} title="Refresh tasks">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="table-container">
        {loading && followups.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading follow-up tasks...</p>
          </div>
        ) : displayedFollowups.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <CalendarCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No follow-up tasks in this category</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Renewal tasks are generated automatically whenever policies approach expiry dates.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task / Reminder Note</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedFollowups.map(f => {
                const fId = f._id || f.id;
                const cust = f.customerId;
                const custName = cust?.name || 'Customer';
                const custId = cust?._id || cust?.id;
                const dueFormatted = f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                const isOverdue = f.dueDate && new Date(f.dueDate) < new Date() && f.status !== 'completed';

                return (
                  <tr key={fId}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{f.notes || 'Automated Renewal Reminder'}</div>
                      {f.isAutomatic && (
                        <span className="badge badge-neutral" style={{ fontSize: '10px', marginTop: '4px' }}>
                          Auto Renewal Engine
                        </span>
                      )}
                    </td>
                    <td>
                      <div 
                        style={{ fontWeight: '600', cursor: custId ? 'pointer' : 'default', color: custId ? 'var(--color-primary)' : 'inherit' }}
                        onClick={() => custId && navigate(`/customers/${custId}`)}
                      >
                        {custName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {cust?.mobile || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${f.type === 'renewal' ? 'badge-info' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {f.type || 'Renewal'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? '700' : 'normal' }}>
                        {dueFormatted}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select" 
                        style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }} 
                        value={f.status || 'pending'}
                        onChange={(e) => handleStatusChange(fId, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="completed">Completed</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Dispatch WhatsApp Renewal Notice"
                        onClick={() => {
                          setWhatsappCustomer(cust);
                          setWhatsappPolicy(f.relatedPolicyId || null);
                        }}
                        style={{ color: '#25D366' }}
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <WhatsappPreviewModal
        isOpen={!!whatsappCustomer}
        onClose={() => { setWhatsappCustomer(null); setWhatsappPolicy(null); }}
        customer={whatsappCustomer}
        policy={whatsappPolicy}
      />
    </div>
  );
};
