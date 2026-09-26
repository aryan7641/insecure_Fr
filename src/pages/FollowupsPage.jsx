import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, AlertCircle, CheckCircle, Plus, MessageSquare, Loader, RefreshCw, CheckCircle2, ChevronRight, Phone } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, getDaysRemaining } from '../utils/formatters';

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
    { id: 'all', label: 'All Reminders', count: followups.length },
    { id: 'pending', label: 'Pending Action', count: followups.filter(f => f.status?.toLowerCase() !== 'completed').length },
    { id: 'today', label: "Due Today", count: followups.filter(f => f.dueDate && new Date(f.dueDate).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)).length },
    { id: 'completed', label: 'Completed', count: followups.filter(f => f.status?.toLowerCase() === 'completed').length }
  ];

  const displayedFollowups = followups.filter(f => {
    const agentId = f.agentId?._id || f.agentId?.id || f.agentId;
    if (!isAdmin && agentId && agentId !== (currentUser?._id || currentUser?.id)) return false;

    if (activeTab === 'pending') return f.status?.toLowerCase() !== 'completed';
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
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Renewal Reminders & Follow-ups
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {displayedFollowups.length} Tasks
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            Automated Indian renewal notifications (30d, 15d, 7d, 1d) and scheduled client outreach tasks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchFollowups}
            title="Refresh tasks"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Follow-up Tasks List */}
      {loading && followups.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading tasks and reminders...</p>
        </div>
      ) : displayedFollowups.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>All follow-ups completed</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            No pending tasks matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Task & Description</th>
                  <th>Client</th>
                  <th>Due Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedFollowups.map(f => {
                  const cust = f.customerId;
                  const custName = cust?.name || f.customerName || 'Client';
                  const custId = cust?._id || cust?.id;
                  const isCompleted = f.status === 'completed';
                  const days = getDaysRemaining(f.dueDate);

                  return (
                    <tr key={f._id || f.id}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                          {f.notes || 'Automated Renewal Outreach'}
                        </div>
                        {f.policyId?.policyNumber && (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                            Policy #{f.policyId.policyNumber}
                          </div>
                        )}
                      </td>

                      <td>
                        <div 
                          style={{ fontWeight: '600', fontSize: '13px', color: custId ? 'var(--color-text-main)' : 'inherit', cursor: custId ? 'pointer' : 'default' }}
                          onClick={() => custId && navigate(`/customers/${custId}`)}
                        >
                          {custName}
                        </div>
                        {cust?.mobile && (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={11} /> {cust.mobile}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: '500' }}>
                          {f.dueDate ? formatDate(f.dueDate) : '—'}
                        </div>
                        {days !== null && !isCompleted && (
                          <span className={`badge ${days < 0 ? 'badge-danger' : days === 0 ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                            {days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due Today' : `${days}d left`}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          {f.type || 'Renewal'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {f.status || 'Pending'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {!isCompleted && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleStatusChange(f._id || f.id, 'completed')}
                              style={{ fontSize: '11.5px', padding: '4px 8px', color: '#16a34a' }}
                              title="Mark as Completed"
                            >
                              <CheckCircle size={13} /> Done
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setWhatsappCustomer(cust || { name: custName });
                              setWhatsappPolicy(f.policyId || null);
                            }}
                            style={{
                              padding: '4px 8px',
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

      {/* WhatsApp Modal */}
      {whatsappCustomer && (
        <WhatsappPreviewModal
          isOpen={!!whatsappCustomer}
          onClose={() => {
            setWhatsappCustomer(null);
            setWhatsappPolicy(null);
          }}
          customer={whatsappCustomer}
          policy={whatsappPolicy}
        />
      )}
    </div>
  );
};
