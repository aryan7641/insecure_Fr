import React, { useState } from 'react';
import { TrendingUp, UploadCloud, Calendar, DollarSign } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { NavImportModal } from '../components/mutualfunds/NavImportModal';
import { MOCK_MUTUAL_FUNDS, MOCK_SIPS } from '../api/mockData';

export const MutualFundsPage = () => {
  const [activeTab, setActiveTab] = useState('investments');
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  const tabs = [
    { id: 'investments', label: 'Folio Investments' },
    { id: 'sips', label: 'Active SIPs', count: MOCK_SIPS.length },
    { id: 'transactions', label: 'Transactions' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Mutual Funds Portfolio</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Folios, SIP tracking & daily NAV update center (All values in INR ₹).
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setIsNavModalOpen(true)}>
          <UploadCloud size={16} /> Import Daily NAV (CSV)
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'investments' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio Number</th>
                <th>Customer</th>
                <th>AMC</th>
                <th>Scheme Name</th>
                <th>Units</th>
                <th>Invested (INR)</th>
                <th>Current Valuation (Calculated)</th>
                <th>NAV (Date)</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_MUTUAL_FUNDS.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '700' }}>{m.folioNumber}</td>
                  <td>{m.customerName}</td>
                  <td>{m.amc}</td>
                  <td>{m.schemeName}</td>
                  <td>{m.units.toLocaleString()}</td>
                  <td>₹ {m.investedAmount.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                    ₹ {m.currentValue.toLocaleString('en-IN')}
                  </td>
                  <td>₹ {m.latestNav} ({m.navDate})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sips' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Folio Number</th>
                <th>AMC / Scheme</th>
                <th>Monthly SIP Amount</th>
                <th>SIP Installment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SIPS.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.customerName}</td>
                  <td>{s.folioNumber}</td>
                  <td>{s.amc} — {s.schemeName}</td>
                  <td style={{ fontWeight: '700' }}>₹ {s.amount.toLocaleString('en-IN')}</td>
                  <td>{s.sipDate}th of every month</td>
                  <td><span className="badge badge-success">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Transaction history ledger (Purchase, Redemption, SIP, Switch In/Out, STP, SWP).
        </div>
      )}

      <NavImportModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
      />
    </div>
  );
};
