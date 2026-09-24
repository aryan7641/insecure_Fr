import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MOCK_CUSTOMERS } from '../../api/mockData';
import { useToast } from '../../context/ToastContext';

export const PolicyFormModal = ({ isOpen, onClose, customerId, onSaveSuccess }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    customerId: customerId || MOCK_CUSTOMERS[0].id,
    policyNumber: '',
    company: '',
    policyType: 'Health Insurance',
    premium: '',
    frequency: 'Annual',
    startDate: '',
    renewalDate: '',
    sumAssured: '',
    nominee: '',
    status: 'Active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast(`Policy ${formData.policyNumber} created successfully!`, 'success');
    if (onSaveSuccess) onSaveSuccess(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Insurance Policy" maxWidth="640px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Customer *</label>
            <select name="customerId" className="form-select" value={formData.customerId} onChange={handleChange} required>
              {MOCK_CUSTOMERS.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Policy Number *</label>
            <input type="text" name="policyNumber" className="form-input" required value={formData.policyNumber} onChange={handleChange} placeholder="e.g. HDFC-998822" />
          </div>

          <div className="form-group">
            <label className="form-label">Insurance Company *</label>
            <input type="text" name="company" className="form-input" required value={formData.company} onChange={handleChange} placeholder="e.g. HDFC ERGO" />
          </div>

          <div className="form-group">
            <label className="form-label">Policy Type *</label>
            <select name="policyType" className="form-select" value={formData.policyType} onChange={handleChange}>
              <option value="Health Insurance">Health Insurance</option>
              <option value="Term Life Insurance">Term Life Insurance</option>
              <option value="Motor Insurance">Motor Insurance</option>
              <option value="Travel Insurance">Travel Insurance</option>
              <option value="Personal Accident">Personal Accident</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Premium Amount (₹ INR) *</label>
            <input type="number" name="premium" className="form-input" required value={formData.premium} onChange={handleChange} placeholder="e.g. 28000" />
          </div>

          <div className="form-group">
            <label className="form-label">Premium Frequency</label>
            <select name="frequency" className="form-select" value={formData.frequency} onChange={handleChange}>
              <option value="Annual">Annual</option>
              <option value="Semi-Annual">Semi-Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sum Assured / Coverage (₹ INR)</label>
            <input type="number" name="sumAssured" className="form-input" value={formData.sumAssured} onChange={handleChange} placeholder="e.g. 1000000" />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" name="startDate" className="form-input" value={formData.startDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Renewal Date *</label>
            <input type="date" name="renewalDate" className="form-input" required value={formData.renewalDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Nominee</label>
            <input type="text" name="nominee" className="form-input" value={formData.nominee} onChange={handleChange} placeholder="Nominee name" />
          </div>

          <div className="form-group">
            <label className="form-label">Policy Status (Manual Control) *</label>
            <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Renewed">Renewed</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Policy</button>
        </div>
      </form>
    </Modal>
  );
};
