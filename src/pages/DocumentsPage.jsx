import React, { useState } from 'react';
import { FileText, UploadCloud, Eye, CheckCircle2, FileSearch } from 'lucide-react';
import { MOCK_DOCUMENTS } from '../api/mockData';
import { OcrReviewModal } from '../components/documents/OcrReviewModal';

export const DocumentsPage = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Document Vault & OCR Processing</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Secure Azure Blob document storage & agent-verified OCR metadata extraction.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Customer</th>
              <th>Category</th>
              <th>File Type</th>
              <th>Size</th>
              <th>Uploaded Date</th>
              <th>OCR Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENTS.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: '600' }}>{d.fileName}</td>
                <td>{d.customerName}</td>
                <td><span className="badge badge-neutral">{d.category}</span></td>
                <td>{d.fileType}</td>
                <td>{d.size}</td>
                <td>{d.uploadedAt}</td>
                <td>
                  <span className={`badge ${d.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDoc(d)}>
                    <Eye size={14} /> Review OCR Metadata
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OcrReviewModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </div>
  );
};
