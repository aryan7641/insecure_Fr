import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Percent, TrendingUp, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Calendar, Download, RefreshCw, Loader, Shield, CheckCircle2,
  Edit2, Trash2, Plus, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';
import { CommissionModal } from '../components/commissions/CommissionModal';

export const CommissionsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();
  const { addToast } = useToast();

  const [commissions, setCommissions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lobFilter, setLobFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected policy / commission for modal
  const [activeModalTarget, setActiveModalTarget] = useState(null); // { policy, commission }
  const [isSelectPolicyOpen, setIsSelectPolicyOpen] = useState(false);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const [commRes, polRes] = await Promise.all([
        apiClient.get(`/agencies/${agencyId}/commissions?limit=200`),
        apiClient.get(`/agencies/${agencyId}/insurance-policies?limit=200`).catch(() => ({ data: { policies: [] } }))
      ]);

      const commItems = commRes?.data?.commissions || commRes?.data?.data || commRes?.data || [];
      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];

      if (Array.isArray(commItems)) {
        setCommissions(commItems);
      }
      if (Array.isArray(polItems)) {
        setPolicies(polItems);
      }
    } catch (err) {
      console.warn('Failed to load commission records:', err.message);
      addToast(err.response?.data?.message || 'Failed to load commissions', 'danger');
    } finally {
      setLoading(false);
    }
  }, [agencyId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle single commission deletion by Admin
  const handleDeleteCommission = async (comm) => {
    const policyId = comm.policyId?._id || comm.policyId?.id || comm.policyId;
    if (!policyId) return;

    if (!window.confirm(`Are you sure you want to delete commission for Policy #${comm.policyId?.policyNumber || ''}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/agencies/${agencyId}/commissions/${policyId}`);
      addToast('Commission record deleted successfully', 'success');
      setCommissions(prev => prev.filter(c => (c._id || c.id) !== (comm._id || comm.id)));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete commission', 'danger');
    }
  };

  // KPI aggregates from REAL individual records (strictly no mock or fallback formulas)
  const totalCommission = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  const receivedCommission = commissions
    .filter(c => c.commissionStatus === 'paid' || c.commissionStatus === 'received')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  const pendingCommission = commissions
    .filter(c => c.commissionStatus === 'pending')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  // Filter individual records
  const filteredRecords = commissions.filter(rec => {
    const status = rec.commissionStatus || 'pending';
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'received' && status !== 'paid' && status !== 'received') return false;
      if (statusFilter === 'pending' && status !== 'pending') return false;
    }

    const pol = rec.policyId || {};
    const lob = (pol.insuranceType || pol.lob || '').toLowerCase();
    if (lobFilter !== 'ALL' && lob !== lobFilter.toLowerCase()) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const custName = (rec.customerId?.name || pol.customerId?.name || '').toLowerCase();
      const polNum = (pol.policyNumber || '').toLowerCase();
      const insComp = (pol.insuranceCompany || '').toLowerCase();
      const agentName = (rec.agentId?.name || '').toLowerCase();
      if (!custName.includes(q) && !polNum.includes(q) && !insComp.includes(q) && !agentName.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const formatBasisLabel = (basis) => {
    switch (basis) {
      case 'final_premium':
      case 'gross_premium':
        return 'Final / Gross';
      case 'basic_premium':
        return 'Basic';
      case 'od_premium':
      case 'own_damage':
        return 'OD Premium';
      case 'other_premium':
        return 'Other';
      case 'net_premium':
      default:
        return 'Net Premium';
    }
  };

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
              {filteredRecords.length} Individual Records
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            {isAdmin ? 'Policy-level individual commission management, premium basis yield, and agent settlements.' : 'Track your earned commissions and policy payouts.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            title="Refresh Commission Data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsSelectPolicyOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} />
            <span>Set Policy Commission</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards from REAL Individual Records */}
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
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>From {commissions.length} active commission entries</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>RECEIVED EARNINGS</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {formatINR(receivedCommission)}
          </div>
          <span style={{ fontSize: '12px', color: '#15803d' }}>Settled by insurers / broker</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>PENDING RECEIVABLES</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {formatINR(pendingCommission)}
          </div>
          <span style={{ fontSize: '12px', color: '#b45309' }}>Awaiting clearance / remittance</span>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>RECORDED POLICIES</span>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#7e22ce', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {commissions.length}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>With custom individual commissions</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by client, policy #, insurer, agent..."
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
          <option value="received">Received / Paid</option>
          <option value="pending">Pending</option>
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
          <option value="travel">Travel Insurance</option>
        </select>
      </div>

      {/* Individual Commission Records Table */}
      {loading && commissions.length === 0 ? (
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
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px', maxWidth: '440px', margin: '4px auto 16px auto' }}>
            Individual commissions are manually set per policy without any hardcoded synthetic fallbacks. Click below to configure commission for any issued policy.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsSelectPolicyOpen(true)}
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} /> Set Policy Commission
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Customer</th>
                  <th>Policy Number</th>
                  <th>Agent</th>
                  <th>Type</th>
                  <th>Basis</th>
                  <th>% / Rate</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const pol = rec.policyId || {};
                  const cust = rec.customerId || pol.customerId || {};
                  const agent = rec.agentId || {};
                  const isPaid = rec.commissionStatus === 'paid' || rec.commissionStatus === 'received';
                  const lob = getLOBBadge(pol.insuranceType || pol.lob || 'health');

                  return (
                    <tr key={rec._id || rec.id}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-main)' }}>
                          {cust.name || 'Unnamed Client'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                          {cust.mobile || cust.email || '—'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--color-accent)' }}>
                          #{pol.policyNumber || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                          <span>{pol.insuranceCompany || 'Insurer'}</span>
                          <span>•</span>
                          <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 4px', textTransform: 'uppercase' }}>
                            {lob.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                          {agent.name || 'Unassigned'}
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {rec.commissionType || 'percentage'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-body)', fontWeight: '500' }}>
                          {formatBasisLabel(rec.commissionBasis)}
                        </span>
                      </td>

                      <td>
                        {rec.commissionType === 'flat' ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Flat Fee</span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: '11.5px' }}>
                            {rec.commissionPercentage || 0}%
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: isPaid ? '#15803d' : '#b45309' }}>
                          {formatINR(rec.commissionAmount || 0)}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {isPaid ? 'Received' : 'Pending'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Edit Commission"
                            onClick={() => setActiveModalTarget({ policy: pol, commission: rec })}
                            style={{ padding: '5px 8px' }}
                          >
                            <Edit2 size={13} />
                          </button>

                          {isAdmin && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Delete Commission"
                              onClick={() => handleDeleteCommission(rec)}
                              style={{ padding: '5px 8px', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.25)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* Modal: Select Policy to configure commission */}
      {isSelectPolicyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setIsSelectPolicyOpen(false)}>
          <div 
            className="card" 
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600' }}>Select Policy to Set Commission</h3>
              <button onClick={() => setIsSelectPolicyOpen(false)} style={{ color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
              Choose a policy to configure individual manual commission:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
              {policies.map(p => {
                const existingComm = commissions.find(c => {
                  const pId = c.policyId?._id || c.policyId?.id || c.policyId;
                  return String(pId) === String(p._id || p.id);
                });

                return (
                  <div
                    key={p._id || p.id}
                    onClick={() => {
                      setIsSelectPolicyOpen(false);
                      setActiveModalTarget({ policy: p, commission: existingComm || p.commission });
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--color-bg)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-accent)' }}>
                        #{p.policyNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-main)' }}>
                        {p.customerId?.name || 'Customer'} • {p.insuranceCompany || 'Insurer'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700' }}>
                        {formatINR(p.finalPremium || p.premium || 0)}
                      </div>
                      <span className={`badge ${existingComm ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {existingComm ? 'Configured' : 'No Commission'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit or Create Commission */}
      {activeModalTarget && (
        <CommissionModal
          isOpen={!!activeModalTarget}
          onClose={() => setActiveModalTarget(null)}
          policy={activeModalTarget.policy}
          commission={activeModalTarget.commission}
          agencyId={agencyId}
          onSaveSuccess={() => fetchData()}
          onDeleteSuccess={() => fetchData()}
        />
      )}

    </div>
  );
};
