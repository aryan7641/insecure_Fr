import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Percent, TrendingUp, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Calendar, Download, RefreshCw, Loader, Shield, CheckCircle2
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
    const premium = p.premiumAmount || p.premium || p.finalPremium || p.netPremium || 0;
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
    : 12;

  // Filter records
  const filteredRecords = commissionRecords.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (lobFilter !== 'ALL' && (r.lob || '').toLowerCase() !== lobFilter.toLowerCase()) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchCust = (r.customerName || '').toLowerCase().includes(q);
      const matchPol = (r.policyNumber || '').toLowerCase().includes(q);
      const matchIns = (r.insurerName || '').toLowerCase().includes(q);
      if (!matchCust && !matchPol && !matchIns) return false;
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
              Commission & Earnings Ledger
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {filteredRecords.length} Records
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            {isAdmin ? 'Consolidated insurance brokerage earnings, agent payouts, and insurer commission receivables.' : 'Track your earned commissions and pending policy payouts.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchCommissions}
            title="Refresh Data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL COMMISSION</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {formatINR(totalCommission)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>From {accessiblePolicies.length} issued policies</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>RECEIVED EARNINGS</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {formatINR(receivedCommission)}
          </div>
          <span style={{ fontSize: '12px', color: '#15803d' }}>Settled by insurers</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>PENDING RECEIVABLES</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {formatINR(pendingCommission)}
          </div>
          <span style={{ fontSize: '12px', color: '#b45309' }}>Awaiting policy clearance</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>BLENDED YIELD</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#7e22ce', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {avgCommissionRate}%
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Portfolio blended margin</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by client, policy #, insurer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <select 
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '160px', fontSize: '13px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="received">Received / Settled</option>
          <option value="pending">Pending Settlement</option>
        </select>

        <select 
          className="select"
          value={lobFilter}
          onChange={(e) => setLobFilter(e.target.value)}
          style={{ width: '170px', fontSize: '13px' }}
        >
          <option value="ALL">All Lines (LOB)</option>
          <option value="health">Health Insurance</option>
          <option value="motor">Motor Insurance</option>
          <option value="life">Life Insurance</option>
          <option value="term">Term Life</option>
          <option value="travel">Travel Insurance</option>
          <option value="home">Home Insurance</option>
        </select>
      </div>

      {/* Commission Table */}
      {loading && policies.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading commission ledger...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Percent size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>No commission records found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Commissions will automatically calculate as policies are issued and renewed.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Client & Policy</th>
                  <th>Insurer & Line</th>
                  <th>Gross Premium</th>
                  <th>Comm. Rate</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const lob = getLOBBadge(rec.lob);

                  return (
                    <tr key={rec.id}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-main)' }}>{rec.customerName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-accent)', fontWeight: '600' }}>#{rec.policyNumber}</div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-main)' }}>{rec.insurerName}</div>
                        <span className="badge badge-neutral" style={{ fontSize: '10px', marginTop: '2px', textTransform: 'uppercase' }}>
                          {lob.label}
                        </span>
                      </td>

                      <td style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-main)' }}>
                        {formatINR(rec.premiumAmount)}
                      </td>

                      <td>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          {rec.commissionRate}%
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: rec.status === 'received' ? '#15803d' : '#b45309' }}>
                          {formatINR(rec.commissionAmount)}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${rec.status === 'received' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {rec.status === 'received' ? 'Received' : 'Pending'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
