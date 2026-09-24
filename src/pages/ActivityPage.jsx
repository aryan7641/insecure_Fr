import React from 'react';
import { Activity as ActivityIcon, ShieldCheck, User } from 'lucide-react';
import { MOCK_ACTIVITY } from '../api/mockData';
import { useAuth } from '../context/AuthContext';

export const ActivityPage = () => {
  const { currentUser, isAdmin } = useAuth();

  const displayedActivity = isAdmin 
    ? MOCK_ACTIVITY 
    : MOCK_ACTIVITY.filter(a => a.agentName === currentUser?.name || a.agentName === 'System');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Agency Audit Trail & Activity Feed</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
          Chronological record of customer creation, policy renewals, document uploads & agent actions.
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Customer</th>
              <th>Action</th>
              <th>Details</th>
              <th>Agent / System User</th>
            </tr>
          </thead>
          <tbody>
            {displayedActivity.map(act => (
              <tr key={act.id}>
                <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{act.timestamp}</td>
                <td style={{ fontWeight: '600' }}>{act.customerName}</td>
                <td style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{act.action}</td>
                <td>{act.details}</td>
                <td>
                  <span className={`badge ${act.agentName === 'System' ? 'badge-neutral' : 'badge-info'}`}>
                    {act.agentName}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
