import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Shield, User, Car, DollarSign, Users, Loader, RefreshCw, XCircle, ArrowRight,
  ExternalLink, ZoomIn, ZoomOut, Check, ChevronDown, Sparkles, Building2, Plane, Home
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAgency } from '../../context/AgencyContext';
import { apiClient } from '../../api/client';
import { INSURANCE_TAXONOMY, getSubtypeConfig } from '../../schemas/insuranceTaxonomy';
import { SUBTYPE_SCHEMAS, getSubtypeSchema } from '../../schemas/insuranceSubtypeSchemas';
import { formatINR } from '../../utils/formatters';

export const PolicyPdfUploadModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { addToast } = useToast();
  const { currentAgency } = useAgency();
  const fileInputRef = useRef(null);

  // Workflow steps: 'select_or_upload' -> 'extracting' -> 'review'
  const [step, setStep] = useState('select_or_upload');
  const [selectedType, setSelectedType] = useState('health');
  const [selectedSubtype, setSelectedSubtype] = useState('family_floater');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Classification & Review State
  const [classification, setClassification] = useState(null);
  const [isChangingSubtype, setIsChangingSubtype] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null); // kept for reference, NOT used in iframe directly
  const [presignedPdfUrl, setPresignedPdfUrl] = useState(null); // short-lived presigned S3 URL for PDF viewer
  const [isFetchingPdfUrl, setIsFetchingPdfUrl] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState({ customers: [], policies: [] });
  const [selectedCustomerAction, setSelectedCustomerAction] = useState('create_new');
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState('');


  // Active Tab in Review Right Panel
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'policy' | 'coverage' | 'premium' | 'members' | 'motor' | 'nominee'

  // Editable Form State
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
    insurer: '',
    productName: '',
    planName: '',
    policyNumber: '',
    insuranceType: 'health',
    insuranceSubtype: 'family_floater',
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

  const [nomineeData, setNomineeData] = useState({
    name: '',
    relation: 'Spouse',
    dob: '',
    share: 100
  });

  const [insuredMembers, setInsuredMembers] = useState([]);

  // Field status tracking (e.g. 'extracted' | 'needs_review' | 'not_found')
  const [fieldStatuses, setFieldStatuses] = useState({});

  const agencyId = currentAgency?.id || currentAgency?._id || localStorage.getItem('insecure_agency_id') || '6ab7424622537587efc9ef30';

  /**
   * Fetches a short-lived presigned URL from backend to display the PDF in the browser.
   * This keeps the S3 bucket private — no direct public S3 URL is ever used in the iframe.
   */
  const fetchPresignedPdfUrl = async (docId) => {
    if (!docId) return;
    setIsFetchingPdfUrl(true);
    try {
      const res = await apiClient.get(`/agencies/${agencyId}/ocr/${docId}/view-url`);
      const urlData = res.data?.data || res.data || res;
      if (urlData?.url) {
        setPresignedPdfUrl(urlData.url);
      }
    } catch (err) {
      console.warn('[PolicyPdfUploadModal] Could not fetch presigned PDF URL:', err.message);
      // Non-fatal: PDF preview just won't show, form data still accessible
    } finally {
      setIsFetchingPdfUrl(false);
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        addToast('File size exceeds 15MB limit', 'danger');
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
      if (selectedSubtype) {
        formData.append('subtype', selectedSubtype);
      }

      const res = await apiClient.post(`/agencies/${agencyId}/ocr/extract-pdf`, formData);
      const data = res.data?.data || res.data || res;
      
      const newDocId = data.documentId;
      setDocumentId(newDocId);
      setBlobUrl(data.blobUrl || null); // stored for reference only
      setClassification(data.classification || null);
      setDuplicateCandidates(data.duplicateCandidates || { customers: [], policies: [] });

      // Fetch presigned URL for secure PDF viewing — never use raw S3 blobUrl in iframe
      if (newDocId) {
        fetchPresignedPdfUrl(newDocId);
      }

      const ext = data.extractedData || {};
      const extCust = ext.customer || {};
      const extPol = ext.policy || {};
      const extPrem = ext.premium || {};
      const extMot = ext.motor || {};
      const extNom = ext.nominee || {};
      const extHealth = ext.healthDetails || {};
      const extLife = ext.lifeDetails || {};
      const extTravel = ext.travelDetails || {};
      const extProperty = ext.propertyDetails || {};

      const detectedSubtype = data.classification?.effectiveSubtype || selectedSubtype || 'individual_health';
      const detectedType = data.classification?.effectiveType || selectedType || 'health';

      setSelectedType(detectedType);
      setSelectedSubtype(detectedSubtype);

      // Track field statuses for review indicators
      const statuses = {};
      const recordStatus = (key, fieldObj) => {
        if (!fieldObj) return;
        statuses[key] = {
          state: fieldObj.state || (fieldObj.value ? 'extracted' : 'not_found'),
          confidence: fieldObj.confidence || 0.8
        };
      };

      recordStatus('customer.name', extCust.name);
      recordStatus('customer.mobile', extCust.mobile);
      recordStatus('customer.email', extCust.email);
      recordStatus('customer.pan', extCust.pan);
      recordStatus('policy.insurer', extPol.insurer);
      recordStatus('policy.policyNumber', extPol.policyNumber);
      recordStatus('policy.startDate', extPol.startDate);
      recordStatus('policy.renewalDate', extPol.renewalDate);
      recordStatus('policy.sumAssured', extPol.sumAssured);
      recordStatus('premium.finalPremium', extPrem.finalPremium);
      if (extMot.registrationNumber) recordStatus('motor.registrationNumber', extMot.registrationNumber);
      if (extMot.idv) recordStatus('motor.idv', extMot.idv);

      setFieldStatuses(statuses);

      // Populate draft form state
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
        customerType: 'individual'
      });

      setPolicyData({
        insurer: extPol.insurer?.value || '',
        productName: extPol.productName?.value || '',
        planName: extPol.planName?.value || '',
        policyNumber: extPol.policyNumber?.value || '',
        insuranceType: detectedType,
        insuranceSubtype: detectedSubtype,
        businessType: extPol.businessType?.value || 'new',
        startDate: extPol.startDate?.value ? extPol.startDate.value.slice(0, 10) : '',
        endDate: extPol.endDate?.value ? extPol.endDate.value.slice(0, 10) : '',
        renewalDate: extPol.renewalDate?.value ? extPol.renewalDate.value.slice(0, 10) : '',
        sumAssured: extPol.sumAssured?.value || '',
        basicPremium: extPrem.basicPremium?.value || '',
        gst: extPrem.gst?.value || '',
        finalPremium: extPrem.finalPremium?.value || '',
        installmentAmount: extPrem.installmentAmount?.value || '',
        premiumFrequency: 'yearly',
        notes: ''
      });

      if (extMot) {
        setMotorData({
          registrationNumber: extMot.registrationNumber?.value || '',
          vehicleType: extMot.vehicleType?.value || 'Private Car',
          make: extMot.make?.value || '',
          model: extMot.model?.value || '',
          variant: extMot.variant?.value || '',
          idv: extMot.idv?.value || '',
          ncbPercentage: extMot.ncbPercentage?.value || '0',
          fuelType: extMot.fuelType?.value || 'Petrol',
          engineNumber: extMot.engineNumber?.value || '',
          chassisNumber: extMot.chassisNumber?.value || '',
          manufacturingYear: extMot.manufacturingYear?.value || '',
          registrationDate: extMot.registrationDate?.value ? extMot.registrationDate.value.slice(0, 10) : '',
          previousInsurer: extMot.previousInsurer?.value || '',
          previousPolicyNumber: extMot.previousPolicyNumber?.value || '',
          ownDamagePremium: extMot.ownDamagePremium?.value || '',
          thirdPartyPremium: extMot.thirdPartyPremium?.value || '',
          zeroDepreciation: !!extMot.zeroDepreciation?.value,
          engineProtection: !!extMot.engineProtection?.value,
          roadsideAssistance: !!extMot.roadsideAssistance?.value,
          consumables: !!extMot.consumables?.value
        });
      }

      if (extHealth) {
        setHealthDetails({
          roomRentLimit: extHealth.roomRentLimit?.value || '',
          icuLimit: extHealth.icuLimit?.value || '',
          coPayment: extHealth.coPayment?.value || '',
          deductible: extHealth.deductible?.value || '',
          aggregateDeductible: extHealth.aggregateDeductible?.value || '',
          preExistingWaitingPeriod: extHealth.preExistingWaitingPeriod?.value || '',
          cumulativeBonus: extHealth.cumulativeBonus?.value || '',
          restorationBenefit: extHealth.restorationBenefit?.value || ''
        });
      }

      if (extLife) {
        setLifeDetails({
          uin: extLife.uin?.value || '',
          policyTermYears: extLife.policyTermYears?.value || '',
          premiumPaymentTermYears: extLife.premiumPaymentTermYears?.value || '',
          deathBenefit: extLife.deathBenefit?.value || '',
          maturityDate: extLife.maturityDate?.value ? extLife.maturityDate.value.slice(0, 10) : '',
          maturityBenefit: extLife.maturityBenefit?.value || '',
          smokerStatus: extLife.smokerStatus?.value || 'non_smoker',
          accidentalDeathRider: extLife.accidentalDeathRider?.value || '',
          criticalIllnessRider: extLife.criticalIllnessRider?.value || '',
          fundName: extLife.fundName?.value || '',
          unitsHeld: extLife.unitsHeld?.value || '',
          nav: extLife.nav?.value || '',
          totalFundValue: extLife.totalFundValue?.value || '',
          annuityAmount: extLife.annuityAmount?.value || ''
        });
      }

      if (extTravel) {
        setTravelDetails({
          passportNumber: extTravel.passportNumber?.value || '',
          nationality: 'Indian',
          destinationCountry: extTravel.destinationCountry?.value || '',
          tripDurationDays: extTravel.tripDurationDays?.value || '',
          medicalExpensesLimit: extTravel.medicalExpensesLimit?.value || ''
        });
      }

      if (extProperty) {
        setPropertyDetails({
          propertyAddress: extProperty.propertyAddress?.value || '',
          propertyType: 'flat',
          builtUpAreaSqFt: extProperty.builtUpAreaSqFt?.value || '',
          buildingSumInsured: extProperty.buildingSumInsured?.value || '',
          contentsSumInsured: extProperty.contentsSumInsured?.value || ''
        });
      }

      if (extNom) {
        setNomineeData({
          name: extNom.name?.value || '',
          relation: extNom.relationship?.value || 'Spouse',
          dob: extNom.dob?.value ? extNom.dob.value.slice(0, 10) : '',
          share: extNom.share?.value || 100
        });
      }

      if (Array.isArray(ext.insuredMembers)) {
        setInsuredMembers(ext.insuredMembers);
      }

      // Default duplicate selection
      if (data.duplicateCandidates?.customers?.length > 0) {
        setSelectedCustomerAction('attach_existing');
        setSelectedExistingCustomerId(data.duplicateCandidates.customers[0]._id || data.duplicateCandidates.customers[0].id);
      } else {
        setSelectedCustomerAction('create_new');
      }

      setStep('review');
    } catch (err) {
      console.error('OCR Extraction error:', err);
      addToast(err.message || 'Failed to extract policy data from PDF', 'danger');
      setStep('select_or_upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubtypeChange = (newSubtype) => {
    setSelectedSubtype(newSubtype);
    const cfg = getSubtypeConfig(newSubtype);
    if (cfg) setSelectedType(cfg.type);
    setPolicyData(prev => ({ ...prev, insuranceSubtype: newSubtype, insuranceType: cfg ? cfg.type : prev.insuranceType }));
    setIsChangingSubtype(false);
    addToast(`Schema updated to ${cfg ? cfg.subtypeName : newSubtype}`, 'info');
  };

  const handleConfirmAndSave = async () => {
    if (!policyData.policyNumber?.trim()) {
      addToast('Policy Number is required', 'warning');
      setActiveTab('policy');
      return;
    }
    if (!policyData.finalPremium && !policyData.premium) {
      addToast('Total Premium is required', 'warning');
      setActiveTab('premium');
      return;
    }
    if (selectedCustomerAction === 'create_new' && (!customerData.name?.trim() || !customerData.mobile?.trim())) {
      addToast('Customer Name and 10-digit Mobile are required', 'warning');
      setActiveTab('customer');
      return;
    }

    setIsConfirming(true);
    try {
      const payload = {
        customerAction: selectedCustomerAction,
        existingCustomerId: selectedCustomerAction !== 'create_new' ? selectedExistingCustomerId : undefined,
        insuranceType: selectedType,
        insuranceSubtype: selectedSubtype,
        customerData,
        policyData: {
          ...policyData,
          insuranceType: selectedType,
          insuranceSubtype: selectedSubtype,
          sumAssured: policyData.sumAssured ? Number(policyData.sumAssured) : undefined,
          basicPremium: policyData.basicPremium ? Number(policyData.basicPremium) : undefined,
          gst: policyData.gst ? Number(policyData.gst) : undefined,
          finalPremium: policyData.finalPremium ? Number(policyData.finalPremium) : Number(policyData.premium)
        },
        premiumData: {
          basicPremium: policyData.basicPremium,
          gst: policyData.gst,
          finalPremium: policyData.finalPremium || policyData.premium,
          premiumFrequency: policyData.premiumFrequency
        },
        motorData: selectedType === 'motor' ? motorData : undefined,
        healthDetails: selectedType === 'health' ? healthDetails : undefined,
        lifeDetails: selectedType === 'life' ? lifeDetails : undefined,
        travelDetails: selectedSubtype === 'travel' ? travelDetails : undefined,
        propertyDetails: selectedSubtype === 'home_property' ? propertyDetails : undefined,
        insuredMembers: insuredMembers,
        nomineeData: nomineeData.name ? nomineeData : undefined
      };

      await apiClient.post(`/agencies/${agencyId}/ocr/${documentId}/confirm-policy`, payload);

      addToast(`Policy #${policyData.policyNumber} confirmed & created successfully!`, 'success');
      if (onSaveSuccess) onSaveSuccess();
      handleClose();
    } catch (err) {
      console.error('Confirmation error:', err);
      addToast(err.message || 'Failed to confirm policy creation', 'danger');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setStep('select_or_upload');
    setSelectedFile(null);
    setDocumentId(null);
    setBlobUrl(null);
    setPresignedPdfUrl(null);
    setIsFetchingPdfUrl(false);
    setClassification(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentSubtypeSchema = getSubtypeSchema(selectedSubtype);
  const currentSubtypeConfig = getSubtypeConfig(selectedSubtype);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Insurance Policy PDF (AI OCR & Extraction)"
      maxWidth={step === 'review' ? '1280px' : '640px'}
    >
      {/* ------------------------------------------------------------- */}
      {/* STEP 1: Select Type / Subtype & Choose PDF File */}
      {/* ------------------------------------------------------------- */}
      {step === 'select_or_upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Subtype Selector */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '8px', display: 'block' }}>
              Select Insurance Product Category (or leave Auto-Detect)
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  1. LINE OF BUSINESS (TYPE)
                </span>
                <select
                  className="select"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={selectedType}
                  onChange={(e) => {
                    const newT = e.target.value;
                    setSelectedType(newT);
                    const found = INSURANCE_TAXONOMY.find(t => t.code === newT);
                    if (found && found.subtypes.length > 0) {
                      setSelectedSubtype(found.subtypes[0].code);
                    }
                  }}
                >
                  {INSURANCE_TAXONOMY.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  2. PRODUCT SUBTYPE
                </span>
                <select
                  className="select"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={selectedSubtype}
                  onChange={(e) => handleSubtypeChange(e.target.value)}
                >
                  {INSURANCE_TAXONOMY.find(t => t.code === selectedType)?.subtypes.map(st => (
                    <option key={st.code} value={st.code}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--color-accent-border, #bfdbfe)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-accent-subtle, #eff6ff)',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
            />

            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <UploadCloud size={24} />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              {selectedFile ? selectedFile.name : 'Click or Drag Policy PDF Schedule here'}
            </h3>
            
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for AI extraction` : 'Supports multi-page policy schedules (Tata AIG, HDFC ERGO, Star Health, ICICI, LIC, etc.)'}
            </p>
          </div>

          {/* Features highlight */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '11.5px',
            color: 'var(--color-text-body)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
              <span>Subtype-Specific Extraction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} style={{ color: '#15803d' }} />
              <span>Multi-Member Family Parser</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Car size={14} style={{ color: '#b45309' }} />
              <span>Motor IDV / NCB & Add-ons</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!selectedFile || isProcessing}
              onClick={handleUploadAndExtract}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-accent)' }}
            >
              <UploadCloud size={15} />
              <span>Extract Policy Data</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: Extraction Progress */}
      {/* ------------------------------------------------------------- */}
      {step === 'extracting' && (
        <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader size={36} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--color-text-main)' }}>
              Analyzing & Extracting Policy PDF
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '420px' }}>
              Running multi-stage OCR extraction, document classification, family member parsing, and duplicate checks...
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: Split Human Review Interface */}
      {/* ------------------------------------------------------------- */}
      {step === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflow: 'hidden' }}>
          
          {/* Classification & Subtype Banner */}
          <div style={{
            padding: '10px 16px',
            backgroundColor: classification?.isValid ? '#f0f9ff' : '#fafafa',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${classification?.isValid ? '#bae6fd' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Only show insurer badge if it was actually detected */}
              {classification?.detectedInsurer && classification.detectedInsurer !== 'General Insurance' && (
                <span className="badge badge-info" style={{ fontWeight: '700', fontSize: '11px' }}>
                  {classification.detectedInsurer}
                </span>
              )}
              <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
                {classification?.isValid
                  ? <>Detected Subtype: <strong>{currentSubtypeConfig?.subtypeName || selectedSubtype}</strong></>
                  : <span style={{ color: '#64748b' }}>Classification pending — please verify subtype</span>
                }
              </span>
              {/* Only show confidence when classification is valid and has real data */}
              {classification?.isValid && typeof classification?.confidence === 'number' && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  ({Math.round(classification.confidence * 100)}% confidence)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isChangingSubtype ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    className="select"
                    style={{ fontSize: '12px', padding: '3px 8px' }}
                    value={selectedSubtype}
                    onChange={(e) => handleSubtypeChange(e.target.value)}
                  >
                    {INSURANCE_TAXONOMY.flatMap(t => t.subtypes).map(st => (
                      <option key={st.code} value={st.code}>{st.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsChangingSubtype(false)}>Done</button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsChangingSubtype(true)}
                  style={{ fontSize: '11.5px', padding: '3px 8px' }}
                >
                  Change Subtype
                </button>
              )}
            </div>
          </div>

          {/* Duplicate Customer Match Banner */}
          {duplicateCandidates?.customers?.length > 0 && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fef08a',
              fontSize: '12.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '600' }}>
                  <AlertTriangle size={15} />
                  <span>Existing Customer Match Found in CRM</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="radio"
                      name="custAction"
                      checked={selectedCustomerAction === 'attach_existing'}
                      onChange={() => setSelectedCustomerAction('attach_existing')}
                    />
                    <span>Attach to Existing</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="radio"
                      name="custAction"
                      checked={selectedCustomerAction === 'create_new'}
                      onChange={() => setSelectedCustomerAction('create_new')}
                    />
                    <span>Create Separate New</span>
                  </label>
                </div>
              </div>

              {selectedCustomerAction === 'attach_existing' && (
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  Attaching to: <strong>{duplicateCandidates.customers[0].name}</strong> ({duplicateCandidates.customers[0].mobile || duplicateCandidates.customers[0].email})
                </div>
              )}
            </div>
          )}

          {/* Duplicate Policy Number Warning */}
          {duplicateCandidates?.policies?.length > 0 && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <XCircle size={15} />
              <span>Warning: Policy #{policyData.policyNumber} already exists in database.</span>
            </div>
          )}

          {/* Split Desktop Layout: Left Document / Right Extracted Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '42% 58%', gap: '16px', flex: 1, minHeight: '480px', overflow: 'hidden' }}>
            
            {/* Left: Document PDF Preview */}
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                  {selectedFile?.name || 'Policy Document.pdf'}
                </span>
                {presignedPdfUrl && (
                  <a href={presignedPdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                    <ExternalLink size={12} /> Open PDF
                  </a>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#334155' }}>
                {isFetchingPdfUrl ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <Loader size={28} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ fontSize: '13px' }}>Loading secure PDF preview...</p>
                  </div>
                ) : presignedPdfUrl ? (
                  <iframe
                    src={presignedPdfUrl}
                    title="PDF Preview"
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px', backgroundColor: '#ffffff' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={36} style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ fontSize: '13px' }}>PDF preview unavailable</p>
                    <p style={{ fontSize: '11px', marginTop: '4px', color: '#64748b' }}>Form data is still fully populated below</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right: Subtype-Specific Categorized Tabs & Form */}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', overflow: 'hidden' }}>
              
              {/* Category Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', overflowX: 'auto', gap: '2px' }}>
                {[
                  { id: 'customer', label: 'Customer Info' },
                  { id: 'policy', label: 'Policy Details' },
                  { id: 'coverage', label: 'Subtype Coverage' },
                  { id: 'premium', label: 'Premium & Tax' },
                  ...(currentSubtypeSchema.entities.hasMembers ? [{ id: 'members', label: `Insured Members (${insuredMembers.length})` }] : []),
                  ...(currentSubtypeSchema.entities.hasVehicle ? [{ id: 'motor', label: 'Vehicle Details' }] : []),
                  { id: 'nominee', label: 'Nominee' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      fontWeight: activeTab === tab.id ? '700' : '500',
                      color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                      backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Form Content */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                
                {/* 1. Customer Information */}
                {activeTab === 'customer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Customer / Proposer Full Name *
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="e.g. Kamal Sharma"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.mobile}
                        onChange={(e) => setCustomerData({ ...customerData, mobile: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.pan}
                        onChange={(e) => setCustomerData({ ...customerData, pan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.dob}
                        onChange={(e) => setCustomerData({ ...customerData, dob: e.target.value })}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Residential Address
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.address}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        City
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.city}
                        onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        State & PIN
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, fontSize: '13px' }}
                          placeholder="State"
                          value={customerData.state}
                          onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          style={{ width: '90px', fontSize: '13px' }}
                          placeholder="Pincode"
                          value={customerData.pincode}
                          onChange={(e) => setCustomerData({ ...customerData, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Policy Details */}
                {activeTab === 'policy' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Insurance Company / Insurer *
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.insurer}
                        onChange={(e) => setPolicyData({ ...policyData, insurer: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Policy Number *
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}
                        value={policyData.policyNumber}
                        onChange={(e) => setPolicyData({ ...policyData, policyNumber: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Plan / Product Name
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.productName}
                        onChange={(e) => setPolicyData({ ...policyData, productName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Policy Start Date
                      </label>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.startDate}
                        onChange={(e) => setPolicyData({ ...policyData, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Policy End Date
                      </label>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.endDate}
                        onChange={(e) => setPolicyData({ ...policyData, endDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Next Renewal Due Date *
                      </label>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.renewalDate}
                        onChange={(e) => setPolicyData({ ...policyData, renewalDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Sum Insured / Sum Assured (INR)
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
                        value={policyData.sumAssured}
                        onChange={(e) => setPolicyData({ ...policyData, sumAssured: e.target.value })}
                        placeholder="500000"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Subtype-Specific Coverage Details */}
                {activeTab === 'coverage' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {selectedType === 'health' && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Room Rent Limit
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.roomRentLimit}
                            onChange={(e) => setHealthDetails({ ...healthDetails, roomRentLimit: e.target.value })}
                            placeholder="e.g. 1% of SI or No Capping"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            ICU Limit
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.icuLimit}
                            onChange={(e) => setHealthDetails({ ...healthDetails, icuLimit: e.target.value })}
                            placeholder="e.g. 2% of SI or No Capping"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Co-Payment (%)
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.coPayment}
                            onChange={(e) => setHealthDetails({ ...healthDetails, coPayment: e.target.value })}
                            placeholder="0% or 10%"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Deductible / Aggregate Deductible (INR)
                          </label>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={selectedSubtype === 'super_top_up' ? healthDetails.aggregateDeductible : healthDetails.deductible}
                            onChange={(e) => {
                              if (selectedSubtype === 'super_top_up') setHealthDetails({ ...healthDetails, aggregateDeductible: e.target.value });
                              else setHealthDetails({ ...healthDetails, deductible: e.target.value });
                            }}
                            placeholder="e.g. 500000"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Cumulative Bonus (NCB)
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.cumulativeBonus}
                            onChange={(e) => setHealthDetails({ ...healthDetails, cumulativeBonus: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Restoration Benefit
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.restorationBenefit}
                            onChange={(e) => setHealthDetails({ ...healthDetails, restorationBenefit: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'life' && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            IRDAI UIN Code
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={lifeDetails.uin}
                            onChange={(e) => setLifeDetails({ ...lifeDetails, uin: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Policy Term / PPT (Years)
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              className="input"
                              placeholder="Policy Term"
                              style={{ flex: 1, fontSize: '13px' }}
                              value={lifeDetails.policyTermYears}
                              onChange={(e) => setLifeDetails({ ...lifeDetails, policyTermYears: e.target.value })}
                            />
                            <input
                              type="number"
                              className="input"
                              placeholder="PPT"
                              style={{ flex: 1, fontSize: '13px' }}
                              value={lifeDetails.premiumPaymentTermYears}
                              onChange={(e) => setLifeDetails({ ...lifeDetails, premiumPaymentTermYears: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Death Benefit Payout
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={lifeDetails.deathBenefit}
                            onChange={(e) => setLifeDetails({ ...lifeDetails, deathBenefit: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Maturity Benefit (INR)
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={lifeDetails.maturityBenefit}
                            onChange={(e) => setLifeDetails({ ...lifeDetails, maturityBenefit: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedSubtype === 'travel' && (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Passport Number
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={travelDetails.passportNumber}
                            onChange={(e) => setTravelDetails({ ...travelDetails, passportNumber: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Destination Country
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={travelDetails.destinationCountry}
                            onChange={(e) => setTravelDetails({ ...travelDetails, destinationCountry: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Trip Duration (Days)
                          </label>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={travelDetails.tripDurationDays}
                            onChange={(e) => setTravelDetails({ ...travelDetails, tripDurationDays: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {selectedSubtype === 'home_property' && (
                      <>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Property Address
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={propertyDetails.propertyAddress}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, propertyAddress: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Building Structure Sum Insured (INR)
                          </label>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={propertyDetails.buildingSumInsured}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, buildingSumInsured: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Home Contents Sum Insured (INR)
                          </label>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={propertyDetails.contentsSumInsured}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, contentsSumInsured: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 4. Premium & Financials */}
                {activeTab === 'premium' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Basic / Net Premium (excl. GST)
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.basicPremium}
                        onChange={(e) => setPolicyData({ ...policyData, basicPremium: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        GST / Tax Amount (18%)
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.gst}
                        onChange={(e) => setPolicyData({ ...policyData, gst: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Gross Paid Premium (INR) *
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '14px', fontWeight: '700', color: '#15803d' }}
                        value={policyData.finalPremium}
                        onChange={(e) => setPolicyData({ ...policyData, finalPremium: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Payment Frequency
                      </label>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.premiumFrequency}
                        onChange={(e) => setPolicyData({ ...policyData, premiumFrequency: e.target.value })}
                      >
                        <option value="yearly">Yearly / Annual</option>
                        <option value="half_yearly">Half-Yearly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="monthly">Monthly</option>
                        <option value="single">Single Premium</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 5. Insured Members (For Health / Floater) */}
                {activeTab === 'members' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Insured Lives Schedule ({insuredMembers.length})</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setInsuredMembers([...insuredMembers, { name: '', relationship: 'Dependent', gender: 'male', memberId: `MEM-${insuredMembers.length + 1}` }])}
                      >
                        + Add Member
                      </button>
                    </div>

                    {insuredMembers.map((m, idx) => (
                      <div key={idx} style={{ padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Member Name"
                          style={{ fontSize: '12.5px' }}
                          value={m.name || ''}
                          onChange={(e) => {
                            const copy = [...insuredMembers];
                            copy[idx].name = e.target.value;
                            setInsuredMembers(copy);
                          }}
                        />
                        <select
                          className="select"
                          style={{ fontSize: '12px' }}
                          value={m.relationship || 'Self'}
                          onChange={(e) => {
                            const copy = [...insuredMembers];
                            copy[idx].relationship = e.target.value;
                            setInsuredMembers(copy);
                          }}
                        >
                          <option value="Self">Self</option>
                          <option value="Spouse">Spouse / Wife / Husband</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                        </select>
                        <input
                          type="number"
                          className="input"
                          placeholder="Age"
                          style={{ fontSize: '12px' }}
                          value={m.age || ''}
                          onChange={(e) => {
                            const copy = [...insuredMembers];
                            copy[idx].age = e.target.value;
                            setInsuredMembers(copy);
                          }}
                        />
                        <select
                          className="select"
                          style={{ fontSize: '12px' }}
                          value={m.gender || 'male'}
                          onChange={(e) => {
                            const copy = [...insuredMembers];
                            copy[idx].gender = e.target.value;
                            setInsuredMembers(copy);
                          }}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <button
                          style={{ color: '#dc2626', padding: '4px' }}
                          onClick={() => setInsuredMembers(insuredMembers.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Motor Vehicle Details */}
                {activeTab === 'motor' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Vehicle Registration No. *
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}
                        value={motorData.registrationNumber}
                        onChange={(e) => setMotorData({ ...motorData, registrationNumber: e.target.value.toUpperCase() })}
                        placeholder="MH02EK4921"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Insured Declared Value - IDV (INR) *
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
                        value={motorData.idv}
                        onChange={(e) => setMotorData({ ...motorData, idv: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Make & Model
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Make (e.g. Hyundai)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.make}
                          onChange={(e) => setMotorData({ ...motorData, make: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Model (e.g. Creta)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.model}
                          onChange={(e) => setMotorData({ ...motorData, model: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        NCB Discount (%)
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={motorData.ncbPercentage}
                        onChange={(e) => setMotorData({ ...motorData, ncbPercentage: e.target.value })}
                        placeholder="0 to 50%"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Engine Number
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={motorData.engineNumber}
                        onChange={(e) => setMotorData({ ...motorData, engineNumber: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Chassis Number (VIN)
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={motorData.chassisNumber}
                        onChange={(e) => setMotorData({ ...motorData, chassisNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                )}

                {/* 7. Nominee */}
                {activeTab === 'nominee' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Nominee Full Name
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.name}
                        onChange={(e) => setNomineeData({ ...nomineeData, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Relationship with Insured
                      </label>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.relation}
                        onChange={(e) => setNomineeData({ ...nomineeData, relation: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                        Entitlement Share (%)
                      </label>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.share}
                        onChange={(e) => setNomineeData({ ...nomineeData, share: e.target.value })}
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Review Action Footer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isConfirming}
                  onClick={handleConfirmAndSave}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-accent)' }}
                >
                  <CheckCircle2 size={15} />
                  <span>{isConfirming ? 'Creating Policy...' : 'Confirm & Create Policy'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  );
};
