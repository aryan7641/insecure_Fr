import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, Eye, CheckCircle2, FileSearch, Loader, RefreshCw, ExternalLink, Shield } from 'lucide-react';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const { currentAgency } = useAgency();
  const { currentUser, isAdmin } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');

  const fetchDocuments = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/documents`);
      const items = res?.data?.documents || res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setDocuments(items);
      }
    } catch (err) {
      console.warn('Failed to load documents:', err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchDocuments();

    const handleSync = () => fetchDocuments();
    window.addEventListener('policyCreated', handleSync);
    return () => {
      window.removeEventListener('policyCreated', handleSync);
    };
  }, [fetchDocuments]);

  return (
    <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Document Vault & Policy Schedules
            </h1>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', fontWeight: '700' }}>
              {documents.length} Files
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            Secure AWS S3 storage for Indian insurance policy PDF schedules, KYC proofs, and verified OCR extractions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={fetchDocuments} 
            title="Refresh vault"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setIsPdfModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-accent)'
            }}
          >
            <UploadCloud size={14} />
            <span>Upload Policy PDF</span>
          </button>
        </div>
      </div>

      {/* Documents Table */}
      {loading && documents.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: 'var(--color-accent)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading document vault from AWS S3...</p>
        </div>
      ) : documents.length === 0 ? (
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
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text-main)' }}>No documents stored yet</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px auto' }}>
            Upload your first policy schedule PDF to store it securely in AWS S3 and extract metadata automatically.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsPdfModalOpen(true)}>
            <UploadCloud size={14} /> Upload First PDF
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Document Name</th>
                  <th>Client</th>
                  <th>Policy Number</th>
                  <th>Category</th>
                  <th>OCR Verification</th>
                  <th>Upload Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => {
                  const cust = d.customerId;
                  const custName = cust?.name || 'Unassigned';
                  const custId = cust?._id || cust?.id;
                  const polNum = d.policyId?.policyNumber || d.policyNumber || '—';
                  const isVerified = d.verificationState === 'verified';

                  return (
                    <tr key={d._id || d.id}>
                      <td style={{ paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                          <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-main)' }}>
                            {d.fileName}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div 
                          style={{ fontWeight: '500', fontSize: '12.5px', color: custId ? 'var(--color-text-main)' : 'var(--color-text-muted)', cursor: custId ? 'pointer' : 'default' }}
                          onClick={() => custId && navigate(`/customers/${custId}`)}
                        >
                          {custName}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: '600', fontSize: '12.5px', color: 'var(--color-text-body)' }}>
                          {polNum}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                          {d.category || 'Policy Schedule'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10.5px' }}>
                          {d.verificationState || d.ocrStatus || 'Verified'}
                        </span>
                      </td>

                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {d.createdAt ? formatDate(d.createdAt) : '—'}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        {d.blobUrl ? (
                          <a 
                            href={d.blobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <Eye size={13} /> View File
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>Stored</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy PDF Modal */}
      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => fetchDocuments()}
      />
    </div>
  );
};
