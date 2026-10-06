import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity as ActivityIcon, ShieldCheck, User, Search, 
  Filter, RefreshCw, Loader, Clock, Calendar, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatDate } from '../utils/formatters';

export const ActivityPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

  const fetchActivities = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/activity`);
      const items = res?.data?.activities || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setActivities(items);
      }
    } catch (err) {
      console.warn('Failed to load activity logs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filtering
  const filteredActivities = activities.filter(act => {
    // Role filter: Agents see only own relevant activity
    if (!isAdmin) {
      const perfId = act.performedBy?._id || act.performedBy?.id || act.performedBy;
      const curId = currentUser?._id || currentUser?.id;
      if (perfId && perfId !== curId && act.performedBy?.name !== 'System') {
        return false;
      }
    }

    if (typeFilter !== 'ALL' && act.type !== typeFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const descMatch = (act.description || '').toLowerCase().includes(q);
      const custMatch = (act.customerId?.name || act.customerName || '').toLowerCase();
      const userMatch = (act.performedBy?.name || '').toLowerCase();
      if (!descMatch && !custMatch && !userMatch) return false;
    }

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Operations Audit Trail</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            {isAdmin 
              ? 'Agency-wide chronological log of customer creation, PDF OCR intakes, policy renewals & agent touchpoints.' 
              : 'Chronological timeline of your customer touches, policy confirmations, and follow-ups.'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchActivities}
            title="Refresh Activities"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search activity description, customer name, advisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <select 
          className="select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="ALL">All Activity Types</option>
          <option value="POLICY_CREATED">Policy Created</option>
          <option value="POLICY_RENEWED">Policy Renewed</option>
          <option value="CUSTOMER_CREATED">Customer Created</option>
          <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
          <option value="FOLLOWUP_COMPLETED">Follow-up Completed</option>
        </select>
      </div>

      {/* Activity Table */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading audit trail...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <ActivityIcon size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>No activity records found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            CRM actions and PDF OCR intakes will log here in real-time.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Description</th>
                  <th>Customer Context</th>
                  <th>Advisor / User</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act, idx) => (
                  <tr key={act._id || idx}>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(act.createdAt)}
                    </td>

                    <td>
                      <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {(act.type || 'Activity').replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                      {act.description || act.title || 'System Event logged'}
                    </td>

                    <td>
                      {act.customerId?.name || act.customerName ? (
                        <span style={{ fontWeight: '500' }}>{act.customerId?.name || act.customerName}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${act.performedBy?.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                        {act.performedBy?.name || 'System User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
