import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, AlertTriangle, CalendarX, TrendingUp, Calendar, 
  FileText, Clock, AlertCircle, UserPlus, Activity 
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { MOCK_CUSTOMERS, MOCK_POLICIES, MOCK_SIPS, MOCK_FOLLOWUPS, MOCK_DOCUMENTS, MOCK_ACTIVITY } from '../api/mockData';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  // Filter based on role (Admin sees all in agency, Agent sees assigned)
  const customers = isAdmin ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => c.assignedAgentId === currentUser?.id);
  const policies = isAdmin ? MOCK_POLICIES : MOCK_POLICIES.filter(p => p.assignedAgentName === currentUser?.name);
  const sips = isAdmin ? MOCK_SIPS : MOCK_SIPS.filter(s => s.assignedAgentName === currentUser?.name);
  const followups = isAdmin ? MOCK_FOLLOWUPS : MOCK_FOLLOWUPS.filter(f => f.assignedAgentId === currentUser?.id);
  const documents = MOCK_DOCUMENTS;

  // KPI Calculations
  const expiringSoonCount = policies.filter(p => p.status === 'Expiring Soon').length;
  const overdueRenewalsCount = followups.filter(f => f.type === 'Renewal' && f.status === 'Overdue').length;
  const dueTodayCount = followups.filter(f => f.dueDate === '2026-09-24').length;
  const overdueFollowupsCount = followups.filter(f => f.status === 'Overdue').length;
  const pendingDocsCount = documents.filter(d => d.status === 'Pending Verification').length;

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Executive Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Agency: <strong>{currentAgency.name}</strong> | Role Context: <strong>{currentUser?.role}</strong>
          </p>
        </div>
      </div>

      {/* 11 Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* 1. Total Customers */}
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtext="Unified Profiles"
          icon={Users}
          color="accent"
          onClick={() => navigate('/customers')}
        />

        {/* 2. Active Policies */}
        <StatCard
          title="Active Policies"
          value={policies.filter(p => p.status === 'Active' || p.status === 'Expiring Soon').length}
          subtext="Insurance Portfolio"
          icon={Shield}
          color="info"
          onClick={() => navigate('/insurance')}
        />

        {/* 3. Policies Expiring Soon (30 days) */}
        <StatCard
          title="Policies Expiring Soon"
          value={expiringSoonCount}
          subtext="Within 30 Days"
          icon={AlertTriangle}
          color="warning"
          onClick={() => navigate('/insurance?filter=expiring_soon')}
        />

        {/* 4. Overdue Renewals */}
        <StatCard
          title="Overdue Renewals"
          value={overdueRenewalsCount}
          subtext="Requires Action"
          icon={CalendarX}
          color="danger"
          onClick={() => navigate('/followups?filter=overdue')}
        />

        {/* 5. Total SIPs */}
        <StatCard
          title="Active SIPs"
          value={sips.length}
          subtext="Mutual Funds"
          icon={TrendingUp}
          color="success"
          onClick={() => navigate('/mutual-funds?tab=sips')}
        />

        {/* 6. Upcoming SIP Dates */}
        <StatCard
          title="Upcoming SIP Dates"
          value={sips.length}
          subtext="Due Next 10 Days"
          icon={Calendar}
          color="info"
          onClick={() => navigate('/mutual-funds?tab=sips')}
        />

        {/* 7. Documents Pending */}
        <StatCard
          title="Documents Pending"
          value={pendingDocsCount}
          subtext="OCR / Verification"
          icon={FileText}
          color="warning"
          onClick={() => navigate('/documents?filter=pending')}
        />

        {/* 8. Follow-ups Due Today */}
        <StatCard
          title="Follow-ups Due Today"
          value={dueTodayCount}
          subtext="Scheduled Today"
          icon={Clock}
          color="accent"
          onClick={() => navigate('/followups?filter=today')}
        />

        {/* 9. Follow-ups Overdue */}
        <StatCard
          title="Follow-ups Overdue"
          value={overdueFollowupsCount}
          subtext="Action Required"
          icon={AlertCircle}
          color="danger"
          onClick={() => navigate('/followups?filter=overdue')}
        />

        {/* 10. New Customers */}
        <StatCard
          title="New Customers"
          value={customers.length}
          subtext="Added This Month"
          icon={UserPlus}
          color="success"
          onClick={() => navigate('/customers')}
        />
      </div>

      {/* Lower Dashboard Grid: Urgent Renewals & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Urgent Expiring Policies List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Policies Expiring Soon (30-Day Window)</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/insurance')}>View All</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy #</th>
                  <th>Customer</th>
                  <th>Insurer</th>
                  <th>Renewal Date</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                {policies.filter(p => p.status === 'Expiring Soon').map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${p.customerId}?tab=insurance`)}>
                    <td style={{ fontWeight: '600' }}>{p.policyNumber}</td>
                    <td>{p.customerName}</td>
                    <td>{p.company}</td>
                    <td><span style={{ color: 'var(--color-warning)', fontWeight: '600' }}>{p.renewalDate}</span></td>
                    <td>₹ {p.premium.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 11. Recent Activity Feed */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Activity</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/activity')}>View Timeline</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {MOCK_ACTIVITY.slice(0, 4).map(act => (
              <div key={act.id} style={{
                display: 'flex',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--color-border-subtle)',
                fontSize: '13px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent)',
                  marginTop: '6px'
                }} />
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{act.action}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '2px' }}>{act.details}</div>
                  <div style={{ color: 'var(--color-text-light)', fontSize: '11px', marginTop: '4px' }}>
                    {act.agentName} • {act.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
