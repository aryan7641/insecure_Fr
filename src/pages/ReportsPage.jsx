import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, Download, Filter, Calendar, Users, 
  Shield, AlertTriangle, RefreshCw, Loader, CheckCircle, BarChart3, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { formatINR, formatDate, getLOBBadge } from '../utils/formatters';

const REPORT_TYPES = [
  { id: 'policies', label: 'Policy Portfolio Register', description: 'Complete register of active, expiring, and renewed insurance policies across all lines.' },
  { id: 'renewals', label: 'Renewals & Expiry Horizon', description: 'Action schedule of upcoming renewal obligations and overdue accounts.' },
  { id: 'customers', label: 'Client Demographic Register', description: 'Profiles, contact details, PAN, city, and active policy counts.' },
  { id: 'commissions', label: 'Broker Commission Report', description: 'Gross written premiums, commission rates, and receivable earnings.' },
  { id: 'expired', label: 'Lapsed & Expired Policies', description: 'Audit list of lapsed policies for retention and recovery campaigns.' }
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
        const rate = p.commission?.percentage ?? (p.commission?.commissionPercentage ?? 0);
        const commAmt = p.commission?.amount ?? (p.commission?.commissionAmount ?? (rate ? Math.round((premium * rate) / 100) : 0));
        return [
          `"${p.policyNumber || ''}"`,
          `"${p.customerId?.name || p.customerName || ''}"`,
          `"${p.insurerName || p.insuranceCompany || ''}"`,
          `"${(p.lob || p.policyType || '').toUpperCase()}"`,
          premium,
          rate ? `${rate}%` : '0%',
          commAmt,
          `"${p.status === 'active' || p.status === 'renewed' ? 'Received' : 'Pending'}"`
        ];
      });
    }

    if (rows.length === 0) {
      addToast('No data available to export for this report filter', 'warning');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Successfully downloaded ${fileName}`, 'success');
  };

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            Insurance Portfolio Reports
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Generate structured CSV and Excel registers for audits, tax filing, and renewal pipeline reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadReportData}
            title="Refresh Data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-accent)'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Types Selector Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {REPORT_TYPES.map(rt => {
          const isSelected = selectedReport === rt.id;
          return (
            <div
              key={rt.id}
              onClick={() => setSelectedReport(rt.id)}
              className="card card-interactive"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FileSpreadsheet size={18} style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                  {isSelected && <CheckCircle2 size={15} style={{ color: 'var(--color-accent)' }} />}
                </div>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: isSelected ? 'var(--color-accent)' : 'var(--color-text-main)', marginTop: '8px' }}>
                  {rt.label}
                </h4>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.3 }}>
                {rt.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Preview Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Report Preview: {REPORT_TYPES.find(r => r.id === selectedReport)?.label}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing live agency dataset ready for export
            </span>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={13} /> Export This Report
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Generating report preview...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Identifier / Customer</th>
                  <th>Insurer / Details</th>
                  <th>Category</th>
                  <th>Financial Volume</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(selectedReport === 'customers' ? customers : policies).slice(0, 10).map((item, idx) => {
                  if (selectedReport === 'customers') {
                    return (
                      <tr key={item._id || item.id || idx}>
                        <td style={{ paddingLeft: '20px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          {item.name}
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                          {item.mobile} • {item.city || 'India'}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                            {item.customerType || 'Individual'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600', fontSize: '12.5px' }}>
                          PAN: {item.pan || '—'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '20px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    );
                  }

                  const custName = item.customerId?.name || item.customerName || 'Client';
                  const insurer = item.insuranceCompany || item.insurerName || 'Insurer';
                  const prem = item.premiumAmount || item.premium || item.finalPremium || 0;

                  return (
                    <tr key={item._id || item.id || idx}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-accent)' }}>
                          {item.policyNumber}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {custName}
                        </div>
                      </td>

                      <td style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--color-text-main)' }}>
                        {insurer}
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '10.5px', textTransform: 'uppercase' }}>
                          {item.lob || item.policyType || 'HEALTH'}
                        </span>
                      </td>

                      <td style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-main)' }}>
                        {formatINR(prem)}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <span className={`badge ${item.status === 'active' || item.status === 'renewed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {item.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
