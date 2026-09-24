import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Calendar, CreditCard, Shield, TrendingUp, 
  FileText, CalendarCheck, MessageSquare, Activity, DollarSign, Plus, Eye
} from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { PolicyStatusBadge } from '../components/insurance/PolicyStatusBadge';
import { 
  MOCK_CUSTOMERS, MOCK_POLICIES, MOCK_MUTUAL_FUNDS, MOCK_SIPS, 
  MOCK_DOCUMENTS, MOCK_FOLLOWUPS, MOCK_ACTIVITY 
} from '../api/mockData';
import { OcrReviewModal } from '../components/documents/OcrReviewModal';
import { WhatsappPreviewModal } from '../components/whatsapp/WhatsappPreviewModal';

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [ocrDocument, setOcrDocument] = useState(null);
  const [whatsappModal, setWhatsappModal] = useState(false);

  const customer = MOCK_CUSTOMERS.find(c => c.id === id) || MOCK_CUSTOMERS[0];
  const policies = MOCK_POLICIES.filter(p => p.customerId === customer.id);
  const mutualFunds = MOCK_MUTUAL_FUNDS.filter(m => m.customerId === customer.id);
  const sips = MOCK_SIPS.filter(s => s.customerId === customer.id);
  const documents = MOCK_DOCUMENTS.filter(d => d.customerId === customer.id);
  const followups = MOCK_FOLLOWUPS.filter(f => f.customerId === customer.id);
  const activity = MOCK_ACTIVITY.filter(a => a.customerId === customer.id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'insurance', label: 'Insurance', count: policies.length },
    { id: 'mutualfunds', label: 'Mutual Funds', count: mutualFunds.length },
    { id: 'documents', label: 'Documents', count: documents.length },
    { id: 'followups', label: 'Follow-ups', count: followups.length },
    { id: 'communication', label: 'Communication' },
    { id: 'activity', label: 'Activity' },
    { id: 'financial', label: 'Financial Overview' }
  ];

  return (
    <div>
      {/* Customer Header Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '22px'
            }}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{customer.name}</h1>
                <span className="badge badge-info">Assigned: {customer.assignedAgentName}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <span><Phone size={14} style={{ verticalAlign: 'middle' }} /> {customer.mobile}</span>
                <span><Mail size={14} style={{ verticalAlign: 'middle' }} /> {customer.email}</span>
                <span><CreditCard size={14} style={{ verticalAlign: 'middle' }} /> PAN: {customer.pan}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setWhatsappModal(true)} style={{ backgroundColor: '#25D366' }}>
            <MessageSquare size={16} /> Send WhatsApp
          </button>
        </div>
      </div>

      {/* 8 Tab Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Personal & Family Information</h3>
            <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>DOB:</strong> {customer.dob}</div>
              <div><strong>Aadhaar:</strong> {customer.aadhaar}</div>
              <div><strong>Occupation:</strong> {customer.occupation}</div>
              <div><strong>Annual Income:</strong> ₹ {customer.annualIncome.toLocaleString('en-IN')}</div>
              <div><strong>Address:</strong> {customer.address}</div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Nominees</h4>
            {customer.nominees.map((n, i) => (
              <div key={i} style={{ fontSize: '13px', padding: '6px 10px', backgroundColor: 'var(--color-bg)', borderRadius: '4px', marginBottom: '4px' }}>
                {n.name} ({n.relation}) — Share: {n.share}%
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>Portfolio Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active Insurance Policies</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{policies.length}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>MF Valuation</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-success)' }}>
                  ₹ {customer.mfSummary.currentPortfolioValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Upcoming Renewals</h4>
            {policies.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span>{p.company} ({p.policyNumber})</span>
                <span style={{ fontWeight: '600', color: 'var(--color-warning)' }}>{p.renewalDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Insurance */}
      {activeTab === 'insurance' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Customer Insurance Policies</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Number</th>
                <th>Company</th>
                <th>Type</th>
                <th>Premium</th>
                <th>Renewal Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600' }}>{p.policyNumber}</td>
                  <td>{p.company}</td>
                  <td>{p.policyType}</td>
                  <td>₹ {p.premium.toLocaleString('en-IN')} / {p.frequency}</td>
                  <td>{p.renewalDate}</td>
                  <td><PolicyStatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 3: Mutual Funds */}
      {activeTab === 'mutualfunds' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Mutual Fund Investments & SIPs</h3>
          <table className="data-table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Folio Number</th>
                <th>AMC</th>
                <th>Scheme Name</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>Latest NAV</th>
              </tr>
            </thead>
            <tbody>
              {mutualFunds.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '600' }}>{m.folioNumber}</td>
                  <td>{m.amc}</td>
                  <td>{m.schemeName}</td>
                  <td>₹ {m.investedAmount.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                    ₹ {m.currentValue.toLocaleString('en-IN')}
                  </td>
                  <td>₹ {m.latestNav} ({m.navDate})</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Active SIPs</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Scheme</th>
                <th>Monthly SIP Amount</th>
                <th>SIP Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sips.map(s => (
                <tr key={s.id}>
                  <td>{s.folioNumber}</td>
                  <td>{s.schemeName}</td>
                  <td style={{ fontWeight: '600' }}>₹ {s.amount.toLocaleString('en-IN')}</td>
                  <td>{s.sipDate}th of every month</td>
                  <td><span className="badge badge-success">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 4: Documents */}
      {activeTab === 'documents' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Customer Documents & OCR Vault</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Uploaded Date</th>
                <th>OCR Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: '600' }}>{d.fileName}</td>
                  <td>{d.category}</td>
                  <td>{d.uploadedAt}</td>
                  <td>
                    <span className={`badge ${d.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setOcrDocument(d)}>
                      <Eye size={14} /> Review OCR Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 5: Follow-ups */}
      {activeTab === 'followups' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Customer Follow-ups</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Assigned Agent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {followups.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: '600' }}>{f.title}</td>
                  <td>{f.type}</td>
                  <td>{f.dueDate}</td>
                  <td>{f.assignedAgentName}</td>
                  <td>
                    <span className={`badge ${f.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 6: Communication */}
      {activeTab === 'communication' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Communication Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <div style={{ fontWeight: '600', color: '#15803d' }}>WhatsApp Initiated</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Sent Health Renewal Reminder template via wa.me link</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>22 Sept 2026 15:40</div>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-accent)' }}>Call Note Added</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Customer confirmed renewal intent for HDFC Optima Secure.</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>20 Sept 2026 11:20</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 7: Activity */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Audit Activity Feed</h3>
          {activity.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '13px' }}>
              <strong>{a.action}</strong> — {a.details} (by {a.agentName} at {a.timestamp})
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 8: Financial Overview */}
      {activeTab === 'financial' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Financial Analytics (INR)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Invested (Mutual Funds)</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>₹ {customer.mfSummary.totalInvested.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Current Valuation</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>
                ₹ {customer.mfSummary.currentPortfolioValue.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Annual Premiums</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-info)' }}>
                ₹ {customer.insuranceSummary.totalPremium.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      <OcrReviewModal
        isOpen={!!ocrDocument}
        onClose={() => setOcrDocument(null)}
        document={ocrDocument}
      />

      <WhatsappPreviewModal
        isOpen={whatsappModal}
        onClose={() => setWhatsappModal(false)}
        customer={customer}
        policy={policies[0]}
      />
    </div>
  );
};
