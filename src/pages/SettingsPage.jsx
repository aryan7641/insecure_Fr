import React, { useState } from 'react';
import { Settings, Users, FileText, MessageSquare, Plus } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { UnauthorizedState } from '../components/common/UnauthorizedState';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS, MOCK_WHATSAPP_TEMPLATES } from '../api/mockData';

export const SettingsPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('agents');

  if (!isAdmin) {
    return <UnauthorizedState message="Only Agency Administrators have permission to view and edit Agency Settings." />;
  }

  const tabs = [
    { id: 'agents', label: 'Agent Management' },
    { id: 'doc-requirements', label: 'Document Requirements' },
    { id: 'templates', label: 'WhatsApp Templates' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Agency Settings & Management</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
          Manage team agents, customer document checklists and agency WhatsApp templates.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'agents' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Agency Advisors & Agents</h3>
            <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Agent</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-info">{u.role}</span></td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'doc-requirements' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Required Customer Document Checklists</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Insurance Customer Checklist</strong>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PAN Card, Aadhaar Card, Policy Document</div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>WhatsApp Message Templates</h3>
          {MOCK_WHATSAPP_TEMPLATES.map(t => (
            <div key={t.id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px' }}>{t.name}</strong>
                <span className="badge badge-info">{t.scope}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{t.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
