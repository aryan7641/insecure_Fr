import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { apiClient } from '../../api/client';

export const PolicyFormModal = ({ isOpen, onClose, customerId, onSaveSuccess }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();

  const [customerList, setCustomerList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const [formData, setFormData] = useState({
    customerId: customerId || '',
    policyNumber: '',
    insuranceCompany: 'HDFC ERGO General Insurance',
    productName: '',
    policyType: 'health',
    subLob: 'Comprehensive',
    premium: '',
    premiumFrequency: 'yearly',
    startDate: '',
    endDate: '',
    renewalDate: '',
    sumAssured: '',
    nomineeName: '',
    nomineeRelation: 'Spouse',
    status: 'active',
    vehicleRegNo: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleIdv: ''
  });

  useEffect(() => {
    async function loadCustomers() {
      if (!agencyId) return;
      try {
        const res = await apiClient.get(`/agencies/${agencyId}/customers`);
        const items = res?.data?.customers || res?.data?.data || res?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          setCustomerList(items);
          if (!customerId && !formData.customerId) {
            setFormData(prev => ({ ...prev, customerId: items[0]._id || items[0].id }));
          }
        }
      } catch (e) {}
    }
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, agencyId, customerId]);

  useEffect(() => {
    if (customerId) {
      setFormData(prev => ({ ...prev, customerId }));
    }
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      addToast('Please select an active customer profile', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: formData.customerId,
        policyNumber: formData.policyNumber.trim(),
        insuranceCompany: formData.insuranceCompany.trim(),
        productName: formData.productName?.trim() || undefined,
        policyType: formData.policyType,
        lob: formData.policyType.toUpperCase(),
        subLob: formData.subLob?.trim() || undefined,
        premium: Number(formData.premium),
        premiumFrequency: formData.premiumFrequency,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        renewalDate: formData.renewalDate || formData.endDate || undefined,
        sumAssured: formData.sumAssured ? Number(formData.sumAssured) : undefined,
        status: formData.status,
        nominee: formData.nomineeName ? {
          name: formData.nomineeName,
          relation: formData.nomineeRelation,
          share: 100
        } : undefined,
        vehicleDetails: formData.policyType === 'motor' ? {
          registrationNumber: formData.vehicleRegNo.toUpperCase().trim(),
          make: formData.vehicleMake.trim(),
          model: formData.vehicleModel.trim(),
          idv: formData.vehicleIdv ? Number(formData.vehicleIdv) : undefined
        } : undefined
      };

      const res = await apiClient.post(`/agencies/${agencyId}/insurance-policies`, payload);
      const created = res.data || res;

      addToast(`Policy ${formData.policyNumber} created successfully!`, 'success');
      window.dispatchEvent(new CustomEvent('policyCreated', { detail: created }));
      if (onSaveSuccess) onSaveSuccess(created);
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to create policy', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Policy Entry" maxWidth="680px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Associated Customer *</label>
            <select 
              name="customerId" 
              className="form-select" 
              value={formData.customerId} 
              onChange={handleChange} 
              required
            >
              {customerList.length === 0 ? (
                <option value="">No customers found</option>
              ) : (
                customerList.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name} ({c.mobile} | PAN: {c.pan || '—'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Policy Number *</label>
            <input type="text" name="policyNumber" className="form-input" required value={formData.policyNumber} onChange={handleChange} placeholder="e.g. HDFC-998822" />
          </div>

          <div className="form-group">
            <label className="form-label">Insurance Company *</label>
            <input type="text" name="insuranceCompany" className="form-input" required value={formData.insuranceCompany} onChange={handleChange} placeholder="e.g. HDFC ERGO General Insurance" />
          </div>

          <div className="form-group">
            <label className="form-label">Policy Category / LOB *</label>
            <select name="policyType" className="form-select" value={formData.policyType} onChange={handleChange}>
              <option value="health">Health Insurance</option>
              <option value="motor">Motor Insurance</option>
              <option value="term">Term Life Insurance</option>
              <option value="life">Life Insurance</option>
              <option value="travel">Travel Insurance</option>
              <option value="home">Home Insurance</option>
              <option value="commercial">Commercial Insurance</option>
              <option value="group">Group Insurance</option>
              <option value="other">Other Insurance</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Plan / Product Name</label>
            <input type="text" name="productName" className="form-input" value={formData.productName} onChange={handleChange} placeholder="e.g. Optima Secure" />
          </div>

          {formData.policyType === 'motor' && (
            <>
              <div className="form-group">
                <label className="form-label">Vehicle Registration Number *</label>
                <input type="text" name="vehicleRegNo" className="form-input" required style={{ textTransform: 'uppercase' }} value={formData.vehicleRegNo} onChange={handleChange} placeholder="e.g. DL01AB1234" />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Make & Model</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input type="text" name="vehicleMake" className="form-input" value={formData.vehicleMake} onChange={handleChange} placeholder="Make (Hyundai)" />
                  <input type="text" name="vehicleModel" className="form-input" value={formData.vehicleModel} onChange={handleChange} placeholder="Model (Creta)" />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Total Premium Amount (₹ INR) *</label>
            <input type="number" name="premium" className="form-input" required value={formData.premium} onChange={handleChange} placeholder="e.g. 28000" />
          </div>

          <div className="form-group">
            <label className="form-label">Premium Frequency</label>
            <select name="premiumFrequency" className="form-select" value={formData.premiumFrequency} onChange={handleChange}>
              <option value="yearly">Yearly / Annual</option>
              <option value="half_yearly">Half-Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="single">Single</option>
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
            <label className="form-label">Status</label>
            <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              'Save Policy'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
