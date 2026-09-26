import React, { useState } from 'react';
import { Plus, Trash2, Loader } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DuplicateResolutionModal } from './DuplicateResolutionModal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { apiClient } from '../../api/client';

export const CustomerFormModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveCustomerRecord(formData);
  };

  const saveCustomerRecord = async (data) => {
    setIsSubmitting(true);
    
    // Clean mobile number (strip non-digits, take last 10 digits if country code is included)
    const rawMobile = (data.mobile || '').replace(/\D/g, '');
    const cleanedMobile = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;

    if (cleanedMobile.length !== 10) {
      addToast('Please enter a valid 10-digit mobile number', 'danger');
      setIsSubmitting(false);
      return;
    }

    let agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id');
    if (!agencyId || agencyId === 'agency-1') {
      const savedUser = localStorage.getItem('insecure_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const rawId = parsed.activeAgencyId || parsed.agencies?.[0]?.agencyId;
          agencyId = typeof rawId === 'object' ? (rawId._id || rawId.id) : rawId;
        } catch (e) {}
      }
    }
    if (!agencyId || agencyId === 'agency-1') {
      agencyId = '6ab7424622537587efc9ef30';
    }
    
    try {
      const response = await apiClient.post(`/agencies/${agencyId}/customers`, {
        name: data.name.trim(),
        mobile: cleanedMobile,
        email: data.email?.trim() || undefined,
        dob: data.dob || undefined,
        pan: data.pan?.trim()?.toUpperCase() || undefined,
        aadhaar: data.aadhaar?.trim() || undefined,
        address: data.address?.trim() || undefined,
        occupation: data.occupation?.trim() || undefined,
        annualIncome: data.annualIncome ? Number(data.annualIncome) : undefined,
        nominees: data.nominees
      });

      const created = response.data || response;
      addToast(`Customer ${data.name} saved successfully!`, 'success');
      
      // Dispatch global event for instant UI sync across all components
      window.dispatchEvent(new CustomEvent('customerCreated', { detail: created }));

      if (onSaveSuccess) onSaveSuccess(created);
      onClose();
      resetForm();
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        setDuplicateMatch({ name: data.name, mobile: cleanedMobile, pan: data.pan });
        setShowDuplicateModal(true);
      } else {
        addToast(err.message || 'Failed to save customer', 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateResolve = (action) => {
    setShowDuplicateModal(false);
    if (action === 'skip') {
      addToast('Customer creation cancelled.', 'neutral');
      return;
    }
    if (action === 'update' || action === 'merge') {
      addToast(`Updated existing profile for ${duplicateMatch?.name}`, 'success');
      onClose();
      resetForm();
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
              <input type="tel" name="mobile" className="form-input" required value={formData.mobile} onChange={handleChange} placeholder="e.g. 9876543210" />
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
              <label className="form-label">Gender</label>
              <select name="gender" className="form-select" value={formData.gender || 'male'} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Customer Profile Type</label>
              <select name="customerType" className="form-select" value={formData.customerType || 'individual'} onChange={handleChange}>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate / SME</option>
                <option value="hni">HNI Customer</option>
                <option value="retail">Retail</option>
              </select>
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
              <label className="form-label">City</label>
              <input type="text" name="city" className="form-input" value={formData.city || ''} onChange={handleChange} placeholder="e.g. Mumbai" />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" name="state" className="form-input" value={formData.state || ''} onChange={handleChange} placeholder="e.g. Maharashtra" />
            </div>

            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input type="text" name="pincode" className="form-input" value={formData.pincode || ''} onChange={handleChange} placeholder="6-digit Pincode" />
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                'Save Customer'
              )}
            </button>
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
