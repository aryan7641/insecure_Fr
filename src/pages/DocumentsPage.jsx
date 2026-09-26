import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, Eye, CheckCircle2, FileSearch, Loader, RefreshCw, ExternalLink } from 'lucide-react';
import { PolicyPdfUploadModal } from '../components/insurance/PolicyPdfUploadModal';
import { apiClient } from '../api/client';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const { currentAgency } = useAgency();
  const { currentUser, isAdmin } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Centralized Document Vault & Policy PDFs</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Secure AWS S3 document repository for original policy schedules, KYC proofs, and OCR extractions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchDocuments} title="Refresh vault">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsPdfModalOpen(true)}
            style={{ backgroundColor: '#2563eb' }}
          >
            <UploadCloud size={16} /> Upload Policy PDF (AI OCR)
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading && documents.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading document vault from AWS storage...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No documents stored yet</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Upload your first policy schedule PDF to store it securely in AWS S3 and extract metadata.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document / File Name</th>
                <th>Associated Customer</th>
                <th>Attached Policy</th>
                <th>Category</th>
                <th>Verification State</th>
                <th>Uploaded Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => {
                const cust = d.customerId;
                const custName = cust?.name || 'Unassigned';
                const custId = cust?._id || cust?.id;
                const pol = d.policyId;
                const uploadFormatted = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                return (
                  <tr key={d._id || d.id}>
                    <td>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: 'var(--color-accent)' }} />
                        <span>{d.fileName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '24px' }}>
                        Type: {d.fileType?.toUpperCase()} • {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : 'S3 Object'}
                      </div>
                    </td>

                    <td>
                      <div 
                        style={{ fontWeight: '600', cursor: custId ? 'pointer' : 'default', color: custId ? 'var(--color-primary)' : 'inherit' }}
                        onClick={() => custId && navigate(`/customers/${custId}`)}
                      >
                        {custName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {cust?.mobile || '—'}
                      </div>
                    </td>

                    <td>
                      {pol ? (
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{pol.policyNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{pol.insuranceCompany}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {d.category || 'Policy Document'}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${d.verificationState === 'verified' || d.ocrConfirmed ? 'badge-success' : 'badge-warning'}`}>
                        {d.verificationState === 'verified' || d.ocrConfirmed ? 'Verified & Saved' : (d.verificationState || 'Needs Review')}
                      </span>
                    </td>

                    <td>{uploadFormatted}</td>

                    <td>
                      {d.blobUrl ? (
                        <a
                          href={d.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open original file in S3"
                        >
                          <Eye size={14} /> View File <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Stored in S3</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PolicyPdfUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveSuccess={() => fetchDocuments()}
      />
    </div>
  );
};
