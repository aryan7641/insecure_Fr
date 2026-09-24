import React, { useState } from 'react';
import { CalendarCheck, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { MOCK_FOLLOWUPS } from '../api/mockData';

export const FollowupsPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Follow-ups' },
    { id: 'today', label: "Today's Due" },
    { id: 'overdue', label: 'Overdue Task' },
    { id: 'completed', label: 'Completed' }
  ];

  const displayedFollowups = MOCK_FOLLOWUPS.filter(f => {
    if (activeTab === 'today') return f.dueDate === '2026-09-24';
    if (activeTab === 'overdue') return f.status === 'Overdue';
    if (activeTab === 'completed') return f.status === 'Completed';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Task & Follow-up Manager</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Auto-generated policy renewal tasks and agent manual follow-ups.
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title / Task Description</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Due Date</th>
              <th>Assigned Agent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedFollowups.map(f => (
              <tr key={f.id}>
                <td>
                  <div style={{ fontWeight: '600' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{f.notes}</div>
                </td>
                <td style={{ fontWeight: '500' }}>{f.customerName}</td>
                <td>
                  <span className={`badge ${f.type === 'Renewal' ? 'badge-info' : 'badge-neutral'}`}>
                    {f.type}
                  </span>
                </td>
                <td>
                  <span style={{ color: f.status === 'Overdue' ? 'var(--color-danger)' : 'inherit', fontWeight: f.status === 'Overdue' ? '700' : 'normal' }}>
                    {f.dueDate}
                  </span>
                </td>
                <td>{f.assignedAgentName}</td>
                <td>
                  <span className={`badge ${f.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                    {f.status}
                  </span>
                </td>
                <td>
                  <select className="form-select" style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }} defaultValue={f.status}>
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
