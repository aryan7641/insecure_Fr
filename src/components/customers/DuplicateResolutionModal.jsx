import React from 'react';
import { AlertTriangle, GitMerge, UserPlus, RefreshCw, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

export const DuplicateResolutionModal = ({ isOpen, onClose, duplicateCustomer, newCustomerData, onResolve }) => {
  if (!duplicateCustomer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicate Customer Detected" maxWidth="680px">
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--color-warning-bg)',
        border: '1px solid var(--color-warning-border)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={24} style={{ color: 'var(--color-warning)', shrink: 0 }} />
        <div style={{ fontSize: '14px' }}>
          <strong style={{ color: 'var(--color-warning)' }}>Potential Duplicate Match Found</strong>
          <p style={{ marginTop: '2px', color: 'var(--color-text-main)' }}>
            A customer with mobile <strong>{duplicateCustomer.mobile}</strong> or PAN <strong>{duplicateCustomer.pan}</strong> already exists in this agency. Please select an explicit action below.
          </p>
        </div>
      </div>

      {/* Comparison View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Existing Record */}
        <div style={{
          padding: '14px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Existing Record (ID: {duplicateCustomer.id})
          </div>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>{duplicateCustomer.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            <div>Mobile: {duplicateCustomer.mobile}</div>
            <div>PAN: {duplicateCustomer.pan}</div>
            <div>Email: {duplicateCustomer.email}</div>
            <div>Agent: {duplicateCustomer.assignedAgentName}</div>
          </div>
        </div>

        {/* Incoming Record */}
        <div style={{
          padding: '14px',
          border: '1px dashed var(--color-accent)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-accent-light)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px' }}>
            New Entry Draft
          </div>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>{newCustomerData.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            <div>Mobile: {newCustomerData.mobile}</div>
            <div>PAN: {newCustomerData.pan}</div>
            <div>Email: {newCustomerData.email}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => onResolve('skip')}
          style={{ justifyContent: 'flex-start' }}
        >
          <XCircle size={18} />
          <div>
            <div style={{ fontWeight: '600' }}>Skip / Cancel</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Discard new entry</div>
          </div>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => onResolve('update')}
          style={{ justifyContent: 'flex-start' }}
        >
          <RefreshCw size={18} />
          <div>
            <div style={{ fontWeight: '600' }}>Update Existing</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Overwrite existing fields</div>
          </div>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => onResolve('separate')}
          style={{ justifyContent: 'flex-start' }}
        >
          <UserPlus size={18} />
          <div>
            <div style={{ fontWeight: '600' }}>Create Separate Record</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Force new customer account</div>
          </div>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={() => onResolve('merge')}
          style={{ justifyContent: 'flex-start' }}
        >
          <GitMerge size={18} />
          <div>
            <div style={{ fontWeight: '600' }}>Merge Profiles</div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>Combine insurance & MF history</div>
          </div>
        </button>
      </div>
    </Modal>
  );
};
