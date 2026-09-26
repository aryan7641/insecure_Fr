import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Shield, User, Car, DollarSign, Users, Loader, RefreshCw, XCircle, ArrowRight
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { apiClient } from '../../api/client';

export const PolicyPdfUploadModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();
  const fileInputRef = useRef(null);

  // Workflow steps: 'upload' -> 'extracting' -> 'review'
  const [step, setStep] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'policy' | 'premium' | 'motor' | 'nominee'

  // Extraction Payload from Backend
  const [extractedResult, setExtractedResult] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState({ customers: [], policies: [] });
  const [selectedCustomerAction, setSelectedCustomerAction] = useState('create_new'); // 'create_new' | 'attach_existing' | 'update_existing'
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState('');

  // Editable Form Data Draft
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    gender: 'male',
    pan: '',
    aadhaar: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerType: 'individual'
  });

  const [policyData, setPolicyData] = useState({
    insurer: 'HDFC ERGO General Insurance',
    productName: '',
    planName: '',
    policyNumber: '',
    policyType: 'health',
    lob: 'HEALTH',
    subLob: 'Comprehensive',
    businessType: 'new',
    startDate: '',
    endDate: '',
    renewalDate: '',
    sumAssured: '',
    basicPremium: '',
    gst: '',
    finalPremium: '',
    installmentAmount: '',
    premiumFrequency: 'yearly',
    notes: ''
  });

  const [motorData, setMotorData] = useState({
    registrationNumber: '',
    vehicleType: 'Private Car',
    make: '',
    model: '',
    variant: '',
    idv: '',
    ncb: '0',
    fuelType: 'Petrol',
    engineNumber: '',
    chassisNumber: '',
    previousInsurer: ''
  });

  const [nomineeData, setNomineeData] = useState({
    name: '',
    relation: 'Spouse',
    dob: '',
    share: 100
  });

  const [insuredMembers, setInsuredMembers] = useState([]);

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        addToast('File size exceeds 10MB limit', 'danger');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      addToast('Please select a Policy PDF to upload', 'warning');
      return;
    }

    setIsProcessing(true);
    setStep('extracting');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiClient.post(`/agencies/${agencyId}/ocr/extract-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data || res;
      setExtractedResult(data);
      setDocumentId(data.documentId);
      
      const extCust = data.extractedData?.customer || {};
      const extPol = data.extractedData?.policy || {};
      const extPrem = data.extractedData?.premium || {};
      const extMot = data.extractedData?.motor || {};
      const extNom = data.extractedData?.nominee || {};

      // Initialize Customer Data Draft
      setCustomerData({
        name: extCust.name?.value || '',
        mobile: extCust.mobile?.value || '',
        email: extCust.email?.value || '',
        dob: extCust.dob?.value ? extCust.dob.value.slice(0, 10) : '',
        gender: extCust.gender?.value || 'male',
        pan: extCust.pan?.value || '',
        aadhaar: extCust.aadhaar?.value || '',
        address: extCust.address?.value || '',
        city: extCust.city?.value || '',
        state: extCust.state?.value || '',
        pincode: extCust.pincode?.value || '',
        customerType: extCust.customerType?.value || 'individual'
      });

      // Initialize Policy Data Draft
      setPolicyData({
        insurer: extPol.insurer?.value || 'HDFC ERGO General Insurance',
        productName: extPol.productName?.value || '',
        planName: extPol.planName?.value || '',
        policyNumber: extPol.policyNumber?.value || '',
        policyType: extPol.policyType?.value || 'health',
        lob: extPol.lob?.value || (extPol.policyType?.value || 'health').toUpperCase(),
        subLob: extPol.subLob?.value || 'Comprehensive',
        businessType: extPol.businessType?.value || 'new',
        startDate: extPol.startDate?.value ? extPol.startDate.value.slice(0, 10) : '',
        endDate: extPol.endDate?.value ? extPol.endDate.value.slice(0, 10) : '',
        renewalDate: extPol.renewalDate?.value ? extPol.renewalDate.value.slice(0, 10) : '',
        sumAssured: extPol.sumAssured?.value || '',
        basicPremium: extPrem.basicPremium?.value || '',
        gst: extPrem.gst?.value || '',
        finalPremium: extPrem.finalPremium?.value || '',
        installmentAmount: extPrem.installmentAmount?.value || '',
        premiumFrequency: extPol.premiumFrequency?.value || 'yearly',
        notes: ''
      });

      // Initialize Motor Data Draft
      setMotorData({
        registrationNumber: extMot.registrationNumber?.value || '',
        vehicleType: extMot.vehicleType?.value || 'Private Car',
        make: extMot.make?.value || '',
        model: extMot.model?.value || '',
        variant: extMot.variant?.value || '',
        idv: extMot.idv?.value || '',
        ncb: extMot.ncb?.value !== undefined ? String(extMot.ncb.value) : '0',
        fuelType: extMot.fuelType?.value || 'Petrol',
        engineNumber: extMot.engineNumber?.value || '',
        chassisNumber: extMot.chassisNumber?.value || '',
        previousInsurer: extMot.previousInsurer?.value || ''
      });

      // Initialize Nominee Data Draft
      setNomineeData({
        name: extNom.name?.value || '',
        relation: extNom.relationship?.value || 'Spouse',
        dob: extNom.dob?.value ? extNom.dob.value.slice(0, 10) : '',
        share: extNom.share?.value || 100
      });

      setInsuredMembers(data.extractedData?.insuredMembers || []);

      // Duplicate candidates check
      if (data.duplicateCandidates?.customers?.length > 0) {
        setDuplicateCandidates(data.duplicateCandidates);
        const topCandidate = data.duplicateCandidates.customers[0]?.customer;
        if (topCandidate) {
          setSelectedCustomerAction('attach_existing');
          setSelectedExistingCustomerId(topCandidate._id || topCandidate.id);
        }
      }

      setStep('review');
      addToast('Policy PDF extracted with high accuracy! Please verify fields below.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to extract Policy PDF', 'danger');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!policyData.policyNumber.trim()) {
      addToast('Policy Number is required', 'danger');
      setActiveTab('policy');
      return;
    }

    if (selectedCustomerAction === 'create_new' && (!customerData.name.trim() || !customerData.mobile.trim())) {
      addToast('Customer Name and 10-digit Mobile number are required', 'danger');
      setActiveTab('customer');
      return;
    }

    setIsConfirming(true);

    try {
      const payload = {
        customerAction: selectedCustomerAction,
        existingCustomerId: selectedCustomerAction !== 'create_new' ? selectedExistingCustomerId : undefined,
        customerData,
        policyData: {
          ...policyData,
          premium: Number(policyData.finalPremium || policyData.basicPremium || 0),
          sumAssured: Number(policyData.sumAssured || 0),
          basicPremium: Number(policyData.basicPremium || 0),
          gst: Number(policyData.gst || 0),
          vehicleDetails: policyData.policyType === 'motor' ? motorData : undefined,
          nominee: nomineeData,
          insuredMembers
        }
      };

      const res = await apiClient.post(`/agencies/${agencyId}/ocr/${documentId}/confirm-policy`, payload);
      const saved = res.data || res;

      addToast(`Policy ${policyData.policyNumber} saved successfully to database!`, 'success');
      
      // Dispatch real-time events across UI
      window.dispatchEvent(new CustomEvent('policyCreated', { detail: saved.policy }));
      window.dispatchEvent(new CustomEvent('customerCreated', { detail: saved.customer }));

      if (onSaveSuccess) onSaveSuccess(saved);
      handleClose();
    } catch (err) {
      addToast(err.message || 'Failed to confirm policy data', 'danger');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setExtractedResult(null);
    setDocumentId(null);
    setDuplicateCandidates({ customers: [], policies: [] });
    onClose();
  };

  const renderConfidenceBadge = (fieldState) => {
    if (fieldState === 'extracted') {
      return <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>Extracted</span>;
    }
    if (fieldState === 'needs_review') {
      return <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>Needs Review</span>;
    }
    return <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>Not Found</span>;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Policy from PDF (AI Extraction & Human Verification)" 
      maxWidth="880px"
    >
      {step === 'upload' && (
        <div>
          <div style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg)',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <UploadCloud size={44} style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>
              {selectedFile ? selectedFile.name : 'Choose or Drag Policy PDF Schedule'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto' }}>
              Upload any Indian Insurance schedule (Health, Motor, Life, Term, General). Our OCR + AI engine will extract customer and policy fields for your review.
            </p>
            {selectedFile && (
              <div style={{ marginTop: '12px' }}>
                <span className="badge badge-info">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-primary" 
              disabled={!selectedFile || isProcessing}
              onClick={handleUploadAndExtract}
            >
              {isProcessing ? (
                <>
                  <Loader size={16} className="animate-spin" /> Extracting PDF...
                </>
              ) : (
                <>
                  Extract Policy Fields <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'extracting' && (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Loader size={44} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Processing Policy Schedule with AI</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            Securely uploading to AWS S3, running text OCR and insurance structured extraction. Review screen will appear shortly...
          </p>
        </div>
      )}

      {step === 'review' && (
        <div>
          {/* Duplicate Detection Alert Banner */}
          {duplicateCandidates.customers?.length > 0 && (
            <div style={{
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                <strong style={{ fontSize: '14px', color: 'var(--color-warning)' }}>
                  Potential Existing Customer Match Detected ({duplicateCandidates.customers.length} Match)
                </strong>
              </div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                Customer with matching mobile <strong>{customerData.mobile}</strong> or PAN <strong>{customerData.pan || '—'}</strong> already exists in your agency. Please choose an action:
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="radio" 
                    name="customerAction" 
                    value="attach_existing" 
                    checked={selectedCustomerAction === 'attach_existing'}
                    onChange={() => setSelectedCustomerAction('attach_existing')}
                  />
                  Attach Policy to Existing Customer
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="radio" 
                    name="customerAction" 
                    value="update_existing" 
                    checked={selectedCustomerAction === 'update_existing'}
                    onChange={() => setSelectedCustomerAction('update_existing')}
                  />
                  Update Existing Profile & Attach Policy
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="radio" 
                    name="customerAction" 
                    value="create_new" 
                    checked={selectedCustomerAction === 'create_new'}
                    onChange={() => setSelectedCustomerAction('create_new')}
                  />
                  Create Separate New Customer
                </label>
              </div>

              {selectedCustomerAction !== 'create_new' && (
                <div style={{ marginTop: '10px' }}>
                  <select 
                    className="form-select" 
                    value={selectedExistingCustomerId} 
                    onChange={(e) => setSelectedExistingCustomerId(e.target.value)}
                    style={{ fontSize: '13px' }}
                  >
                    {duplicateCandidates.customers.map((c, i) => (
                      <option key={i} value={c.customer._id || c.customer.id}>
                        {c.customer.name} (Mobile: {c.customer.mobile} | PAN: {c.customer.pan || '—'}) - Score: {c.matchScore}%
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px', overflowX: 'auto' }}>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('customer')}
            >
              <User size={14} /> 1. Customer Details
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'policy' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('policy')}
            >
              <Shield size={14} /> 2. Policy Details
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'premium' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('premium')}
            >
              <DollarSign size={14} /> 3. Premium & Tax
            </button>
            {policyData.policyType === 'motor' && (
              <button 
                type="button" 
                className={`btn btn-sm ${activeTab === 'motor' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('motor')}
              >
                <Car size={14} /> 4. Motor / Vehicle
              </button>
            )}
            <button 
              type="button" 
              className={`btn btn-sm ${activeTab === 'nominee' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('nominee')}
            >
              <Users size={14} /> 5. Nominee & Insured
            </button>
          </div>

          {/* Tab 1: Customer Details */}
          {activeTab === 'customer' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Full Name *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.name?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={customerData.name} 
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Mobile Number *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.mobile?.state)}
                </div>
                <input 
                  type="tel" 
                  className="form-input" 
                  required 
                  value={customerData.mobile} 
                  onChange={(e) => setCustomerData({ ...customerData, mobile: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Email Address</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.email?.state)}
                </div>
                <input 
                  type="email" 
                  className="form-input" 
                  value={customerData.email} 
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Date of Birth</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.dob?.state)}
                </div>
                <input 
                  type="date" 
                  className="form-input" 
                  value={customerData.dob} 
                  onChange={(e) => setCustomerData({ ...customerData, dob: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">PAN Card</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.pan?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ textTransform: 'uppercase' }}
                  value={customerData.pan} 
                  onChange={(e) => setCustomerData({ ...customerData, pan: e.target.value.toUpperCase() })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Aadhaar Number</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.customer?.aadhaar?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerData.aadhaar} 
                  onChange={(e) => setCustomerData({ ...customerData, aadhaar: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Full Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerData.address} 
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerData.city} 
                  onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customerData.state} 
                  onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })} 
                />
              </div>
            </div>
          )}

          {/* Tab 2: Policy Details */}
          {activeTab === 'policy' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Policy Number *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.policy?.policyNumber?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={policyData.policyNumber} 
                  onChange={(e) => setPolicyData({ ...policyData, policyNumber: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Insurance Company *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.policy?.insurer?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={policyData.insurer} 
                  onChange={(e) => setPolicyData({ ...policyData, insurer: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Policy Category / LOB *</label>
                <select 
                  className="form-select" 
                  value={policyData.policyType}
                  onChange={(e) => setPolicyData({ ...policyData, policyType: e.target.value, lob: e.target.value.toUpperCase() })}
                >
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
                <label className="form-label">Sub-LOB / Plan Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={policyData.subLob} 
                  onChange={(e) => setPolicyData({ ...policyData, subLob: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={policyData.startDate} 
                  onChange={(e) => setPolicyData({ ...policyData, startDate: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date / Expiry</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={policyData.endDate} 
                  onChange={(e) => setPolicyData({ ...policyData, endDate: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Renewal Date *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.policy?.renewalDate?.state)}
                </div>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={policyData.renewalDate} 
                  onChange={(e) => setPolicyData({ ...policyData, renewalDate: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sum Assured / Coverage (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={policyData.sumAssured} 
                  onChange={(e) => setPolicyData({ ...policyData, sumAssured: e.target.value })} 
                />
              </div>
            </div>
          )}

          {/* Tab 3: Premium & Tax */}
          {activeTab === 'premium' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Basic Net Premium (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={policyData.basicPremium} 
                  onChange={(e) => setPolicyData({ ...policyData, basicPremium: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST / Tax (₹ INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={policyData.gst} 
                  onChange={(e) => setPolicyData({ ...policyData, gst: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Total Premium Payable (₹ INR) *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.premium?.finalPremium?.state)}
                </div>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={policyData.finalPremium} 
                  onChange={(e) => setPolicyData({ ...policyData, finalPremium: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Premium Frequency</label>
                <select 
                  className="form-select" 
                  value={policyData.premiumFrequency}
                  onChange={(e) => setPolicyData({ ...policyData, premiumFrequency: e.target.value })}
                >
                  <option value="yearly">Yearly / Annual</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="single">Single Premium</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 4: Motor / Vehicle Details */}
          {activeTab === 'motor' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label">Vehicle Registration Number *</label>
                  {renderConfidenceBadge(extractedResult?.extractedData?.motor?.registrationNumber?.state)}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ textTransform: 'uppercase' }}
                  value={motorData.registrationNumber} 
                  onChange={(e) => setMotorData({ ...motorData, registrationNumber: e.target.value.toUpperCase() })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select 
                  className="form-select" 
                  value={motorData.vehicleType}
                  onChange={(e) => setMotorData({ ...motorData, vehicleType: e.target.value })}
                >
                  <option value="Private Car">Private Car</option>
                  <option value="2-Wheeler">Two Wheeler</option>
                  <option value="Commercial Vehicle">Commercial Vehicle</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Make</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={motorData.make} 
                  onChange={(e) => setMotorData({ ...motorData, make: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={motorData.model} 
                  onChange={(e) => setMotorData({ ...motorData, model: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">IDV (Insured Declared Value ₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={motorData.idv} 
                  onChange={(e) => setMotorData({ ...motorData, idv: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">NCB % (No Claim Bonus)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={motorData.ncb} 
                  onChange={(e) => setMotorData({ ...motorData, ncb: e.target.value })} 
                />
              </div>
            </div>
          )}

          {/* Tab 5: Nominee & Insured */}
          {activeTab === 'nominee' && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Nominee Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nominee Name" 
                  value={nomineeData.name} 
                  onChange={(e) => setNomineeData({ ...nomineeData, name: e.target.value })} 
                />
                <select 
                  className="form-select" 
                  value={nomineeData.relation}
                  onChange={(e) => setNomineeData({ ...nomineeData, relation: e.target.value })}
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Share %" 
                  value={nomineeData.share} 
                  onChange={(e) => setNomineeData({ ...nomineeData, share: Number(e.target.value) })} 
                />
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Insured Lives / Family Members</h4>
              {insuredMembers.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Individual coverage (Primary proposer insured).</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {insuredMembers.map((m, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '10px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{m.name}</span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{m.relationship || 'Self'}</span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{m.age ? `${m.age} yrs` : '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('upload')}>
              Upload Different PDF
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={isConfirming}
                onClick={handleConfirmAndSave}
              >
                {isConfirming ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Saving Policy...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm & Save Verified Policy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
