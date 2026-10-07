import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, CreditCard, Car, Building2, UploadCloud, Eye, Download, 
  RefreshCw, Trash2, History, AlertCircle, CheckCircle2, Shield, X, Loader, 
  FileCheck, Clock, ExternalLink
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { formatDate, formatINR } from '../../utils/formatters';

const POLICY_DOC_TYPES = [
  {
    type: 'AADHAAR',
    title: 'Aadhaar Card',
    description: 'Government 12-digit UID identity proof for customer KYC compliance.',
    icon: FileText
  },
  {
    type: 'PAN',
    title: 'PAN Card',
    description: 'Permanent Account Number for tax compliance and financial records.',
    icon: CreditCard
  },
  {
    type: 'RC',
    title: 'Registration Certificate (RC)',
    description: 'Vehicle registration smart card / certificate for motor coverage validation.',
    icon: Car
  },
  {
    type: 'GST_CERTIFICATE',
    title: 'GST Certificate',
    description: 'Goods and Services Tax registration for corporate / commercial policyholders.',
    icon: Building2
  }
];

export const PolicyDocumentsModal = ({ isOpen, onClose, policy, onDocumentsUpdated }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();
  const { isAdmin } = useAuth();

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');
  const policyId = policy?._id || policy?.id;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [activeHistoryType, setActiveHistoryType] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hidden file input refs for each type
  const fileInputRefs = useRef({});

  const fetchDocuments = useCallback(async () => {
    if (!agencyId || !policyId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/agencies/${agencyId}/insurance-policies/${policyId}/documents?includeHistory=true`
      );
      const list = res?.data?.documents || res?.documents || (Array.isArray(res?.data) ? res.data : []);
      setDocuments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load policy documents:', err.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, policyId]);

  useEffect(() => {
    if (isOpen && policyId) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setActiveHistoryType(null);
      setPreviewDoc(null);
      setDeleteConfirmDoc(null);
    }
  }, [isOpen, policyId, fetchDocuments]);

  // Handle file selection and upload
  const handleFileSelected = async (docType, e) => {
    const file = e.target.files?.[0];
    // Reset file input so same file selection triggers change if needed
    e.target.value = '';
    if (!file) return;

    // Client-side validations
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      addToast(`Invalid file format "${ext}". Only PDF, JPG, and PNG files are allowed.`, 'error');
      return;
    }

    const maxBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxBytes) {
      addToast(`File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds 15MB limit.`, 'error');
      return;
    }

    setUploadingType(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      await apiClient.post(
        `/agencies/${agencyId}/insurance-policies/${policyId}/documents`,
        formData
      );

      addToast(`${POLICY_DOC_TYPES.find(d => d.type === docType)?.title || docType} uploaded successfully!`, 'success');
      await fetchDocuments();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setUploadingType(null);
    }
  };

  // Trigger hidden file input
  const triggerUpload = (docType) => {
    if (fileInputRefs.current[docType]) {
      fileInputRefs.current[docType].click();
    }
  };

  // Generate authorized download link and trigger download
  const handleDownload = async (doc) => {
    try {
      const res = await apiClient.get(
        `/agencies/${agencyId}/insurance-policies/${policyId}/documents/${doc._id || doc.id}/download`
      );
      const url = res?.data?.downloadUrl || res?.downloadUrl;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.originalFilename || 'policy-document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Download URL not received from server');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to download document', 'error');
    }
  };

  // Preview document securely
  const handlePreview = async (doc) => {
    try {
      const res = await apiClient.get(
        `/agencies/${agencyId}/insurance-policies/${policyId}/documents/${doc._id || doc.id}/preview`
      );
      const url = res?.data?.downloadUrl || res?.downloadUrl;
      if (url) {
        setPreviewDoc({ ...doc, previewUrl: url });
      } else {
        throw new Error('Preview URL not generated');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate preview URL', 'error');
    }
  };

  // Delete / Archive document (Admin only)
  const handleDeleteDocument = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(
        `/agencies/${agencyId}/insurance-policies/${policyId}/documents/${deleteConfirmDoc._id || deleteConfirmDoc.id}`
      );
      addToast('Document archived successfully', 'success');
      setDeleteConfirmDoc(null);
      await fetchDocuments();
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to archive document', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !policy) return null;

  const currentDocsByType = {};
  const allDocsByType = {};

  POLICY_DOC_TYPES.forEach(t => {
    currentDocsByType[t.type] = documents.find(d => d.documentType === t.type && d.isCurrent);
    allDocsByType[t.type] = documents.filter(d => d.documentType === t.type).sort((a, b) => b.version - a.version);
  });

  const totalCurrentUploaded = Object.values(currentDocsByType).filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Policy KYC & Verification Documents" maxWidth="820px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Policy Context Header */}
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-accent)' }}>
                {policy.policyNumber || 'No Policy Number'}
              </span>
              <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
                {policy.insuranceType || policy.policyType || 'Policy'}
              </span>
              <span className={`badge ${policy.status === 'expired' ? 'badge-danger' : 'badge-neutral'}`} style={{ textTransform: 'capitalize', fontSize: '10.5px' }}>
                {policy.status || 'Active'}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              Insurer: <strong style={{ color: 'var(--color-text-main)' }}>{policy.insuranceCompany || '—'}</strong> • 
              Client: <strong style={{ color: 'var(--color-text-main)' }}>{policy.customerId?.name || policy.customerName || 'Customer'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Storage: <strong style={{ color: 'var(--color-text-main)' }}>{totalCurrentUploaded} / 4</strong> uploaded
            </span>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={fetchDocuments}
              disabled={loading}
              title="Refresh Documents"
              style={{ padding: '4px 8px' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Informative Note */}
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-text-muted)'
        }}>
          <Shield size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span>
            These documents are <strong>strictly optional</strong> policy attachments stored in private encrypted storage. They remain permanently preserved even if the policy expires or is renewed.
          </span>
        </div>

        {/* 4 Document Type Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {POLICY_DOC_TYPES.map((item) => {
            const Icon = item.icon;
            const currentDoc = currentDocsByType[item.type];
            const history = allDocsByType[item.type] || [];
            const isUploading = uploadingType === item.type;

            return (
              <div 
                key={item.type}
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: currentDoc ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  backgroundColor: currentDoc ? 'var(--color-card)' : 'transparent',
                  position: 'relative'
                }}
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={el => fileInputRefs.current[item.type] = el}
                  style={{ display: 'none' }}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => handleFileSelected(item.type, e)}
                />

                <div>
                  {/* Card Title & Icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: currentDoc ? 'var(--color-accent-subtle, #e0f2fe)' : '#f1f5f9',
                        color: currentDoc ? 'var(--color-accent, #0284c7)' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={17} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                          {item.title}
                        </h4>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {currentDoc ? (
                      <span className="badge badge-success" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} /> v{currentDoc.version} Current
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {/* Uploaded File Details (if present) */}
                  {currentDoc ? (
                    <div style={{
                      margin: '12px 0',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      color: 'var(--color-text-body)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: 'var(--color-text-main)', wordBreak: 'break-all' }}>
                          {currentDoc.originalFilename}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '10.5px' }}>
                          {(currentDoc.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '10.5px' }}>
                        <span>Uploaded by: <strong>{currentDoc.uploadedByName || 'Agent'}</strong></span>
                        <span>{formatDate(currentDoc.uploadedAt)}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-light)', fontFamily: 'monospace', marginTop: '2px' }}>
                        SHA-256: {currentDoc.checksum?.slice(0, 16)}...
                      </div>
                    </div>
                  ) : (
                    <div style={{ margin: '14px 0', fontSize: '11.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No {item.title} attached to this policy yet.
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '6px' }}>
                  {currentDoc ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handlePreview(currentDoc)}
                          title="Preview Document Inline"
                          style={{ fontSize: '11.5px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> View
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDownload(currentDoc)}
                          title="Download Original File"
                          style={{ fontSize: '11.5px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={12} /> Download
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => triggerUpload(item.type)}
                          disabled={isUploading}
                          title="Upload Newer Version"
                          style={{ fontSize: '11.5px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {isUploading ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />} Replace
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {history.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setActiveHistoryType(item.type)}
                            title="View Previous Versions"
                            style={{ fontSize: '11px', padding: '4px 7px', color: 'var(--color-primary)' }}
                          >
                            <History size={12} style={{ marginRight: '3px' }} /> {history.length} versions
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteConfirmDoc(currentDoc)}
                            title="Archive / Remove Document"
                            style={{ fontSize: '11px', padding: '4px 7px', color: '#dc2626' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => triggerUpload(item.type)}
                        disabled={isUploading}
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {isUploading ? (
                          <>
                            <Loader size={13} className="animate-spin" />
                            <span>Uploading {item.title}...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} />
                            <span>Upload {item.title}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Version History Modal */}
      {activeHistoryType && (
        <Modal
          isOpen={!!activeHistoryType}
          onClose={() => setActiveHistoryType(null)}
          title={`${POLICY_DOC_TYPES.find(d => d.type === activeHistoryType)?.title} — Version History`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
              All uploaded versions are permanently stored for historical compliance and future OCR / extraction runs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(allDocsByType[activeHistoryType] || []).map((vDoc) => (
                <div
                  key={vDoc._id || vDoc.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: vDoc.isCurrent ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    backgroundColor: vDoc.isCurrent ? 'var(--color-accent-subtle, #f0f9ff)' : 'var(--color-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>
                        Version {vDoc.version}
                      </strong>
                      {vDoc.isCurrent && (
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>Current</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {vDoc.originalFilename} • {(vDoc.fileSize / 1024).toFixed(1)} KB
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-light)' }}>
                      Uploaded by {vDoc.uploadedByName || 'Agent'} on {formatDate(vDoc.uploadedAt)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handlePreview(vDoc)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownload(vDoc)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveHistoryType(null)}>
                Close History
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inline Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview — ${previewDoc.originalFilename} (v${previewDoc.version})`}
          maxWidth="900px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              width: '100%',
              height: '560px',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.previewUrl}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <img
                  src={previewDoc.previewUrl}
                  alt={previewDoc.originalFilename}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                {previewDoc.documentType} • Version {previewDoc.version} • {(previewDoc.fileSize / 1024).toFixed(1)} KB
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={previewDoc.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} /> Open in New Tab
                </a>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownload(previewDoc)}
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      {deleteConfirmDoc && (
        <Modal
          isOpen={!!deleteConfirmDoc}
          onClose={() => setDeleteConfirmDoc(null)}
          title="Archive Policy Document"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-body)' }}>
              Are you sure you want to archive <strong>{deleteConfirmDoc.originalFilename}</strong> (Version {deleteConfirmDoc.version})?
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              The document will be removed from active display. The underlying secure file remains safely preserved in private object storage for compliance and audit retention.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmDoc(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteDocument} disabled={isDeleting}>
                {isDeleting ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
