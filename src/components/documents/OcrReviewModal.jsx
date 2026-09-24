import React, { useState } from 'react';
import { FileSearch, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';

export const OcrReviewModal = ({ isOpen, onClose, document, onConfirmSuccess }) => {
  const { addToast } = useToast();
  
  if (!document) return null;

  const [extractedData, setExtractedData] = useState(document.ocrExtracted || {
    policyNumber: 'HDFC-HE-998822',
    insurer: 'HDFC ERGO General Insurance',
    premium: '28000',
    renewalDate: '2026-10-15',
    panNumber: 'ABCPS1234F'
  });

  const handleFieldChange = (key, val) => {
    setExtractedData(prev => ({ ...prev, [key]: val }));
  };

  const handleConfirm = () => {
    addToast(`Extracted fields explicitly confirmed for ${document.fileName}`, 'success');
    if (onConfirmSuccess) onConfirmSuccess(document.id, extractedData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent OCR Review & Verification" maxWidth="720px">
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'var(--color-warning-bg)',
        border: '1px solid var(--color-warning-border)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: 'var(--color-warning)'
      }}>
        <AlertTriangle size={18} />
        <div>
          <strong>Verification Required:</strong> OCR output is unverified. Review and edit fields before confirming into structured database.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Document Preview Placeholder */}
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '20px',
          backgroundColor: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          textAlign: 'center'
        }}>
          <FileSearch size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{document.fileName}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Category: {document.category} | Type: {document.fileType}
          </div>
          <span className="badge badge-warning" style={{ marginTop: '12px' }}>
            Unconfirmed OCR Draft
          </span>
        </div>

        {/* Editable Extracted Fields */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Extracted Metadata Fields</h4>

          {Object.entries(extractedData).map(([key, value]) => (
            <div key={key} className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '13px', padding: '8px 10px' }}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel Review</button>
        <button className="btn btn-primary" onClick={handleConfirm}>
          <CheckCircle2 size={16} /> Confirm & Save Verified Data
        </button>
      </div>
    </Modal>
  );
};
