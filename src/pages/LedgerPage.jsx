import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Plus, RefreshCw, Loader, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate } from '../utils/formatters';

export const LedgerPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const loadLedgerData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      // 1. Load policies to build insurance ledger entries
      const polRes = await apiClient.get(`/agencies/${agencyId}/insurance-policies`);
      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      if (Array.isArray(polItems)) setPolicies(polItems);

      // Build real ledger entries from policy financial events
      let balance = 0;
      const ledgerEntries = polItems.flatMap((p, idx) => {
        const premium = p.premiumAmount || p.premium || p.netPremium || 0;
        const comm = p.commission?.amount ?? (p.commission?.percentage ? Math.round((premium * p.commission.percentage) / 100) : 0);
        const custName = p.customerId?.name || p.customerName || 'Customer';

        return [
          {
            id: `tx-prem-${p._id || idx}`,
            date: p.startDate || p.createdAt,
            description: `Policy Premium Collection (${p.lob?.toUpperCase() || 'INS'})`,
            customer: custName,
            policyNumber: p.policyNumber,
            type: 'customer_due',
            debit: premium,
            credit: 0,
            status: p.status === 'active' || p.status === 'renewed' ? 'paid' : 'pending'
          },
          {
            id: `tx-comm-${p._id || idx}`,
            date: p.startDate || p.createdAt,
            description: `Insurer Commission Settlement (${p.insurerName || p.insuranceCompany})`,
            customer: custName,
            policyNumber: p.policyNumber,
            type: 'broker_payout',
            debit: 0,
            credit: comm,
            status: p.status === 'active' || p.status === 'renewed' ? 'paid' : 'pending'
          }
        ];
      });

      // Sort by date descending
      ledgerEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Compute running balance
      let running = 0;
      const computed = ledgerEntries.map(e => {
        if (e.status === 'paid') {
          running += (e.credit - e.debit);
        }
        return { ...e, balance: running };
      });

      setTransactions(computed);
    } catch (err) {
      console.warn('Failed to load ledger entries:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadLedgerData();
  }, [loadLedgerData]);

  // Calculations
  const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
  const netSettledBalance = totalCredits - totalDebits;

  // Filtering
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'customer_due' && t.type !== 'customer_due') return false;
    if (activeTab === 'broker_payout' && t.type !== 'broker_payout') return false;
    if (activeTab === 'pending' && t.status !== 'pending') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchCust = t.customer.toLowerCase().includes(q);
      const matchPol = t.policyNumber?.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchCust && !matchPol && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Financial Ledger & Dues</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Audit trail of customer premium collections, insurer remittances, and commission disbursements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadLedgerData}
            title="Refresh Ledger"
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
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL PREMIUM RECEIVABLES</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            {formatINR(totalDebits)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Customer policy liabilities</span>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>COMMISSION SETTLEMENTS</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
            {formatINR(totalCredits)}
          </div>
          <span style={{ fontSize: '11px', color: '#047857' }}>Insurer broker payouts</span>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL LEDGER ENTRIES</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            {transactions.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{transactions.filter(t => t.status === 'pending').length} pending clearance</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'all', label: 'All Transactions', count: transactions.length },
          { id: 'customer_due', label: 'Customer Premium Dues', count: transactions.filter(t => t.type === 'customer_due').length },
          { id: 'broker_payout', label: 'Broker & Agent Settlements', count: transactions.filter(t => t.type === 'broker_payout').length },
          { id: 'pending', label: 'Pending Clearance', count: transactions.filter(t => t.status === 'pending').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
              backgroundColor: activeTab === tab.id ? 'var(--color-accent-light)' : 'var(--color-bg)',
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontWeight: '700'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by customer name, policy number, or transaction description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading transaction ledger...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <BookOpen size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>No ledger records found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Financial transactions will populate automatically as policy actions occur.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Customer & Policy</th>
                  <th>Debit (Due)</th>
                  <th>Credit (Settled)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.date)}
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {tx.type === 'customer_due' ? 'Customer Liability' : 'Broker Settlement'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '500' }}>{tx.customer}</div>
                      {tx.policyNumber && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>#{tx.policyNumber}</div>
                      )}
                    </td>

                    <td style={{ fontWeight: '600', color: tx.debit > 0 ? '#dc2626' : 'inherit' }}>
                      {tx.debit > 0 ? `-${formatINR(tx.debit)}` : '—'}
                    </td>

                    <td style={{ fontWeight: '600', color: tx.credit > 0 ? '#16a34a' : 'inherit' }}>
                      {tx.credit > 0 ? `+${formatINR(tx.credit)}` : '—'}
                    </td>

                    <td>
                      <span className={`badge ${tx.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {tx.status === 'paid' ? 'Settled' : 'Pending'}
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
