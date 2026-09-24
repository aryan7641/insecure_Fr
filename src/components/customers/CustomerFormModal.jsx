import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DuplicateResolutionModal } from './DuplicateResolutionModal';
import { MOCK_CUSTOMERS } from '../../api/mockData';
import { useToast } from '../../context/ToastContext';

export const CustomerFormModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    pan: '',
    aadhaar: '',
    address: '',
    occupation: '',
    annualIncome: '',
    nominees: [{ name: '', relation: 'Spouse', share: 100 }],
    familyMembers: []
  });

  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNomineeChange = (idx, field, val) => {
    const updated = [...formData.nominees];
    updated[idx][field] = val;
    setFormData(prev => ({ ...prev, nominees: updated }));
  };

  const addNominee = () => {
    setFormData(prev => ({
      ...prev,
      nominees: [...prev.nominees, { name: '', relation: 'Child', share: 0 }]
    }));
  };

  const removeNominee = (idx) => {
    setFormData(prev => ({
      ...prev,
      nominees: prev.nominees.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for duplicate mobile or PAN in agency
    const existing = MOCK_CUSTOMERS.find(c => 
      c.mobile === formData.mobile.trim() || 
      (formData.pan && c.pan && c.pan.toUpperCase() === formData.pan.trim().toUpperCase())
    );

    if (existing) {
      setDuplicateMatch(existing);
      setShowDuplicateModal(true);
      return;
    }

    saveCustomerRecord(formData);
  };

  const saveCustomerRecord = (data) => {
    addToast(`Customer ${data.name} saved successfully!`, 'success');
    if (onSaveSuccess) onSaveSuccess(data);
    onClose();
    resetForm();
  };

  const handleDuplicateResolve = (action) => {
    setShowDuplicateModal(false);
    if (action === 'skip') {
      addToast('Customer creation cancelled.', 'neutral');
      return;
    }
    if (action === 'update' || action === 'merge') {
      addToast(`Updated existing profile for ${duplicateMatch.name}`, 'success');
      onClose();
      resetForm();
      return;
    }
    if (action === 'separate') {
      saveCustomerRecord({ ...formData, id: `cust-sep-${Date.now()}` });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      dob: '',
      pan: '',
      aadhaar: '',
      address: '',
      occupation: '',
      annualIncome: '',
      nominees: [{ name: '', relation: 'Spouse', share: 100 }],
      familyMembers: []
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Add Unified Customer Profile" maxWidth="750px">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number (Primary ID) *</label>
              <input type="tel" name="mobile" className="form-input" required pattern="[0-9]{10}" maxLength={10} value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="rahul@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dob" className="form-input" value={formData.dob} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">PAN Card Number</label>
              <input type="text" name="pan" className="form-input" value={formData.pan} onChange={handleChange} placeholder="e.g. ABCPS1234F" style={{ textTransform: 'uppercase' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Aadhaar Number</label>
              <input type="text" name="aadhaar" className="form-input" value={formData.aadhaar} onChange={handleChange} placeholder="12-digit Aadhaar" />
            </div>

            <div className="form-group">
              <label className="form-label">Occupation</label>
              <input type="text" name="occupation" className="form-input" value={formData.occupation} onChange={handleChange} placeholder="e.g. Software Architect" />
            </div>

            <div className="form-group">
              <label className="form-label">Annual Income (₹ INR)</label>
              <input type="number" name="annualIncome" className="form-input" value={formData.annualIncome} onChange={handleChange} placeholder="e.g. 2500000" />
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Residential Address</label>
            <textarea name="address" className="form-textarea" rows={2} value={formData.address} onChange={handleChange} placeholder="Full postal address..." />
          </div>

          {/* Nominee Section */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Nominee Information</h4>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addNominee}>
                <Plus size={14} /> Add Nominee
              </button>
            </div>

            {formData.nominees.map((n, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 40px', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input type="text" className="form-input" placeholder="Nominee Name" value={n.name} onChange={(e) => handleNomineeChange(idx, 'name', e.target.value)} />
                <select className="form-select" value={n.relation} onChange={(e) => handleNomineeChange(idx, 'relation', e.target.value)}>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
                <input type="number" className="form-input" placeholder="Share %" value={n.share} onChange={(e) => handleNomineeChange(idx, 'share', e.target.value)} />
                {formData.nominees.length > 1 && (
                  <button type="button" onClick={() => removeNominee(idx)} style={{ color: 'var(--color-danger)', padding: '6px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>

      <DuplicateResolutionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicateCustomer={duplicateMatch}
        newCustomerData={formData}
        onResolve={handleDuplicateResolve}
      />
    </>
  );
};
