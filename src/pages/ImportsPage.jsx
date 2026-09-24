import React, { useState } from 'react';
import { UploadCloud, Download, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ImportsPage = () => {
  const { addToast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState('Customers');
  const [file, setFile] = useState(null);
  const [importState, setImportState] = useState('idle'); // idle -> validating -> preview -> completed
  const [importResult, setImportResult] = useState(null);

  const entities = [
    'Customers',
    'Insurance Policies',
    'Mutual Funds',
    'SIPs',
    'Transactions',
    'NAV Data'
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportState('idle');
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    addToast(`Downloaded CSV Template for ${selectedEntity}`, 'info');
  };

  const handleValidateAndPreview = () => {
    if (!file) return;
    setImportState('validating');

    setTimeout(() => {
      setImportState('preview');
      setImportResult({
        total: 500,
        valid: 470,
        failed: 30,
        errors: [
          { row: 34, field: 'mobile', message: 'Invalid 10-digit mobile number format' },
          { row: 82, field: 'name', message: 'Missing required customer name' },
          { row: 117, field: 'pan', message: 'Duplicate customer PAN matched in agency' }
        ]
      });
      addToast('Validation complete: 470 valid rows, 30 errors found.', 'warning');
    }, 1200);
  };

  const handleExecuteImport = () => {
    setImportState('completed');
    addToast(`Successfully imported 470 ${selectedEntity} records into database!`, 'success');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Batch Data Import Center</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
          Bulk import customers, insurance policies, mutual fund folios, SIPs, transactions & daily NAV.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Step 1: Select Entity & Download Template */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>1. Select Data Type</h3>
          
          <div className="form-group">
            <label className="form-label">Import Target Entity</label>
            <select className="form-select" value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}>
              {entities.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={handleDownloadTemplate}>
            <Download size={16} /> Download {selectedEntity} Template
          </button>
        </div>

        {/* Step 2: File Upload & Pipeline Execution */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>2. Upload & Process Spreadsheet</h3>

          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg)',
            marginBottom: '16px'
          }}>
            <FileSpreadsheet size={36} style={{ color: 'var(--color-accent)', marginBottom: '8px' }} />
            <div style={{ fontWeight: '600', fontSize: '14px' }}>
              {file ? file.name : `Select CSV/Excel for ${selectedEntity}`}
            </div>
            <input type="file" accept=".csv, .xlsx" id="import-file-input" style={{ display: 'none' }} onChange={handleFileChange} />
            <label htmlFor="import-file-input" className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
              Choose File
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={!file || importState === 'validating'} onClick={handleValidateAndPreview}>
              <UploadCloud size={16} /> Validate & Preview
            </button>
          </div>
        </div>
      </div>

      {/* Row-Level Errors & Import Summary Table */}
      {importResult && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Import Validation Results</h3>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Total: <strong>{importResult.total}</strong> | Clean: <strong style={{ color: 'var(--color-success)' }}>{importResult.valid}</strong> | Errors: <strong style={{ color: 'var(--color-danger)' }}>{importResult.failed}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm">
                <Download size={14} /> Download Error Report (.CSV)
              </button>
              {importState !== 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={handleExecuteImport}>
                  <CheckCircle size={14} /> Import {importResult.valid} Clean Records
                </button>
              )}
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-danger)', marginBottom: '8px' }}>
            Row-Level Failure Log ({importResult.errors.length} sample items shown)
          </h4>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  <th>Field</th>
                  <th>Validation Error Details</th>
                </tr>
              </thead>
              <tbody>
                {importResult.errors.map((err, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>Row {err.row}</td>
                    <td><code>{err.field}</code></td>
                    <td>{err.message}</td>
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
