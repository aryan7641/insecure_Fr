import React, { useState, useEffect } from 'react';
import { 
  Loader, Shield, User, Car, DollarSign, Users, Sparkles, Building2, Plane, Home,
  Plus, Trash2, Calendar, FileText, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { apiClient } from '../../api/client';
import { INSURANCE_TAXONOMY, getSubtypeConfig } from '../../schemas/insuranceTaxonomy';
import { getSubtypeSchema } from '../../schemas/insuranceSubtypeSchemas';

export const PolicyFormModal = ({ isOpen, onClose, customerId, onSaveSuccess }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();

  const [customerList, setCustomerList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('policy'); // 'policy' | 'premium' | 'subtype_details' | 'members' | 'nominee'

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  // Core Type & Subtype State
  const [selectedType, setSelectedType] = useState('health');
  const [selectedSubtype, setSelectedSubtype] = useState('family_floater');

  // Customer ID
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');

  // Policy Base Info
  const [policyData, setPolicyData] = useState({
    policyNumber: '',
    insuranceCompany: 'HDFC ERGO General Insurance',
    productName: '',
    planName: '',
    businessType: 'new',
    status: 'active',
    startDate: '',
    endDate: '',
    renewalDate: '',
    notes: ''
  });

  // Premium & Financials
  const [premiumData, setPremiumData] = useState({
    sumAssured: '',
    basicPremium: '',
    gst: '',
    finalPremium: '',
    premiumFrequency: 'yearly'
  });

  // Subtype-specific structures
  const [healthDetails, setHealthDetails] = useState({
    roomRentLimit: '',
    icuLimit: '',
    coPayment: '',
    deductible: '',
    aggregateDeductible: '',
    preExistingWaitingPeriod: '',
    cumulativeBonus: '',
    restorationBenefit: ''
  });

  const [motorData, setMotorData] = useState({
    registrationNumber: '',
    vehicleType: 'Private Car',
    make: '',
    model: '',
    variant: '',
    idv: '',
    ncbPercentage: '0',
    fuelType: 'Petrol',
    engineNumber: '',
    chassisNumber: '',
    manufacturingYear: '',
    registrationDate: '',
    previousInsurer: '',
    previousPolicyNumber: '',
    ownDamagePremium: '',
    thirdPartyPremium: '',
    zeroDepreciation: false,
    engineProtection: false,
    roadsideAssistance: false,
    consumables: false
  });

  const [lifeDetails, setLifeDetails] = useState({
    uin: '',
    policyTermYears: '',
    premiumPaymentTermYears: '',
    deathBenefit: '',
    maturityDate: '',
    maturityBenefit: '',
    smokerStatus: 'non_smoker',
    accidentalDeathRider: '',
    criticalIllnessRider: '',
    fundName: '',
    unitsHeld: '',
    nav: '',
    totalFundValue: '',
    annuityAmount: ''
  });

  const [travelDetails, setTravelDetails] = useState({
    passportNumber: '',
    nationality: 'Indian',
    destinationCountry: '',
    tripDurationDays: '',
    medicalExpensesLimit: ''
  });

  const [propertyDetails, setPropertyDetails] = useState({
    propertyAddress: '',
    propertyType: 'flat',
    builtUpAreaSqFt: '',
    buildingSumInsured: '',
    contentsSumInsured: ''
  });

  const [insuredMembers, setInsuredMembers] = useState([]);
  const [nomineeData, setNomineeData] = useState({
    name: '',
    relation: 'Spouse',
    dob: '',
    share: 100
  });

  const [commissionData, setCommissionData] = useState({
    commissionType: 'percentage',
    commissionBasis: 'net_premium',
    commissionPercentage: '',
    commissionAmount: '',
    flatAmount: '',
    commissionStatus: 'pending',
    remarks: ''
  });

  const getCommissionBasisAmount = () => {
    switch (commissionData.commissionBasis) {
      case 'final_premium':
        return Number(premiumData.finalPremium || 0);
      case 'basic_premium':
        return Number(premiumData.basicPremium || (selectedType === 'motor' ? motorData.ownDamagePremium : 0) || 0);
      case 'od_premium':
        return Number(motorData.ownDamagePremium || premiumData.basicPremium || 0);
      case 'other_premium':
        return Number(premiumData.otherPremium || 0);
      case 'net_premium':
      default:
        return Number(premiumData.basicPremium || premiumData.finalPremium || 0);
    }
  };

  const getComputedCommissionAmount = () => {
    if (commissionData.commissionType === 'flat') {
      return Number(commissionData.flatAmount || commissionData.commissionAmount || 0);
    }
    const base = getCommissionBasisAmount();
    const pct = Number(commissionData.commissionPercentage || 0);
    return Math.round(base * (pct / 100) * 100) / 100;
  };

  useEffect(() => {
    async function loadCustomers() {
      if (!agencyId) return;
      try {
        const res = await apiClient.get(`/agencies/${agencyId}/customers`);
        const items = res?.data?.customers || res?.data?.data || res?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          setCustomerList(items);
          if (!customerId && !selectedCustomerId) {
            setSelectedCustomerId(items[0]._id || items[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load customers:', e);
      }
    }
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, agencyId, customerId]);

  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    const found = INSURANCE_TAXONOMY.find(t => t.code === newType);
    if (found && found.subtypes.length > 0) {
      setSelectedSubtype(found.subtypes[0].code);
    }
  };

  const handleSubtypeChange = (newSubtype) => {
    setSelectedSubtype(newSubtype);
  };

  const handlePolicyChange = (e) => {
    const { name, value } = e.target;
    setPolicyData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'startDate' && value && !next.endDate) {
        try {
          const d = new Date(value);
          d.setFullYear(d.getFullYear() + 1);
          d.setDate(d.getDate() - 1);
          const nextEnd = d.toISOString().split('T')[0];
          next.endDate = nextEnd;
          next.renewalDate = nextEnd;
        } catch (err) {}
      }
      return next;
    });
  };

  const handlePremiumChange = (e) => {
    const { name, value } = e.target;
    setPremiumData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'basicPremium' || name === 'gst') {
        const basic = Number(name === 'basicPremium' ? value : prev.basicPremium) || 0;
        const gst = Number(name === 'gst' ? value : prev.gst) || 0;
        if (basic > 0) {
          next.finalPremium = Math.round(basic + gst);
        }
      }
      return next;
    });
  };

  // Dynamic Insured Member handlers
  const handleAddMember = () => {
    setInsuredMembers(prev => [
      ...prev,
      {
        name: '',
        relationship: prev.length === 0 ? 'self' : 'spouse',
        dob: '',
        gender: 'male',
        sumInsured: premiumData.sumAssured || '',
        preExistingDiseases: ''
      }
    ]);
  };

  const handleUpdateMember = (index, field, value) => {
    setInsuredMembers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveMember = (index) => {
    setInsuredMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer profile', 'danger');
      return;
    }
    if (!policyData.policyNumber.trim()) {
      addToast('Please provide a policy number', 'danger');
      return;
    }
    if (!premiumData.finalPremium && !premiumData.basicPremium) {
      addToast('Please provide the premium amount', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        insuranceType: selectedType,
        insuranceSubtype: selectedSubtype,
        policyType: selectedType,
        lob: selectedType.toUpperCase(),
        subLob: getSubtypeConfig(selectedSubtype)?.name || selectedSubtype,
        policyNumber: policyData.policyNumber.trim(),
        insuranceCompany: policyData.insuranceCompany.trim(),
        productName: policyData.productName?.trim() || undefined,
        planName: policyData.planName?.trim() || undefined,
        businessType: policyData.businessType,
        status: policyData.status || 'active',
        startDate: policyData.startDate || undefined,
        endDate: policyData.endDate || undefined,
        renewalDate: policyData.renewalDate || policyData.endDate || undefined,
        sumAssured: premiumData.sumAssured ? Number(premiumData.sumAssured) : undefined,
        basicPremium: premiumData.basicPremium ? Number(premiumData.basicPremium) : undefined,
        gst: premiumData.gst ? Number(premiumData.gst) : undefined,
        premium: Number(premiumData.finalPremium || premiumData.basicPremium || 0),
        finalPremium: Number(premiumData.finalPremium || premiumData.basicPremium || 0),
        premiumFrequency: premiumData.premiumFrequency,
        notes: policyData.notes || undefined,
        nominee: nomineeData.name ? {
          name: nomineeData.name,
          relation: nomineeData.relation,
          dob: nomineeData.dob || undefined,
          share: Number(nomineeData.share) || 100
        } : undefined,
        healthDetails: selectedType === 'health' ? healthDetails : undefined,
        vehicleDetails: selectedType === 'motor' ? {
          ...motorData,
          registrationNumber: motorData.registrationNumber.toUpperCase().trim(),
          idv: motorData.idv ? Number(motorData.idv) : undefined,
          ncbPercentage: motorData.ncbPercentage ? Number(motorData.ncbPercentage) : undefined,
          ownDamagePremium: motorData.ownDamagePremium ? Number(motorData.ownDamagePremium) : undefined,
          thirdPartyPremium: motorData.thirdPartyPremium ? Number(motorData.thirdPartyPremium) : undefined
        } : undefined,
        lifeDetails: selectedType === 'life' ? {
          ...lifeDetails,
          deathBenefit: lifeDetails.deathBenefit ? Number(lifeDetails.deathBenefit) : undefined,
          maturityBenefit: lifeDetails.maturityBenefit ? Number(lifeDetails.maturityBenefit) : undefined,
          policyTermYears: lifeDetails.policyTermYears ? Number(lifeDetails.policyTermYears) : undefined,
          premiumPaymentTermYears: lifeDetails.premiumPaymentTermYears ? Number(lifeDetails.premiumPaymentTermYears) : undefined
        } : undefined,
        travelDetails: selectedSubtype === 'travel' ? travelDetails : undefined,
        propertyDetails: selectedSubtype === 'home_property' ? propertyDetails : undefined,
        insuredMembers: insuredMembers.filter(m => m.name.trim() !== '')
      };

      const res = await apiClient.post(`/agencies/${agencyId}/insurance-policies`, payload);
      const created = res.data || res;
      const createdPolicyId = created.id || created._id;

      if (createdPolicyId && (Number(commissionData.commissionPercentage) > 0 || Number(commissionData.commissionAmount) > 0 || Number(commissionData.flatAmount) > 0)) {
        try {
          await apiClient.post(`/agencies/${agencyId}/insurance-policies/${createdPolicyId}/commission`, {
            commissionType: commissionData.commissionType,
            commissionBasis: commissionData.commissionBasis,
            commissionPercentage: Number(commissionData.commissionPercentage) || 0,
            commissionAmount: getComputedCommissionAmount(),
            flatAmount: Number(commissionData.flatAmount) || 0,
            commissionStatus: commissionData.commissionStatus,
            remarks: commissionData.remarks
          });
        } catch (commErr) {
          console.warn('Initial commission save failed:', commErr);
        }
      }

      addToast(`Policy #${policyData.policyNumber} created successfully!`, 'success');
      window.dispatchEvent(new CustomEvent('policyCreated', { detail: created }));
      if (onSaveSuccess) onSaveSuccess(created);
      onClose();
    } catch (err) {
      console.error('Save policy error:', err);
      addToast(err.message || 'Failed to create policy', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtypeConfig = getSubtypeConfig(selectedSubtype);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Policy Creation (Schema-Driven)" maxWidth="920px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Type & Subtype Header Banner */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary, #4f46e5)', display: 'block', marginBottom: '6px' }}>
              Customer Profile *
            </label>
            <select
              className="select"
              style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              {customerList.length === 0 ? (
                <option value="">No customer found</option>
              ) : (
                customerList.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name} ({c.mobile || c.phone || 'No Mobile'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
              Line of Business (Type)
            </label>
            <select
              className="select"
              style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {INSURANCE_TAXONOMY.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
              Product Subtype (22 Schemas)
            </label>
            <select
              className="select"
              style={{ width: '100%', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary, #4f46e5)' }}
              value={selectedSubtype}
              onChange={(e) => handleSubtypeChange(e.target.value)}
            >
              {INSURANCE_TAXONOMY.find(t => t.code === selectedType)?.subtypes.map(st => (
                <option key={st.code} value={st.code}>{st.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', overflowX: 'auto' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'policy' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('policy')}
          >
            <Shield size={14} style={{ marginRight: '6px' }} /> 1. Policy Info
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'premium' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('premium')}
          >
            <DollarSign size={14} style={{ marginRight: '6px' }} /> 2. Premium & Sum Assured
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'subtype_details' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('subtype_details')}
          >
            {selectedType === 'motor' ? <Car size={14} style={{ marginRight: '6px' }} /> :
             selectedType === 'health' ? <Shield size={14} style={{ marginRight: '6px' }} /> :
             selectedSubtype === 'travel' ? <Plane size={14} style={{ marginRight: '6px' }} /> :
             selectedSubtype === 'home_property' ? <Home size={14} style={{ marginRight: '6px' }} /> :
             <Sparkles size={14} style={{ marginRight: '6px' }} />}
            3. {subtypeConfig?.name || 'Subtype Specifics'}
          </button>

          {(selectedType === 'health' || selectedSubtype === 'group_health' || selectedSubtype === 'critical_illness') && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={14} style={{ marginRight: '6px' }} /> 4. Insured Members ({insuredMembers.length})
            </button>
          )}

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'nominee' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('nominee')}
          >
            <User size={14} style={{ marginRight: '6px' }} /> {selectedType === 'health' || selectedSubtype === 'group_health' ? '5. Nominee' : '4. Nominee'}
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'commission' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('commission')}
          >
            <DollarSign size={14} style={{ marginRight: '6px' }} /> {selectedType === 'health' || selectedSubtype === 'group_health' ? '6. Commission' : '5. Commission'}
          </button>
        </div>

        {/* TAB 1: Policy Info */}
        {activeTab === 'policy' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Insurance Company / Insurer *</label>
              <input
                type="text"
                name="insuranceCompany"
                className="form-input"
                required
                value={policyData.insuranceCompany}
                onChange={handlePolicyChange}
                placeholder="e.g. HDFC ERGO General Insurance"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Policy Number *</label>
              <input
                type="text"
                name="policyNumber"
                className="form-input"
                required
                value={policyData.policyNumber}
                onChange={handlePolicyChange}
                placeholder="e.g. 2805201889201"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product / Plan Name</label>
              <input
                type="text"
                name="productName"
                className="form-input"
                value={policyData.productName}
                onChange={handlePolicyChange}
                placeholder="e.g. Optima Restore / My:Health Medisure"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select name="businessType" className="form-select" value={policyData.businessType} onChange={handlePolicyChange}>
                <option value="new">New Business</option>
                <option value="renewal">Renewal</option>
                <option value="portability">Portability (Rollover)</option>
                <option value="endorsement">Endorsement</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start / Effective Date *</label>
              <input
                type="date"
                name="startDate"
                className="form-input"
                required
                value={policyData.startDate}
                onChange={handlePolicyChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End / Expiry Date *</label>
              <input
                type="date"
                name="endDate"
                className="form-input"
                required
                value={policyData.endDate}
                onChange={handlePolicyChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Renewal Due Date *</label>
              <input
                type="date"
                name="renewalDate"
                className="form-input"
                required
                value={policyData.renewalDate || policyData.endDate}
                onChange={handlePolicyChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Policy Status</label>
              <select name="status" className="form-select" value={policyData.status} onChange={handlePolicyChange}>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="grace_period">Grace Period</option>
                <option value="renewed">Renewed</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Notes & Remarks</label>
              <textarea
                name="notes"
                className="form-input"
                rows={2}
                value={policyData.notes}
                onChange={handlePolicyChange}
                placeholder="Any specific endorsements or underwriting notes..."
              />
            </div>
          </div>
        )}

        {/* TAB 2: Premium & Sum Assured */}
        {activeTab === 'premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Sum Assured / Coverage Amount (₹ INR) *</label>
              <input
                type="number"
                name="sumAssured"
                className="form-input"
                value={premiumData.sumAssured}
                onChange={handlePremiumChange}
                placeholder="e.g. 1000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Premium Payment Frequency</label>
              <select
                name="premiumFrequency"
                className="form-select"
                value={premiumData.premiumFrequency}
                onChange={handlePremiumChange}
              >
                <option value="yearly">Yearly / Annual</option>
                <option value="half_yearly">Half-Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="single">Single Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Net / Basic Premium (₹)</label>
              <input
                type="number"
                name="basicPremium"
                className="form-input"
                value={premiumData.basicPremium}
                onChange={handlePremiumChange}
                placeholder="e.g. 25000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">GST / Tax Amount (18% ₹)</label>
              <input
                type="number"
                name="gst"
                className="form-input"
                value={premiumData.gst}
                onChange={handlePremiumChange}
                placeholder="e.g. 4500"
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: '700', color: 'var(--color-primary, #4f46e5)' }}>
                Total Gross Premium Payable (₹ INR) *
              </label>
              <input
                type="number"
                name="finalPremium"
                className="form-input"
                required
                style={{ fontSize: '16px', fontWeight: '700' }}
                value={premiumData.finalPremium}
                onChange={handlePremiumChange}
                placeholder="e.g. 29500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Subtype-Specific Details */}
        {activeTab === 'subtype_details' && (
          <div>
            {/* Health Specifics */}
            {selectedType === 'health' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Room Rent Limit / Eligibility</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.roomRentLimit}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, roomRentLimit: e.target.value }))}
                    placeholder="e.g. Single Private Room / No Capping"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ICU Room Limit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.icuLimit}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, icuLimit: e.target.value }))}
                    placeholder="e.g. No Capping / Actuals"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Co-Payment (%)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.coPayment}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, coPayment: e.target.value }))}
                    placeholder="e.g. 0% or 10% on Senior Citizens"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deductible / Top-up Threshold (₹)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.deductible}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, deductible: e.target.value }))}
                    placeholder="e.g. 500000 (for Super Topup)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pre-Existing Diseases Waiting Period</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.preExistingWaitingPeriod}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, preExistingWaitingPeriod: e.target.value }))}
                    placeholder="e.g. 36 Months / 2 Years"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cumulative Bonus / NCB (₹ or %)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.cumulativeBonus}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, cumulativeBonus: e.target.value }))}
                    placeholder="e.g. 50% / ₹2,50,000"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Restoration / Refill Benefit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={healthDetails.restorationBenefit}
                    onChange={(e) => setHealthDetails(prev => ({ ...prev, restorationBenefit: e.target.value }))}
                    placeholder="e.g. 100% Unlimited restoration on exhaustion"
                  />
                </div>
              </div>
            )}

            {/* Motor Specifics */}
            {selectedType === 'motor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    style={{ textTransform: 'uppercase', fontWeight: '600' }}
                    value={motorData.registrationNumber}
                    onChange={(e) => setMotorData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="e.g. DL01AB1234"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Category</label>
                  <select
                    className="form-select"
                    value={motorData.vehicleType}
                    onChange={(e) => setMotorData(prev => ({ ...prev, vehicleType: e.target.value }))}
                  >
                    <option value="Private Car">Private Car (4 Wheeler)</option>
                    <option value="Two Wheeler">Two Wheeler (Motorcycle / Scooter)</option>
                    <option value="Commercial Vehicle">Commercial Vehicle (GCV / PCV)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Make & Model</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={motorData.make}
                      onChange={(e) => setMotorData(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="Make (e.g. Hyundai)"
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={motorData.model}
                      onChange={(e) => setMotorData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model (e.g. Creta SX)"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Insured Declared Value (IDV ₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={motorData.idv}
                    onChange={(e) => setMotorData(prev => ({ ...prev, idv: e.target.value }))}
                    placeholder="e.g. 1250000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">No Claim Bonus (NCB %)</label>
                  <select
                    className="form-select"
                    value={motorData.ncbPercentage}
                    onChange={(e) => setMotorData(prev => ({ ...prev, ncbPercentage: e.target.value }))}
                  >
                    <option value="0">0%</option>
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="35">35%</option>
                    <option value="45">45%</option>
                    <option value="50">50%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select
                    className="form-select"
                    value={motorData.fuelType}
                    onChange={(e) => setMotorData(prev => ({ ...prev, fuelType: e.target.value }))}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG / Petrol</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Engine Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={motorData.engineNumber}
                    onChange={(e) => setMotorData(prev => ({ ...prev, engineNumber: e.target.value }))}
                    placeholder="e.g. G4LA123456"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chassis Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={motorData.chassisNumber}
                    onChange={(e) => setMotorData(prev => ({ ...prev, chassisNumber: e.target.value }))}
                    placeholder="e.g. MALC1234567890"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Add-on Covers & Riders</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={motorData.zeroDepreciation}
                        onChange={(e) => setMotorData(prev => ({ ...prev, zeroDepreciation: e.target.checked }))}
                      />
                      Zero Depreciation (Bumper to Bumper)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={motorData.engineProtection}
                        onChange={(e) => setMotorData(prev => ({ ...prev, engineProtection: e.target.checked }))}
                      />
                      Engine & Gearbox Protection
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={motorData.roadsideAssistance}
                        onChange={(e) => setMotorData(prev => ({ ...prev, roadsideAssistance: e.target.checked }))}
                      />
                      24x7 Roadside Assistance
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={motorData.consumables}
                        onChange={(e) => setMotorData(prev => ({ ...prev, consumables: e.target.checked }))}
                      />
                      Consumables Cover
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Life Specifics */}
            {selectedType === 'life' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">IRDAI UIN Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lifeDetails.uin}
                    onChange={(e) => setLifeDetails(prev => ({ ...prev, uin: e.target.value }))}
                    placeholder="e.g. 101N100V03"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Smoker Category</label>
                  <select
                    className="form-select"
                    value={lifeDetails.smokerStatus}
                    onChange={(e) => setLifeDetails(prev => ({ ...prev, smokerStatus: e.target.value }))}
                  >
                    <option value="non_smoker">Non-Smoker</option>
                    <option value="smoker">Smoker / Tobacco User</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Term (Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={lifeDetails.policyTermYears}
                    onChange={(e) => setLifeDetails(prev => ({ ...prev, policyTermYears: e.target.value }))}
                    placeholder="e.g. 35"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Premium Payment Term - PPT (Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={lifeDetails.premiumPaymentTermYears}
                    onChange={(e) => setLifeDetails(prev => ({ ...prev, premiumPaymentTermYears: e.target.value }))}
                    placeholder="e.g. 10 (Pay till 60 / Regular)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Death Benefit / Life Cover (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={lifeDetails.deathBenefit}
                    onChange={(e) => setLifeDetails(prev => ({ ...prev, deathBenefit: e.target.value }))}
                    placeholder="e.g. 10000000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Date / Benefit (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={lifeDetails.maturityDate}
                      onChange={(e) => setLifeDetails(prev => ({ ...prev, maturityDate: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={lifeDetails.maturityBenefit}
                      onChange={(e) => setLifeDetails(prev => ({ ...prev, maturityBenefit: e.target.value }))}
                      placeholder="Benefit (₹)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Travel Specifics */}
            {selectedSubtype === 'travel' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Passport Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={travelDetails.passportNumber}
                    onChange={(e) => setTravelDetails(prev => ({ ...prev, passportNumber: e.target.value }))}
                    placeholder="e.g. Z1234567"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Country / Region</label>
                  <input
                    type="text"
                    className="form-input"
                    value={travelDetails.destinationCountry}
                    onChange={(e) => setTravelDetails(prev => ({ ...prev, destinationCountry: e.target.value }))}
                    placeholder="e.g. Schengen Area / USA & Canada"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trip Duration (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={travelDetails.tripDurationDays}
                    onChange={(e) => setTravelDetails(prev => ({ ...prev, tripDurationDays: e.target.value }))}
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medical Expenses Limit (USD / EUR / ₹)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={travelDetails.medicalExpensesLimit}
                    onChange={(e) => setTravelDetails(prev => ({ ...prev, medicalExpensesLimit: e.target.value }))}
                    placeholder="e.g. $50,000 USD"
                  />
                </div>
              </div>
            )}

            {/* Property / Home Specifics */}
            {selectedSubtype === 'home_property' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Property Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={propertyDetails.propertyAddress}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    placeholder="e.g. Flat 402, Greenfield Residency, Sector 62, Noida"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Building Sum Insured (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={propertyDetails.buildingSumInsured}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, buildingSumInsured: e.target.value }))}
                    placeholder="e.g. 5000000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contents / Belongings Sum Insured (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={propertyDetails.contentsSumInsured}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, contentsSumInsured: e.target.value }))}
                    placeholder="e.g. 1500000"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Insured Members (For Health / Group / Family) */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Insured Lives / Beneficiaries</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Add family members covered under this floater/individual health contract.
                </p>
              </div>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddMember}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Member
              </button>
            </div>

            {insuredMembers.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'var(--color-bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                <Users size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  No members added yet. Click below to add the primary insured and dependents.
                </p>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleAddMember}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Add Primary Member
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {insuredMembers.map((member, idx) => (
                  <div key={idx} style={{ padding: '14px', background: 'var(--color-bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.5fr auto', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Member Name</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: '34px', fontSize: '13px' }}
                        value={member.name}
                        onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Relationship</label>
                      <select
                        className="form-select"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={member.relationship}
                        onChange={(e) => handleUpdateMember(idx, 'relationship', e.target.value)}
                      >
                        <option value="self">Self (Primary)</option>
                        <option value="spouse">Spouse</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>DOB</label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={member.dob}
                        onChange={(e) => handleUpdateMember(idx, 'dob', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Gender</label>
                      <select
                        className="form-select"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={member.gender}
                        onChange={(e) => handleUpdateMember(idx, 'gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Sum Insured (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={member.sumInsured}
                        onChange={(e) => handleUpdateMember(idx, 'sumInsured', e.target.value)}
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <div style={{ paddingTop: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ padding: '6px 8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={() => handleRemoveMember(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Nominee Details */}
        {activeTab === 'nominee' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nominee Name</label>
              <input
                type="text"
                className="form-input"
                value={nomineeData.name}
                onChange={(e) => setNomineeData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sunita Sharma"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship to Policyholder</label>
              <select
                className="form-select"
                value={nomineeData.relation}
                onChange={(e) => setNomineeData(prev => ({ ...prev, relation: e.target.value }))}
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nominee Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={nomineeData.dob}
                onChange={(e) => setNomineeData(prev => ({ ...prev, dob: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nominee Share (%)</label>
              <input
                type="number"
                className="form-input"
                value={nomineeData.share}
                onChange={(e) => setNomineeData(prev => ({ ...prev, share: e.target.value }))}
                placeholder="100"
              />
            </div>
          </div>
        )}

        {/* TAB: Commission Management */}
        {activeTab === 'commission' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                <DollarSign size={16} /> Policy Commission Management (Internal CRM)
              </div>
              <p style={{ fontSize: '11.5px', color: '#15803d', margin: 0, lineHeight: 1.4 }}>
                Record manual agent earnings and brokerage commission for this policy.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Commission Type *</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: commissionData.commissionType === 'percentage' ? '600' : '400' }}>
                    <input
                      type="radio"
                      name="commissionTypeForm"
                      value="percentage"
                      checked={commissionData.commissionType === 'percentage'}
                      onChange={() => setCommissionData(prev => ({ ...prev, commissionType: 'percentage' }))}
                    />
                    Percentage (%)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: commissionData.commissionType === 'flat' ? '600' : '400' }}>
                    <input
                      type="radio"
                      name="commissionTypeForm"
                      value="flat"
                      checked={commissionData.commissionType === 'flat'}
                      onChange={() => setCommissionData(prev => ({ ...prev, commissionType: 'flat' }))}
                    />
                    Flat Amount (₹)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Commission Status</label>
                <select
                  className="form-select"
                  value={commissionData.commissionStatus}
                  onChange={(e) => setCommissionData(prev => ({ ...prev, commissionStatus: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {commissionData.commissionType === 'percentage' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Calculation Basis Premium</label>
                    <select
                      className="form-select"
                      value={commissionData.commissionBasis}
                      onChange={(e) => setCommissionData(prev => ({ ...prev, commissionBasis: e.target.value }))}
                    >
                      <option value="net_premium">Net Premium</option>
                      <option value="final_premium">Final / Gross Premium</option>
                      <option value="basic_premium">Basic Premium</option>
                      {selectedType === 'motor' && <option value="od_premium">OD Premium (Own Damage)</option>}
                      <option value="other_premium">Other Premium</option>
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Base Amount: <strong>₹{getCommissionBasisAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Commission Rate (%) *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-input"
                        value={commissionData.commissionPercentage}
                        onChange={(e) => setCommissionData(prev => ({ ...prev, commissionPercentage: e.target.value }))}
                        placeholder="e.g. 15"
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                      Live Commission: ₹{getComputedCommissionAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </>
              )}

              {commissionData.commissionType === 'flat' && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Flat Commission Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={commissionData.flatAmount}
                    onChange={(e) => setCommissionData(prev => ({ ...prev, flatAmount: e.target.value }))}
                    placeholder="e.g. 2500"
                  />
                </div>
              )}

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Commission Notes / Remarks</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={commissionData.remarks}
                  onChange={(e) => setCommissionData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional internal notes on commission payout or agreement..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" style={{ marginRight: '6px' }} /> Saving Policy...
              </>
            ) : (
              'Save & Create Policy'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
