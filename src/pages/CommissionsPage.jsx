import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Percent, TrendingUp, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Calendar, Download, RefreshCw, Loader, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';

export const CommissionsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lobFilter, setLobFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const fetchCommissions = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/insurance-policies`);
      const items = res?.data?.policies || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setPolicies(items);
      }
    } catch (err) {
      console.warn('Failed to load commission data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  // Role filtering
  const accessiblePolicies = policies.filter(p => {
    if (isAdmin) return true;
    const agentId = p.assignedAgentId?._id || p.assignedAgentId?.id || p.assignedAgentId;
    return agentId === (currentUser?._id || currentUser?.id);
  });

  // Calculate commissions per policy
  const commissionRecords = accessiblePolicies.map((p, idx) => {
    const premium = p.premiumAmount || p.premium || p.netPremium || 0;
    const rate = p.commissionRate || (p.lob === 'health' ? 15 : p.lob === 'motor' ? 10 : p.lob === 'life' ? 20 : 12);
    const amount = Math.round((premium * rate) / 100);
    const isPaid = p.status === 'active' || p.status === 'renewed';

    return {
      id: p._id || p.id || `comm-${idx}`,
      policyId: p._id || p.id,
      policyNumber: p.policyNumber,
      insurerName: p.insurerName || p.insuranceCompany,
      lob: p.lob || p.policyType,
      customerName: p.customerId?.name || p.customerName || 'Customer',
      premiumAmount: premium,
      commissionRate: rate,
      commissionAmount: amount,
      status: isPaid ? 'received' : 'pending',
      issueDate: p.startDate || p.createdAt,
      paymentMode: 'Direct Broker Remittance'
    };
  });

  // KPI aggregates
  const totalCommission = commissionRecords.reduce((sum, c) => sum + c.commissionAmount, 0);
  const receivedCommission = commissionRecords.filter(c => c.status === 'received').reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingCommission = commissionRecords.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
  const avgCommissionRate = commissionRecords.length > 0 
    ? Math.round(commissionRecords.reduce((sum, c) => sum + c.commissionRate, 0) / commissionRecords.length) 
    : 15;

  // Filter records
  const filteredRecords = commissionRecords.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (lobFilter !== 'ALL' && (r.lob || '').toLowerCase() !== lobFilter.toLowerCase()) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchCust = r.customerName.toLowerCase().includes(q);
      const matchPol = r.policyNumber.toLowerCase().includes(q);
      const matchIns = r.insurerName.toLowerCase().includes(q);
      if (!matchCust && !matchPol && !matchIns) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Commission & Earnings Ledger</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            {isAdmin ? 'Consolidated broker earnings, agent payouts, and insurer commission receivables.' : 'Track your earned commissions and pending premium payouts.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={fetchCommissions}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL COMMISSION</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            {formatINR(totalCommission)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>From {accessiblePolicies.length} issued policies</span>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--color-success)' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>RECEIVED EARNINGS</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {formatINR(receivedCommission)}
          </div>
          <span style={{ fontSize: '11px', color: '#047857' }}>Settled by insurers</span>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--color-warning)' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>PENDING RECEIVABLES</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {formatINR(pendingCommission)}
          </div>
          <span style={{ fontSize: '11px', color: '#d97706' }}>Awaiting policy clearance</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>AVG COMMISSION RATE</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#7e22ce', marginTop: '4px' }}>
            {avgCommissionRate}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Portfolio blended margin</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by customer, policy #, insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <select 
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="received">Received / Settled</option>
          <option value="pending">Pending Settlement</option>
        </select>

        <select 
          className="select"
          value={lobFilter}
          onChange={(e) => setLobFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="ALL">All Lines of Business</option>
          <option value="health">Health Insurance</option>
          <option value="motor">Motor Insurance</option>
          <option value="life">Life Insurance</option>
          <option value="term">Term Life</option>
          <option value="travel">Travel Insurance</option>
          <option value="home">Home Insurance</option>
        </select>
      </div>

      {/* Commission Table */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading commission ledger...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Percent size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>No commission records found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Commissions will automatically calculate as policies are issued and renewed.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Customer & Policy</th>
                  <th>Insurer & LOB</th>
                  <th>Gross Premium</th>
                  <th>Comm. Rate</th>
                  <th>Commission Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const lob = getLOBBadge(rec.lob);

                  return (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{rec.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>#{rec.policyNumber}</div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{rec.insurerName}</div>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '700', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: lob.bg, 
                          color: lob.color,
                          border: `1px solid ${lob.border}`
                        }}>
                          {lob.label}
                        </span>
                      </td>

                      <td style={{ fontWeight: '600' }}>
                        {formatINR(rec.premiumAmount)}
                      </td>

                      <td>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          {rec.commissionRate}%
                        </span>
                      </td>

                      <td style={{ fontWeight: '700', color: rec.status === 'received' ? '#047857' : '#d97706' }}>
                        {formatINR(rec.commissionAmount)}
                      </td>

                      <td>
                        <span className={`badge ${rec.status === 'received' ? 'badge-success' : 'badge-warning'}`}>
                          {rec.status === 'received' ? 'Received' : 'Pending'}
                        </span>
                      </td>

                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {formatDate(rec.issueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
