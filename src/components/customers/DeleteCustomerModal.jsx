import React, { useState } from 'react';
import { Trash2, AlertTriangle, UserX, Loader } from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiClient } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const DeleteCustomerModal = ({ isOpen, onClose, customer, agencyId, onDeleteSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasDependencies, setHasDependencies] = useState(
    Boolean(customer?.insuranceSummary?.totalPolicies > 0 || customer?.activePoliciesCount > 0)
  );

  // Sync state when customer changes
  React.useEffect(() => {
    if (customer) {
      setHasDependencies(Boolean(customer?.insuranceSummary?.totalPolicies > 0 || customer?.activePoliciesCount > 0));
    }
  }, [customer]);

  if (!customer) return null;

  const customerId = customer.id || customer._id;

  const handleDelete = async (mode) => {
    setLoading(true);
    try {
      const url = mode === 'deactivate'
        ? `/agencies/${agencyId}/customers/${customerId}?mode=deactivate`
        : `/agencies/${agencyId}/customers/${customerId}`;
      
      const res = await apiClient.delete(url);
      const isDeactivated = mode === 'deactivate' || res?.data?.data?.deactivated;
      
      addToast(
        isDeactivated ? `Customer ${customer.name} deactivated successfully` : `Customer ${customer.name} deleted successfully`,
        'success'
      );
      
      if (onDeleteSuccess) {
        onDeleteSuccess(customerId);
      }
      onClose();
    } catch (err) {
      const respData = err.response?.data;
      if (err.response?.status === 409 || respData?.code === 'CUSTOMER_HAS_DEPENDENCIES') {
        setHasDependencies(true);
        addToast(respData?.message || 'Customer has active policies and cannot be permanently deleted.', 'warning');
      } else {
        const msg = respData?.message || err.message || 'Failed to delete customer';
        addToast(msg, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={hasDependencies ? 'Deactivate Customer Profile' : 'Delete Customer Profile'}
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: hasDependencies ? '#fffbeb' : '#fef2f2',
            color: hasDependencies ? '#d97706' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {hasDependencies ? <AlertTriangle size={22} /> : <Trash2 size={22} />}
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-main)' }}>
              {customer.name}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {customer.mobile ? `Mobile: ${customer.mobile}` : ''} {customer.pan ? `• PAN: ${customer.pan}` : ''}
            </div>
          </div>
        </div>

        {hasDependencies ? (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#92400e',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              This customer has existing policies or related records and cannot be permanently deleted without removing associated data.
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#b45309' }}>
              Safe deactivation will remove the customer from the directory while keeping all insurance policies, historical premium data, and audit records completely intact.
            </p>
          </div>
        ) : (
          <div style={{ fontSize: '13.5px', color: 'var(--color-text-body)', lineHeight: '1.5' }}>
            Are you sure you want to delete this customer?
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          {hasDependencies ? (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => handleDelete('deactivate')}
              disabled={loading}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <UserX size={14} />}
              Deactivate Customer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleDelete('delete')}
              disabled={loading}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Customer
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
