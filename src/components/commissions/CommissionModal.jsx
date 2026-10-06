import React, { useState, useEffect } from 'react';
import { Percent, Shield, DollarSign, Trash2, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/formatters';

const BASIS_OPTIONS = [
  { id: 'net_premium', label: 'Net Premium' },
  { id: 'final_premium', label: 'Final / Gross Premium' },
  { id: 'basic_premium', label: 'Basic Premium' },
  { id: 'od_premium', label: 'Own Damage (OD) Premium' },
  { id: 'other_premium', label: 'Other Premium' },
];

export const CommissionModal = ({
  isOpen,
  onClose,
  policy,
  commission,
  agencyId,
  onSaveSuccess,
  onDeleteSuccess
}) => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [commissionType, setCommissionType] = useState('percentage');
  const [commissionBasis, setCommissionBasis] = useState('net_premium');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [flatAmount, setFlatAmount] = useState('');
  const [commissionStatus, setCommissionStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');

  // Extract premium basis values from policy
  const getBasisValue = (basisKey) => {
    if (!policy) return 0;
    const pb = policy.premiumBreakdown || {};
    const vd = policy.vehicleDetails || {};

    switch (basisKey) {
      case 'final_premium':
        return Number(pb.finalPremium ?? policy.finalPremium ?? policy.premium ?? 0);
      case 'basic_premium':
        return Number(pb.basicPremium ?? policy.basicPremium ?? 0);
      case 'od_premium':
        return Number(vd.ownDamagePremium ?? pb.ownDamagePremium ?? policy.odPremium ?? 0);
      case 'other_premium':
        return Number(pb.otherPremium ?? policy.otherPremium ?? 0);
      case 'net_premium':
      default:
        return Number(pb.netPremium ?? policy.netPremium ?? 0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const comm = commission || policy?.commission;
      if (comm) {
        setCommissionType(comm.commissionType || comm.type || 'percentage');
        setCommissionBasis(comm.commissionBasis || comm.basis || 'net_premium');
        setCommissionPercentage(
          comm.commissionPercentage !== undefined && comm.commissionPercentage !== null
            ? String(comm.commissionPercentage)
            : comm.percentage !== undefined && comm.percentage !== null
            ? String(comm.percentage)
            : ''
        );
        setFlatAmount(
          comm.commissionAmount !== undefined && comm.commissionAmount !== null
            ? String(comm.commissionAmount)
            : comm.amount !== undefined && comm.amount !== null
            ? String(comm.amount)
            : ''
        );
        setCommissionStatus(
          comm.commissionStatus === 'paid' || comm.status === 'received' || comm.status === 'paid'
            ? 'paid'
            : 'pending'
        );
        setRemarks(comm.remarks || '');
      } else {
        // Defaults for new commission
        setCommissionType('percentage');
        setCommissionBasis('net_premium');
        setCommissionPercentage('');
        setFlatAmount('');
        setCommissionStatus('pending');
        setRemarks('');
      }
    }
  }, [isOpen, policy, commission]);

  if (!isOpen || !policy) return null;

  const policyId = policy._id || policy.id;
  const currentBasisAmount = getBasisValue(commissionBasis);
  const isBasisAvailable = currentBasisAmount > 0;

  // Live calculation of commission amount
  let calculatedAmount = 0;
  if (commissionType === 'flat') {
    calculatedAmount = Number(flatAmount) || 0;
  } else {
    const pct = Number(commissionPercentage) || 0;
    calculatedAmount = isBasisAvailable ? Math.round(currentBasisAmount * (pct / 100) * 100) / 100 : 0;
  }

  const handleSave = async (e) => {
    e.preventDefault();

    if (commissionType === 'percentage') {
      if (!isBasisAvailable) {
        addToast('Selected premium basis is not available for this policy.', 'danger');
        return;
      }
      const pct = Number(commissionPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        addToast('Commission percentage must be between 0 and 100.', 'warning');
        return;
      }
    } else {
      const flat = Number(flatAmount);
      if (isNaN(flat) || flat < 0) {
        addToast('Flat commission amount cannot be negative.', 'warning');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        commissionType,
        commissionBasis,
        commissionPercentage: commissionType === 'percentage' ? Number(commissionPercentage) : 0,
        commissionAmount: commissionType === 'flat' ? Number(flatAmount) : calculatedAmount,
        commissionStatus,
        remarks
      };

      const res = await apiClient.post(`/agencies/${agencyId}/commissions/${policyId}`, payload);
      const savedComm = res?.data?.data || res?.data;

      addToast(`Commission saved successfully (₹${calculatedAmount.toLocaleString('en-IN')})`, 'success');
      if (onSaveSuccess) onSaveSuccess(savedComm);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save commission';
      addToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the commission record for this policy?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await apiClient.delete(`/agencies/${agencyId}/commissions/${policyId}`);
      addToast('Commission record deleted successfully', 'success');
      if (onDeleteSuccess) onDeleteSuccess(policyId);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete commission';
      addToast(msg, 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasExistingCommission = Boolean(commission || policy?.commission?.amount || policy?.commission?.percentage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && !deleteLoading && onClose()}
      title={hasExistingCommission ? 'Edit Policy Commission' : 'Set Policy Commission'}
      maxWidth="540px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Policy Summary Card */}
        <div style={{
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}>
              #{policy.policyNumber}
            </span>
            <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
              {policy.insuranceType || policy.lob || 'Insurance'}
            </span>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--color-text-main)', fontWeight: '500' }}>
            {policy.insuranceCompany || policy.insurerName || 'Insurer'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>Client: <strong style={{ color: 'var(--color-text-body)' }}>{policy.customerId?.name || 'Customer'}</strong></span>
            <span>Final Prem: <strong style={{ color: 'var(--color-text-body)' }}>{formatINR(policy.finalPremium || policy.premium || 0)}</strong></span>
          </div>
        </div>

        {/* Commission Type Selector */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
            Commission Calculation Method
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: `1.5px solid ${commissionType === 'percentage' ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: commissionType === 'percentage' ? 'rgba(37, 99, 235, 0.04)' : 'transparent'
            }}>
              <input
                type="radio"
                name="commissionType"
                value="percentage"
                checked={commissionType === 'percentage'}
                onChange={() => setCommissionType('percentage')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)' }}>Percentage (%)</span>
            </label>

            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              border: `1.5px solid ${commissionType === 'flat' ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: commissionType === 'flat' ? 'rgba(37, 99, 235, 0.04)' : 'transparent'
            }}>
              <input
                type="radio"
                name="commissionType"
                value="flat"
                checked={commissionType === 'flat'}
                onChange={() => setCommissionType('flat')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)' }}>Flat Amount (₹)</span>
            </label>
          </div>
        </div>

        {/* Commission Basis Selector (if percentage) */}
        {commissionType === 'percentage' && (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
              Premium Basis *
            </label>
            <select
              className="form-select"
              value={commissionBasis}
              onChange={(e) => setCommissionBasis(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              {BASIS_OPTIONS.map((opt) => {
                const val = getBasisValue(opt.id);
                return (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — {val > 0 ? `₹${val.toLocaleString('en-IN')}` : 'Unavailable (₹0)'}
                  </option>
                );
              })}
            </select>

            {!isBasisAvailable && (
              <div style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#dc2626'
              }}>
                <AlertCircle size={14} />
                <span>Selected premium basis is not available for this policy.</span>
              </div>
            )}
          </div>
        )}

        {/* Percentage Input or Flat Amount Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {commissionType === 'percentage' ? (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
                Commission Rate (%) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  placeholder="e.g. 10.0"
                  className="form-input"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                  style={{ paddingRight: '32px' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  %
                </span>
              </div>
            </div>
          ) : (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
                Flat Amount (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="e.g. 1500"
                  className="form-input"
                  value={flatAmount}
                  onChange={(e) => setFlatAmount(e.target.value)}
                  style={{ paddingRight: '32px' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  ₹
                </span>
              </div>
            </div>
          )}

          {/* Status Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
              Payout Status
            </label>
            <select
              className="form-select"
              value={commissionStatus}
              onChange={(e) => setCommissionStatus(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              <option value="pending">Pending</option>
              <option value="paid">Received / Paid</option>
            </select>
          </div>
        </div>

        {/* Calculated Commission Preview Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1.5px dashed #cbd5e1',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Calculated Commission
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-light)', marginTop: '2px' }}>
              {commissionType === 'percentage'
                ? `${commissionPercentage || 0}% of ${formatINR(currentBasisAmount)}`
                : 'Fixed flat broker fee'}
            </div>
          </div>

          <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d' }}>
            {formatINR(calculatedAmount)}
          </div>
        </div>

        {/* Remarks Input */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '12.5px', fontWeight: '600' }}>
            Remarks / Payout Notes (Optional)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Q3 Insurer Remittance"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div>
            {hasExistingCommission && isAdmin && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDelete}
                disabled={loading || deleteLoading}
                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {deleteLoading ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete Commission
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading || deleteLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || deleteLoading || (commissionType === 'percentage' && !isBasisAvailable)}
              style={{ backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <Loader size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Save Commission
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
};
