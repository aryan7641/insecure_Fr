import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, Download, Filter, Calendar, Users, 
  Shield, AlertTriangle, RefreshCw, Loader, CheckCircle, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';

const REPORT_TYPES = [
  { id: 'policies', label: 'Policy Portfolio Report', description: 'Complete register of all active, expiring, and renewed insurance policies.' },
  { id: 'renewals', label: 'Renewals & Expiry Schedule', description: 'Detailed horizon list of upcoming renewal obligations and overdue accounts.' },
  { id: 'customers', label: 'Customer Demographic Register', description: 'Client profiles, contact details, PAN, and active policy counts.' },
  { id: 'commissions', label: 'Broker Commission Report', description: 'Gross written premiums, commission percentages, and payable earnings.' },
  { id: 'expired', label: 'Lapsed & Expired Policies', description: 'Audit list of un-renewed policies for win-back campaigns.' }
];

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const { currentAgency } = useAgency();

  const [selectedReport, setSelectedReport] = useState('policies');
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const loadReportData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const [polRes, custRes] = await Promise.all([
        apiClient.get(`/agencies/${agencyId}/insurance-policies`),
        apiClient.get(`/agencies/${agencyId}/customers`)
      ]);

      const polItems = polRes?.data?.policies || polRes?.data?.data || polRes?.data || [];
      const custItems = custRes?.data?.customers || custRes?.data?.data || custRes?.data || [];

      if (Array.isArray(polItems)) setPolicies(polItems);
      if (Array.isArray(custItems)) setCustomers(custItems);
    } catch (err) {
      console.warn('Failed to load report data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Export CSV
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let fileName = `INSecure_${selectedReport}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (selectedReport === 'policies' || selectedReport === 'renewals' || selectedReport === 'expired') {
      headers = ['Policy Number', 'Customer Name', 'Customer Mobile', 'Insurer', 'Line of Business', 'Premium (INR)', 'Start Date', 'Expiry Date', 'Status'];
      
      let sourceList = policies;
      if (selectedReport === 'renewals') {
        sourceList = policies.filter(p => p.status === 'expiring_soon' || p.status === 'active');
      } else if (selectedReport === 'expired') {
        sourceList = policies.filter(p => p.status === 'expired');
      }

      rows = sourceList.map(p => [
        `"${p.policyNumber || ''}"`,
        `"${p.customerId?.name || p.customerName || ''}"`,
        `"${p.customerId?.mobile || p.customerMobile || ''}"`,
        `"${p.insurerName || p.insuranceCompany || ''}"`,
        `"${(p.lob || p.policyType || '').toUpperCase()}"`,
        p.premiumAmount || p.premium || 0,
        `"${formatDate(p.startDate)}"`,
        `"${formatDate(p.renewalDate || p.endDate)}"`,
        `"${p.status || 'active'}"`
      ]);
    } else if (selectedReport === 'customers') {
      headers = ['Customer Name', 'Mobile', 'Email', 'City', 'State', 'PAN', 'Created At'];
      rows = customers.map(c => [
        `"${c.name || ''}"`,
        `"${c.mobile || ''}"`,
        `"${c.email || ''}"`,
        `"${c.city || c.address?.city || ''}"`,
        `"${c.state || c.address?.state || ''}"`,
        `"${c.pan || ''}"`,
        `"${formatDate(c.createdAt)}"`
      ]);
    } else if (selectedReport === 'commissions') {
      headers = ['Policy Number', 'Customer Name', 'Insurer', 'Line of Business', 'Premium (INR)', 'Commission Rate (%)', 'Commission Amount (INR)', 'Status'];
      rows = policies.map(p => {
        const premium = p.premiumAmount || p.premium || 0;
        const rate = p.commissionRate || 15;
        const amt = Math.round((premium * rate) / 100);
        return [
          `"${p.policyNumber || ''}"`,
          `"${p.customerId?.name || p.customerName || ''}"`,
          `"${p.insurerName || p.insuranceCompany || ''}"`,
          `"${(p.lob || p.policyType || '').toUpperCase()}"`,
          premium,
          `${rate}%`,
          amt,
          `"${p.status === 'active' || p.status === 'renewed' ? 'Received' : 'Pending'}"`
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Exported ${fileName} successfully`, 'success');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Insurance Business Reports</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Generate operational reports, compliance schedules, and downloadable CSV registers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={loadReportData}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleExportCSV}
          >
            <Download size={16} /> Download CSV Register
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {REPORT_TYPES.map((rep) => {
          const isSelected = selectedReport === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className="card"
              style={{
                padding: '14px',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                backgroundColor: isSelected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                {rep.label}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                {rep.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Data Preview Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
              {REPORT_TYPES.find(r => r.id === selectedReport)?.label} Preview
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing real-time records from live MongoDB database
            </p>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={handleExportCSV}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--color-accent)' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Compiling report data...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  {selectedReport === 'customers' ? (
                    <>
                      <th>Customer Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>PAN</th>
                      <th>Created</th>
                    </>
                  ) : (
                    <>
                      <th>Policy No</th>
                      <th>Customer</th>
                      <th>Insurer</th>
                      <th>LOB</th>
                      <th>Premium</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedReport === 'customers' ? (
                  customers.slice(0, 10).map(c => (
                    <tr key={c._id || c.id}>
                      <td style={{ fontWeight: '600' }}>{c.name}</td>
                      <td>{c.mobile}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{c.email || '—'}</td>
                      <td>{c.city || c.address?.city || '—'}</td>
                      <td><code>{c.pan || '—'}</code></td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{formatDate(c.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  policies.slice(0, 10).map(p => {
                    const lob = getLOBBadge(p.lob || p.policyType);
                    return (
                      <tr key={p._id || p.id}>
                        <td><code>#{p.policyNumber}</code></td>
                        <td style={{ fontWeight: '600' }}>{p.customerId?.name || p.customerName || 'Customer'}</td>
                        <td>{p.insurerName || p.insuranceCompany}</td>
                        <td>
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
                        <td style={{ fontWeight: '700' }}>{formatINR(p.premiumAmount || p.premium)}</td>
                        <td style={{ fontSize: '12px' }}>{formatDate(p.renewalDate || p.endDate)}</td>
                        <td>
                          <span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'expiring_soon' ? 'badge-warning' : 'badge-danger'}`}>
                            {p.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
