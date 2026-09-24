import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';

export const NavImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const mockResult = {
        totalRows: 120,
        successCount: 118,
        errorCount: 2,
        errors: [
          { row: 45, schemeCode: '109922', message: 'Invalid NAV price format' },
          { row: 98, schemeCode: '128811', message: 'NAV Date missing' }
        ]
      };
      setResult(mockResult);
      addToast('NAV Data import completed with validation feedback.', 'success');
      if (onImportSuccess) onImportSuccess(mockResult);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Daily Scheme NAV Data (CSV/Excel)" maxWidth="580px">
      <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
        Upload NAV updates file. Supported columns: <code>schemeCode</code>, <code>schemeName</code>, <code>nav</code>, <code>navDate</code>.
      </div>

      <div style={{
        border: '2px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: 'var(--color-bg)',
        marginBottom: '20px'
      }}>
        <FileSpreadsheet size={40} style={{ color: 'var(--color-accent)', marginBottom: '10px' }} />
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
          {file ? file.name : 'Select NAV CSV or Excel file'}
        </div>
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="nav-file-input" 
        />
        <label htmlFor="nav-file-input" className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
          Browse File
        </label>
      </div>

      {isProcessing && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-accent)' }}>
          Processing and recalculating scheme valuation...
        </div>
      )}

      {result && (
        <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-success)', fontWeight: '600', marginBottom: '8px' }}>
            <CheckCircle size={18} />
            Imported {result.successCount} of {result.totalRows} scheme NAV records.
          </div>

          {result.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-danger)', marginBottom: '6px' }}>
                Failed Rows ({result.errors.length}):
              </div>
              {result.errors.map((err, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--color-danger)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <AlertCircle size={14} /> Row {err.row} (Scheme {err.schemeCode}): {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isProcessing}>
          <UploadCloud size={16} /> Upload & Validate NAV
        </button>
      </div>
    </Modal>
  );
};
