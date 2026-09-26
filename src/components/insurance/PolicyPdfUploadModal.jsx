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
  const [activeTab, setActiveTab] = useState('customer');

  // Editable Form State
  const [customerData, setCustomerData] = useState({
    title: '',
    name: '',
    mobile: '',
    email: '',
    dob: '',
    gender: 'male',
    pan: '',
    aadhaar: '',
    address: '',
    city: '',
    district: '',
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
    policyType: 'Package Policy',
    issueDate: '',
    startDate: '',
    endDate: '',
    renewalDate: '',
    tenureYears: '1',
    sumAssured: '',
    basicPremium: '',
    gst: '',
    gstPercentage: '18',
    cess: '',
    discount: '',
    loading: '',
    finalPremium: '',
    installmentAmount: '',
    premiumFrequency: 'yearly',
    notes: ''
  });

  const [motorData, setMotorData] = useState({
    // Vehicle Details
    vehicleType: 'Private Car',
    vehicleCategory: 'Private Car',
    make: '',
    model: '',
    variant: '',
    subModel: '',
    fuelType: 'Petrol',
    cubicCapacity: '',
    seatingCapacity: '',
    numberOfTyres: '',
    vehicleColor: '',
    // Registration Details
    registrationNumber: '',
    registrationDate: '',
    registrationState: '',
    registrationCity: '',
    rtoCode: '',
    rtoName: '',
    zone: '',
    // Manufacturing Details
    manufacturingMonth: '',
    manufacturingYear: '',
    manufacturingDate: '',
    // Identification Numbers
    engineNumber: '',
    chassisNumber: '',
    vinNumber: '',
    identificationNumber: '',
    // Valuation & NCB
    idv: '',
    vehicleValue: '',
    currentNcbPercentage: '',
    previousNcbPercentage: '',
    ncbPercentage: '0',
    // Previous Policy
    previousPolicyAvailable: null,
    previousInsurer: '',
    previousPolicyNumber: '',
    previousPolicyStartDate: '',
    previousPolicyEndDate: '',
    previousPolicyType: '',
    previousNcb: '',
    previousIdv: '',
    // Third Party Policy
    activeTpInsurerName: '',
    activeTpPolicyNumber: '',
    activeTpPolicyStartDate: '',
    activeTpPolicyEndDate: '',
    tpPremium: '',
    // Financing
    financed: null,
    financierName: '',
    hypothecation: '',
    loanProvider: '',
    // Add-on flags
    addons: [],
    zeroDepreciation: false,
    engineProtection: false,
    roadsideAssistance: false,
    consumables: false,
    returnToInvoice: false,
    ncbProtector: false,
    tyreProtector: false,
    keyReplacement: false,
    personalBelongings: false,
    personalAccidentCover: false,
    // Premiums Breakdown
    ownDamagePremium: '',
    thirdPartyPremium: '',
    personalAccidentPremium: '',
    addonPremium: '',
    discount: '',
    loading: '',
    cess: ''
  });

  const [brokerData, setBrokerData] = useState({
    brokerAgency: '',
    agentName: '',
    subAgent: '',
    brokerCode: '',
    agentCode: ''
  });

  const [paymentData, setPaymentData] = useState({
    paymentStatus: 'completed',
    paymentMethod: 'Online',
    paymentDate: '',
    paymentAmount: '',
    transactionReference: '',
    receiptNumber: ''
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
   * Helper badge to clearly distinguish AI Extracted vs Manual vs Calculated vs Needs Review
   */
  const renderFieldBadge = (key, customLabel = null) => {
    const info = fieldStatuses[key];
    const state = info?.state || 'not_found';
    const source = info?.source;

    if (source === 'calculated') {
      return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '600' }}>Calculated</span>;
    }
    if (state === 'extracted') {
      return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600' }}>AI Extracted</span>;
    }
    if (state === 'needs_review') {
      return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: '600' }}>Needs Review</span>;
    }
    if (customLabel) {
      return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '500' }}>{customLabel}</span>;
    }
    return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#94a3b8', fontWeight: '500' }}>Not Detected</span>;
  };

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
      setBlobUrl(data.blobUrl || null);
      setClassification(data.classification || null);
      setDuplicateCandidates(data.duplicateCandidates || { customers: [], policies: [] });

      // Fetch presigned URL for secure PDF viewing
      if (newDocId) {
        fetchPresignedPdfUrl(newDocId);
      }

      const ext = data.extractedData || {};
      const extCust = ext.customer || {};
      const extPol = ext.policy || {};
      const extPrem = ext.premium || {};
      const extMot = ext.motor || {};
      const extNom = ext.nominee || {};
      const extBroker = ext.brokerDetails || {};
      const extPayment = ext.paymentDetails || {};
      const extHealth = ext.healthDetails || {};
      const extLife = ext.lifeDetails || {};
      const extTravel = ext.travelDetails || {};
      const extProperty = ext.propertyDetails || {};

      const detectedSubtype = data.classification?.effectiveSubtype || selectedSubtype || 'car';
      const detectedType = data.classification?.effectiveType || selectedType || 'motor';

      setSelectedType(detectedType);
      setSelectedSubtype(detectedSubtype);

      // Track field statuses for review indicators
      const statuses = {};
      const recordStatus = (key, fieldObj) => {
        if (!fieldObj) {
          statuses[key] = { state: 'not_found', confidence: null, source: 'document' };
          return;
        }
        statuses[key] = {
          state: fieldObj.state || (fieldObj.value !== undefined && fieldObj.value !== null && fieldObj.value !== '' ? 'extracted' : 'not_found'),
          confidence: fieldObj.confidence || null,
          source: fieldObj.source || 'document'
        };
      };

      // Customer fields
      recordStatus('customer.name', extCust.name);
      recordStatus('customer.mobile', extCust.mobile);
      recordStatus('customer.email', extCust.email);
      recordStatus('customer.dob', extCust.dob);
      recordStatus('customer.pan', extCust.pan);
      recordStatus('customer.aadhaar', extCust.aadhaar);
      recordStatus('customer.address', extCust.address);
      recordStatus('customer.city', extCust.city);
      recordStatus('customer.district', extCust.district);
      recordStatus('customer.state', extCust.state);
      recordStatus('customer.pincode', extCust.pincode);

      // Policy fields
      recordStatus('policy.insurer', extPol.insurer);
      recordStatus('policy.policyNumber', extPol.policyNumber);
      recordStatus('policy.policyType', extPol.policyType);
      recordStatus('policy.productName', extPol.productName);
      recordStatus('policy.startDate', extPol.startDate);
      recordStatus('policy.endDate', extPol.endDate);
      recordStatus('policy.renewalDate', extPol.renewalDate);
      recordStatus('policy.sumAssured', extPol.sumAssured);
      recordStatus('premium.finalPremium', extPrem.finalPremium);
      recordStatus('premium.basicPremium', extPrem.basicPremium);
      recordStatus('premium.gst', extPrem.gst);

      // Motor fields
      if (extMot) {
        recordStatus('motor.registrationNumber', extMot.registrationNumber);
        recordStatus('motor.make', extMot.make);
        recordStatus('motor.model', extMot.model);
        recordStatus('motor.variant', extMot.variant);
        recordStatus('motor.fuelType', extMot.fuelType);
        recordStatus('motor.cubicCapacity', extMot.cubicCapacity);
        recordStatus('motor.seatingCapacity', extMot.seatingCapacity);
        recordStatus('motor.engineNumber', extMot.engineNumber);
        recordStatus('motor.chassisNumber', extMot.chassisNumber);
        recordStatus('motor.idv', extMot.idv);
        recordStatus('motor.ncb', extMot.ncb);
        recordStatus('motor.ownDamagePremium', extMot.ownDamagePremium);
        recordStatus('motor.thirdPartyPremium', extMot.thirdPartyPremium);
        recordStatus('motor.previousInsurer', extMot.previousInsurer);
        recordStatus('motor.previousPolicyNumber', extMot.previousPolicyNumber);
        recordStatus('motor.financierName', extMot.financierName);
      }

      setFieldStatuses(statuses);

      // Populate draft customer form state
      setCustomerData({
        title: extCust.title?.value || '',
        name: extCust.name?.value || '',
        mobile: extCust.mobile?.value || '',
        email: extCust.email?.value || '',
        dob: extCust.dob?.value ? extCust.dob.value.slice(0, 10) : '',
        gender: extCust.gender?.value || 'male',
        pan: extCust.pan?.value || '',
        aadhaar: extCust.aadhaar?.value || '',
        address: extCust.address?.value || '',
        city: extCust.city?.value || '',
        district: extCust.district?.value || '',
        state: extCust.state?.value || '',
        pincode: extCust.pincode?.value || '',
        customerType: extCust.customerType?.value || 'individual'
      });

      // Populate draft policy form state
      setPolicyData({
        insurer: extPol.insurer?.value || '',
        productName: extPol.productName?.value || '',
        planName: extPol.planName?.value || '',
        policyNumber: extPol.policyNumber?.value || '',
        insuranceType: detectedType,
        insuranceSubtype: detectedSubtype,
        businessType: extPol.businessType?.value || 'new',
        policyType: extPol.policyType?.value || 'Package Policy',
        issueDate: extPol.issueDate?.value ? extPol.issueDate.value.slice(0, 10) : '',
        startDate: extPol.startDate?.value ? extPol.startDate.value.slice(0, 10) : '',
        endDate: extPol.endDate?.value ? extPol.endDate.value.slice(0, 10) : '',
        renewalDate: extPol.renewalDate?.value ? extPol.renewalDate.value.slice(0, 10) : '',
        tenureYears: extPol.tenureYears?.value ? String(extPol.tenureYears.value) : '1',
        sumAssured: extPol.sumAssured?.value || '',
        basicPremium: extPrem.basicPremium?.value || '',
        gst: extPrem.gst?.value || '',
        gstPercentage: extPrem.gstPercentage?.value || '18',
        cess: extPrem.cess?.value || '',
        discount: extPrem.discount?.value || '',
        loading: extPrem.loading?.value || '',
        finalPremium: extPrem.finalPremium?.value || '',
        installmentAmount: extPrem.installmentAmount?.value || '',
        premiumFrequency: 'yearly',
        notes: ''
      });

      // Populate draft motor form state
      if (extMot) {
        setMotorData({
          vehicleType: extMot.vehicleType?.value || 'Private Car',
          vehicleCategory: extMot.vehicleCategory?.value || 'Private Car',
          make: extMot.make?.value || '',
          model: extMot.model?.value || '',
          variant: extMot.variant?.value || '',
          subModel: extMot.subModel?.value || '',
          fuelType: extMot.fuelType?.value || 'Petrol',
          cubicCapacity: extMot.cubicCapacity?.value || '',
          seatingCapacity: extMot.seatingCapacity?.value || '',
          numberOfTyres: extMot.numberOfTyres?.value || '',
          vehicleColor: extMot.vehicleColor?.value || '',
          registrationNumber: extMot.registrationNumber?.value || '',
          registrationDate: extMot.registrationDate?.value ? extMot.registrationDate.value.slice(0, 10) : '',
          registrationState: extMot.registrationState?.value || '',
          registrationCity: extMot.registrationCity?.value || '',
          rtoCode: extMot.rtoCode?.value || '',
          rtoName: extMot.rtoName?.value || '',
          zone: extMot.zone?.value || '',
          manufacturingMonth: extMot.manufacturingMonth?.value || '',
          manufacturingYear: extMot.manufacturingYear?.value || '',
          manufacturingDate: extMot.manufacturingDate?.value ? extMot.manufacturingDate.value.slice(0, 10) : '',
          engineNumber: extMot.engineNumber?.value || '',
          chassisNumber: extMot.chassisNumber?.value || '',
          vinNumber: extMot.vinNumber?.value || '',
          identificationNumber: extMot.identificationNumber?.value || '',
          idv: extMot.idv?.value || '',
          vehicleValue: extMot.vehicleValue?.value || '',
          currentNcbPercentage: extMot.currentNcbPercentage?.value !== undefined && extMot.currentNcbPercentage?.value !== null ? String(extMot.currentNcbPercentage.value) : '',
          previousNcbPercentage: extMot.previousNcbPercentage?.value !== undefined && extMot.previousNcbPercentage?.value !== null ? String(extMot.previousNcbPercentage.value) : '',
          ncbPercentage: extMot.ncb?.value !== undefined && extMot.ncb?.value !== null ? String(extMot.ncb.value) : '0',
          previousPolicyAvailable: extMot.previousPolicyAvailable?.value !== undefined ? extMot.previousPolicyAvailable.value : null,
          previousInsurer: extMot.previousInsurer?.value || '',
          previousPolicyNumber: extMot.previousPolicyNumber?.value || '',
          previousPolicyStartDate: extMot.previousPolicyStartDate?.value ? extMot.previousPolicyStartDate.value.slice(0, 10) : '',
          previousPolicyEndDate: extMot.previousPolicyEndDate?.value ? extMot.previousPolicyEndDate.value.slice(0, 10) : '',
          previousPolicyType: extMot.previousPolicyType?.value || '',
          previousNcb: extMot.previousNcb?.value || '',
          previousIdv: extMot.previousIdv?.value || '',
          activeTpInsurerName: extMot.activeTpInsurerName?.value || '',
          activeTpPolicyNumber: extMot.activeTpPolicyNumber?.value || '',
          activeTpPolicyStartDate: extMot.activeTpPolicyStartDate?.value ? extMot.activeTpPolicyStartDate.value.slice(0, 10) : '',
          activeTpPolicyEndDate: extMot.activeTpPolicyEndDate?.value ? extMot.activeTpPolicyEndDate.value.slice(0, 10) : '',
          tpPremium: extMot.tpPremium?.value || '',
          financed: extMot.financed?.value !== undefined ? extMot.financed.value : null,
          financierName: extMot.financierName?.value || '',
          hypothecation: extMot.hypothecation?.value || '',
          loanProvider: extMot.loanProvider?.value || '',
          addons: extMot.addons || [],
          zeroDepreciation: !!extMot.zeroDepreciation?.value,
          engineProtection: !!extMot.engineProtection?.value,
          roadsideAssistance: !!extMot.roadsideAssistance?.value,
          consumables: !!extMot.consumables?.value,
          returnToInvoice: !!extMot.returnToInvoice?.value,
          ncbProtector: !!extMot.ncbProtector?.value,
          tyreProtector: !!extMot.tyreProtector?.value,
          keyReplacement: !!extMot.keyReplacement?.value,
          personalBelongings: !!extMot.personalBelongings?.value,
          personalAccidentCover: !!extMot.personalAccidentCover?.value,
          ownDamagePremium: extMot.ownDamagePremium?.value || '',
          thirdPartyPremium: extMot.thirdPartyPremium?.value || '',
          personalAccidentPremium: extMot.personalAccidentPremium?.value || '',
          addonPremium: extMot.addonPremium?.value || '',
          discount: extPrem.discount?.value || '',
          loading: extPrem.loading?.value || '',
          cess: extPrem.cess?.value || ''
        });
      }

      // Populate draft broker & payment state
      if (extBroker) {
        setBrokerData({
          brokerAgency: extBroker.brokerAgency?.value || '',
          agentName: extBroker.agentName?.value || '',
          subAgent: extBroker.subAgent?.value || '',
          brokerCode: extBroker.brokerCode?.value || '',
          agentCode: extBroker.agentCode?.value || ''
        });
      }

      if (extPayment) {
        setPaymentData({
          paymentStatus: extPayment.paymentStatus?.value || 'completed',
          paymentMethod: extPayment.paymentMethod?.value || 'Online',
          paymentDate: extPayment.paymentDate?.value ? extPayment.paymentDate.value.slice(0, 10) : '',
          paymentAmount: extPayment.paymentAmount?.value || '',
          transactionReference: extPayment.transactionReference?.value || '',
          receiptNumber: extPayment.receiptNumber?.value || ''
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
        motorData: selectedType === 'motor' ? motorData : undefined,
        brokerDetails: brokerData,
        paymentDetails: paymentData,
        healthDetails: selectedType === 'health' ? healthDetails : undefined,
        lifeDetails: selectedType === 'life' ? lifeDetails : undefined,
        travelDetails: selectedSubtype === 'travel' ? travelDetails : undefined,
        propertyDetails: selectedSubtype === 'home_property' ? propertyDetails : undefined,
        nomineeData,
        insuredMembers: currentSubtypeSchema.entities.hasMembers ? insuredMembers : []
      };

      await apiClient.post(`/agencies/${agencyId}/ocr/${documentId}/confirm-policy`, payload);
      addToast('Policy successfully created and verified!', 'success');
      if (onSaveSuccess) onSaveSuccess();
      handleClose();
    } catch (err) {
      console.error('Confirm policy error:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to save policy', 'danger');
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
              Parsing Document with Docling Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '460px' }}>
              Extracting document structure, 2D tabular schedules, layout hierarchy, and performing subtype-specific classification...
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Docling Extracted
              </span>
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
                {(selectedType === 'motor' ? [
                  { id: 'customer', label: '1. Customer' },
                  { id: 'vehicle', label: '2. Vehicle' },
                  { id: 'policy', label: '3. Policy' },
                  { id: 'coverage', label: '4. Coverage & Add-ons' },
                  { id: 'premium', label: '5. Premium' },
                  { id: 'nominee', label: '6. Nominee' },
                  { id: 'crm', label: '7. Additional / CRM' }
                ] : [
                  { id: 'customer', label: 'Customer Info' },
                  { id: 'policy', label: 'Policy Details' },
                  { id: 'coverage', label: 'Subtype Coverage' },
                  { id: 'premium', label: 'Premium & Tax' },
                  ...(currentSubtypeSchema.entities.hasMembers ? [{ id: 'members', label: `Insured Lives (${insuredMembers.length})` }] : []),
                  { id: 'nominee', label: 'Nominee' },
                  { id: 'crm', label: 'Additional / CRM' }
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Customer / Proposer Full Name *
                        </label>
                        {renderFieldBadge('customer.name')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.name || ''}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma / ABC Logistics Pvt Ltd"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Customer Type
                        </label>
                        {renderFieldBadge('customer.customerType')}
                      </div>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.customerType || 'individual'}
                        onChange={(e) => setCustomerData({ ...customerData, customerType: e.target.value })}
                      >
                        <option value="individual">Individual</option>
                        <option value="corporate">Corporate / Commercial</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Title / Salutation
                        </label>
                        {renderFieldBadge('customer.title')}
                      </div>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.title || 'Mr.'}
                        onChange={(e) => setCustomerData({ ...customerData, title: e.target.value })}
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="M/s">M/s (Company)</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Mobile Number *
                        </label>
                        {renderFieldBadge('customer.mobile')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.mobile || ''}
                        onChange={(e) => setCustomerData({ ...customerData, mobile: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Email Address
                        </label>
                        {renderFieldBadge('customer.email')}
                      </div>
                      <input
                        type="email"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.email || ''}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        placeholder="name@example.com"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          PAN Card Number
                        </label>
                        {renderFieldBadge('customer.pan')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.pan || ''}
                        onChange={(e) => setCustomerData({ ...customerData, pan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Date of Birth
                        </label>
                        {renderFieldBadge('customer.dob')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.dob || ''}
                        onChange={(e) => setCustomerData({ ...customerData, dob: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Gender
                        </label>
                        {renderFieldBadge('customer.gender')}
                      </div>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.gender || 'male'}
                        onChange={(e) => setCustomerData({ ...customerData, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Aadhaar Number
                        </label>
                        {renderFieldBadge('customer.aadhaar')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.aadhaar || ''}
                        onChange={(e) => setCustomerData({ ...customerData, aadhaar: e.target.value })}
                        placeholder="12-digit Aadhaar"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Residential / Postal Address
                        </label>
                        {renderFieldBadge('customer.address')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={customerData.address || ''}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                        placeholder="Flat / House No, Street, Landmark"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          City / District
                        </label>
                        {renderFieldBadge('customer.city')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, fontSize: '13px' }}
                          placeholder="City"
                          value={customerData.city || ''}
                          onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, fontSize: '13px' }}
                          placeholder="District"
                          value={customerData.district || ''}
                          onChange={(e) => setCustomerData({ ...customerData, district: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          State & PIN
                        </label>
                        {renderFieldBadge('customer.state')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ flex: 1, fontSize: '13px' }}
                          placeholder="State"
                          value={customerData.state || ''}
                          onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          style={{ width: '90px', fontSize: '13px' }}
                          placeholder="Pincode"
                          value={customerData.pincode || ''}
                          onChange={(e) => setCustomerData({ ...customerData, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Vehicle Details (For Motor) */}
                {activeTab === 'vehicle' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Vehicle Registration No. *
                        </label>
                        {renderFieldBadge('motor.registrationNumber')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}
                        value={motorData.registrationNumber || ''}
                        onChange={(e) => setMotorData({ ...motorData, registrationNumber: e.target.value.toUpperCase() })}
                        placeholder="MH02EK4921"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Vehicle Category / Type
                        </label>
                        {renderFieldBadge('motor.vehicleCategory')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={motorData.vehicleCategory || motorData.vehicleType || ''}
                        onChange={(e) => setMotorData({ ...motorData, vehicleCategory: e.target.value, vehicleType: e.target.value })}
                        placeholder="Private Car / 4 Wheeler"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Make & Model
                        </label>
                        {renderFieldBadge('motor.make')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Make (e.g. Hyundai)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.make || ''}
                          onChange={(e) => setMotorData({ ...motorData, make: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Model (e.g. Creta)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.model || ''}
                          onChange={(e) => setMotorData({ ...motorData, model: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Variant / Sub-Model
                        </label>
                        {renderFieldBadge('motor.variant')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Variant (e.g. SX (O))"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.variant || ''}
                          onChange={(e) => setMotorData({ ...motorData, variant: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Sub-model"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.subModel || ''}
                          onChange={(e) => setMotorData({ ...motorData, subModel: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Fuel Type & Engine CC
                        </label>
                        {renderFieldBadge('motor.fuelType')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          className="select"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.fuelType || 'petrol'}
                          onChange={(e) => setMotorData({ ...motorData, fuelType: e.target.value })}
                        >
                          <option value="petrol">Petrol</option>
                          <option value="diesel">Diesel</option>
                          <option value="cng">CNG</option>
                          <option value="electric">Electric</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="lpg">LPG</option>
                        </select>
                        <input
                          type="number"
                          className="input"
                          placeholder="CC (e.g. 1497)"
                          style={{ width: '100px', fontSize: '13px' }}
                          value={motorData.cubicCapacity || ''}
                          onChange={(e) => setMotorData({ ...motorData, cubicCapacity: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Seats, Tyres & Color
                        </label>
                        {renderFieldBadge('motor.seatingCapacity')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="number"
                          className="input"
                          placeholder="Seats (5)"
                          style={{ width: '70px', fontSize: '13px' }}
                          value={motorData.seatingCapacity || ''}
                          onChange={(e) => setMotorData({ ...motorData, seatingCapacity: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="Tyres (4)"
                          style={{ width: '70px', fontSize: '13px' }}
                          value={motorData.numberOfTyres || ''}
                          onChange={(e) => setMotorData({ ...motorData, numberOfTyres: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Color (e.g. White)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.vehicleColor || ''}
                          onChange={(e) => setMotorData({ ...motorData, vehicleColor: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Registration Date & State
                        </label>
                        {renderFieldBadge('motor.registrationDate')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="date"
                          className="input"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.registrationDate || ''}
                          onChange={(e) => setMotorData({ ...motorData, registrationDate: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Reg State"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.registrationState || ''}
                          onChange={(e) => setMotorData({ ...motorData, registrationState: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          RTO Code, Name & Zone
                        </label>
                        {renderFieldBadge('motor.rtoCode')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="RTO Code (e.g. MH02)"
                          style={{ width: '80px', fontSize: '13px' }}
                          value={motorData.rtoCode || ''}
                          onChange={(e) => setMotorData({ ...motorData, rtoCode: e.target.value.toUpperCase() })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="RTO Name"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.rtoName || ''}
                          onChange={(e) => setMotorData({ ...motorData, rtoName: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Zone (A/B)"
                          style={{ width: '70px', fontSize: '13px' }}
                          value={motorData.zone || ''}
                          onChange={(e) => setMotorData({ ...motorData, zone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Manufacturing Month & Year
                        </label>
                        {renderFieldBadge('motor.manufacturingYear')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Month (e.g. 05 or May)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.manufacturingMonth || ''}
                          onChange={(e) => setMotorData({ ...motorData, manufacturingMonth: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="Year (e.g. 2023)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.manufacturingYear || ''}
                          onChange={(e) => setMotorData({ ...motorData, manufacturingYear: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Chassis Number (VIN)
                        </label>
                        {renderFieldBadge('motor.chassisNumber')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', textTransform: 'uppercase' }}
                        value={motorData.chassisNumber || ''}
                        onChange={(e) => setMotorData({ ...motorData, chassisNumber: e.target.value.toUpperCase() })}
                        placeholder="17-character VIN/Chassis"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Engine Number
                        </label>
                        {renderFieldBadge('motor.engineNumber')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', textTransform: 'uppercase' }}
                        value={motorData.engineNumber || ''}
                        onChange={(e) => setMotorData({ ...motorData, engineNumber: e.target.value.toUpperCase() })}
                        placeholder="Engine identification number"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          VIN / Other Identification
                        </label>
                        {renderFieldBadge('motor.vinNumber')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', textTransform: 'uppercase' }}
                        value={motorData.vinNumber || motorData.identificationNumber || ''}
                        onChange={(e) => setMotorData({ ...motorData, vinNumber: e.target.value.toUpperCase(), identificationNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Policy Details */}
                {activeTab === 'policy' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Insurance Company / Insurer *
                        </label>
                        {renderFieldBadge('policy.insurer')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.insurer || ''}
                        onChange={(e) => setPolicyData({ ...policyData, insurer: e.target.value })}
                        placeholder="e.g. HDFC ERGO General Insurance Co."
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Policy Number *
                        </label>
                        {renderFieldBadge('policy.policyNumber')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}
                        value={policyData.policyNumber || ''}
                        onChange={(e) => setPolicyData({ ...policyData, policyNumber: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Plan / Product Name
                        </label>
                        {renderFieldBadge('policy.productName')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.productName || ''}
                        onChange={(e) => setPolicyData({ ...policyData, productName: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Policy Type & Class
                        </label>
                        {renderFieldBadge('policy.policyType')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          className="select"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={policyData.policyType || 'comprehensive'}
                          onChange={(e) => setPolicyData({ ...policyData, policyType: e.target.value })}
                        >
                          <option value="comprehensive">Comprehensive / Package</option>
                          <option value="third_party">Third Party Only</option>
                          <option value="own_damage">Standalone Own Damage</option>
                          <option value="bundled">Bundled</option>
                          <option value="term">Term Life</option>
                          <option value="floater">Family Floater</option>
                          <option value="individual">Individual</option>
                        </select>
                        <select
                          className="select"
                          style={{ width: '120px', fontSize: '13px' }}
                          value={policyData.businessType || 'renewal'}
                          onChange={(e) => setPolicyData({ ...policyData, businessType: e.target.value })}
                        >
                          <option value="renewal">Rollover / Renewal</option>
                          <option value="new">New Business</option>
                          <option value="break_in">Break-in</option>
                          <option value="endorsement">Endorsement</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Policy Issue Date
                        </label>
                        {renderFieldBadge('policy.issueDate')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.issueDate || ''}
                        onChange={(e) => setPolicyData({ ...policyData, issueDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Policy Start Date
                        </label>
                        {renderFieldBadge('policy.startDate')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.startDate || ''}
                        onChange={(e) => setPolicyData({ ...policyData, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Policy End Date
                        </label>
                        {renderFieldBadge('policy.endDate')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.endDate || ''}
                        onChange={(e) => setPolicyData({ ...policyData, endDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Next Renewal Due Date *
                        </label>
                        {renderFieldBadge('policy.renewalDate')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.renewalDate || ''}
                        onChange={(e) => setPolicyData({ ...policyData, renewalDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Sum Insured / Sum Assured (INR)
                        </label>
                        {renderFieldBadge('policy.sumAssured')}
                      </div>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
                        value={policyData.sumAssured || ''}
                        onChange={(e) => setPolicyData({ ...policyData, sumAssured: e.target.value })}
                        placeholder="500000"
                      />
                    </div>

                    {/* Section E: Previous Policy (For Motor) */}
                    {selectedType === 'motor' && (
                      <div style={{ gridColumn: 'span 2', marginTop: '8px', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                          Previous Policy Information (Prior Period)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous Insurer
                            </label>
                            <input
                              type="text"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={policyData.previousInsurer || ''}
                              onChange={(e) => setPolicyData({ ...policyData, previousInsurer: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous Policy No.
                            </label>
                            <input
                              type="text"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={policyData.previousPolicyNumber || ''}
                              onChange={(e) => setPolicyData({ ...policyData, previousPolicyNumber: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous Policy Type
                            </label>
                            <input
                              type="text"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={motorData.previousPolicyType || ''}
                              onChange={(e) => setMotorData({ ...motorData, previousPolicyType: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous Start Date
                            </label>
                            <input
                              type="date"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={motorData.previousPolicyStartDate || ''}
                              onChange={(e) => setMotorData({ ...motorData, previousPolicyStartDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous Expiry Date
                            </label>
                            <input
                              type="date"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={motorData.previousPolicyEndDate || ''}
                              onChange={(e) => setMotorData({ ...motorData, previousPolicyEndDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                              Previous NCB (%)
                            </label>
                            <input
                              type="number"
                              className="input"
                              style={{ width: '100%', fontSize: '12px' }}
                              value={motorData.previousNcbPercentage || motorData.previousNcb || ''}
                              onChange={(e) => setMotorData({ ...motorData, previousNcbPercentage: e.target.value, previousNcb: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Coverage & Add-ons */}
                {activeTab === 'coverage' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {selectedType === 'motor' ? (
                      <>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Insured Declared Value - IDV (INR) *
                            </label>
                            {renderFieldBadge('motor.idv')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}
                            value={motorData.idv || ''}
                            onChange={(e) => setMotorData({ ...motorData, idv: e.target.value })}
                            placeholder="e.g. 850000"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Vehicle Value / Ex-Showroom (INR)
                            </label>
                            {renderFieldBadge('motor.vehicleValue')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.vehicleValue || ''}
                            onChange={(e) => setMotorData({ ...motorData, vehicleValue: e.target.value })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Current NCB Discount (%)
                            </label>
                            {renderFieldBadge('motor.ncbPercentage')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px', fontWeight: '600' }}
                            value={motorData.ncbPercentage || motorData.currentNcbPercentage || ''}
                            onChange={(e) => setMotorData({ ...motorData, ncbPercentage: e.target.value, currentNcbPercentage: e.target.value })}
                            placeholder="e.g. 20, 25, 35, 45, 50"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Previous NCB (%)
                            </label>
                            {renderFieldBadge('motor.previousNcbPercentage')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.previousNcbPercentage || motorData.previousNcb || ''}
                            onChange={(e) => setMotorData({ ...motorData, previousNcbPercentage: e.target.value, previousNcb: e.target.value })}
                          />
                        </div>

                        {/* Standalone OD / Active Third Party Details */}
                        <div style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                            Active Third Party (TP) Policy Schedule (For Standalone OD)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                TP Insurer
                              </label>
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.activeTpInsurerName || ''}
                                onChange={(e) => setMotorData({ ...motorData, activeTpInsurerName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                TP Policy Number
                              </label>
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.activeTpPolicyNumber || ''}
                                onChange={(e) => setMotorData({ ...motorData, activeTpPolicyNumber: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                TP Start Date
                              </label>
                              <input
                                type="date"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.activeTpPolicyStartDate || ''}
                                onChange={(e) => setMotorData({ ...motorData, activeTpPolicyStartDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                TP End Date
                              </label>
                              <input
                                type="date"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.activeTpPolicyEndDate || ''}
                                onChange={(e) => setMotorData({ ...motorData, activeTpPolicyEndDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Financing & Hypothecation */}
                        <div style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                            Financing & Hypothecation Details
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                Financed / Hypothecated
                              </label>
                              <select
                                className="select"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.financed === true ? 'yes' : motorData.financed === false ? 'no' : ''}
                                onChange={(e) => setMotorData({ ...motorData, financed: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null })}
                              >
                                <option value="">Not Stated</option>
                                <option value="yes">Yes (Hypothecated)</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                Financier / Bank Name
                              </label>
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.financierName || motorData.loanProvider || ''}
                                onChange={(e) => setMotorData({ ...motorData, financierName: e.target.value, loanProvider: e.target.value })}
                                placeholder="e.g. HDFC Bank Ltd / ICICI Bank"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                                Agreement / Account No
                              </label>
                              <input
                                type="text"
                                className="input"
                                style={{ width: '100%', fontSize: '12px' }}
                                value={motorData.hypothecation || ''}
                                onChange={(e) => setMotorData({ ...motorData, hypothecation: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Add-on Covers Matrix */}
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', display: 'block', marginBottom: '8px' }}>
                            Add-on Covers & Endorsements
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            {[
                              { key: 'zeroDepreciation', label: 'Zero Depreciation (Nil Dep / Bumper to Bumper)' },
                              { key: 'engineProtection', label: 'Engine & Gearbox Protection' },
                              { key: 'roadsideAssistance', label: '24x7 Roadside Assistance (RSA)' },
                              { key: 'consumables', label: 'Consumables Expense Cover' },
                              { key: 'returnToInvoice', label: 'Return to Invoice (RTI)' },
                              { key: 'ncbProtector', label: 'NCB Retention / Protector' },
                              { key: 'tyreProtector', label: 'Tyre & Rim Secure' },
                              { key: 'keyReplacement', label: 'Key & Lock Replacement' },
                              { key: 'personalBelongings', label: 'Loss of Personal Belongings' },
                              { key: 'personalAccidentCover', label: 'Owner-Driver Personal Accident (PA Cover)' }
                            ].map(addon => (
                              <label key={addon.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!motorData[addon.key]}
                                  onChange={(e) => setMotorData({ ...motorData, [addon.key]: e.target.checked })}
                                />
                                <span style={{ fontWeight: motorData[addon.key] ? '600' : '400', color: motorData[addon.key] ? 'var(--color-accent)' : 'var(--color-text-main)' }}>
                                  {addon.label}
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Dynamic Add-ons if parsed */}
                          {motorData.addons && motorData.addons.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                Detected Add-on Breakdown:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {motorData.addons.map((a, idx) => (
                                  <span key={idx} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                                    {a.name || a.code}: ₹{a.premium || 0}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : selectedType === 'health' ? (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Room Rent Limit
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={healthDetails.roomRentLimit || ''}
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
                            value={healthDetails.icuLimit || ''}
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
                            value={healthDetails.coPayment || ''}
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
                            value={selectedSubtype === 'super_top_up' ? (healthDetails.aggregateDeductible || '') : (healthDetails.deductible || '')}
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
                            value={healthDetails.cumulativeBonus || ''}
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
                            value={healthDetails.restorationBenefit || ''}
                            onChange={(e) => setHealthDetails({ ...healthDetails, restorationBenefit: e.target.value })}
                          />
                        </div>
                      </>
                    ) : selectedType === 'life' ? (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            IRDAI UIN Code
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={lifeDetails.uin || ''}
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
                              value={lifeDetails.policyTermYears || ''}
                              onChange={(e) => setLifeDetails({ ...lifeDetails, policyTermYears: e.target.value })}
                            />
                            <input
                              type="number"
                              className="input"
                              placeholder="PPT"
                              style={{ flex: 1, fontSize: '13px' }}
                              value={lifeDetails.premiumPaymentTermYears || ''}
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
                            value={lifeDetails.deathBenefit || ''}
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
                            value={lifeDetails.maturityBenefit || ''}
                            onChange={(e) => setLifeDetails({ ...lifeDetails, maturityBenefit: e.target.value })}
                          />
                        </div>
                      </>
                    ) : selectedSubtype === 'travel' ? (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Passport Number
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={travelDetails.passportNumber || ''}
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
                            value={travelDetails.destinationCountry || ''}
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
                            value={travelDetails.tripDurationDays || ''}
                            onChange={(e) => setTravelDetails({ ...travelDetails, tripDurationDays: e.target.value })}
                          />
                        </div>
                      </>
                    ) : selectedSubtype === 'home_property' ? (
                      <>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)', display: 'block', marginBottom: '3px' }}>
                            Property Address
                          </label>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={propertyDetails.propertyAddress || ''}
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
                            value={propertyDetails.buildingSumInsured || ''}
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
                            value={propertyDetails.contentsSumInsured || ''}
                            onChange={(e) => setPropertyDetails({ ...propertyDetails, contentsSumInsured: e.target.value })}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {/* 5. Premium & Financials */}
                {activeTab === 'premium' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {selectedType === 'motor' && (
                      <>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Basic Own Damage (OD) Premium
                            </label>
                            {renderFieldBadge('motor.ownDamagePremium')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.ownDamagePremium || ''}
                            onChange={(e) => setMotorData({ ...motorData, ownDamagePremium: e.target.value })}
                            placeholder="₹ OD"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Third Party (TP) Premium
                            </label>
                            {renderFieldBadge('motor.thirdPartyPremium')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.thirdPartyPremium || ''}
                            onChange={(e) => setMotorData({ ...motorData, thirdPartyPremium: e.target.value })}
                            placeholder="₹ TP"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Personal Accident (PA) Premium
                            </label>
                            {renderFieldBadge('motor.personalAccidentPremium')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.personalAccidentPremium || ''}
                            onChange={(e) => setMotorData({ ...motorData, personalAccidentPremium: e.target.value })}
                            placeholder="₹ PA"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                              Add-on Covers Premium
                            </label>
                            {renderFieldBadge('motor.addonPremium')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '13px' }}
                            value={motorData.addonPremium || ''}
                            onChange={(e) => setMotorData({ ...motorData, addonPremium: e.target.value })}
                            placeholder="₹ Add-ons"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Basic / Net Premium (excl. GST)
                        </label>
                        {renderFieldBadge('premium.basicPremium')}
                      </div>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.basicPremium || ''}
                        onChange={(e) => setPolicyData({ ...policyData, basicPremium: e.target.value })}
                        placeholder="₹ Net Premium"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Discounts & Loadings
                        </label>
                        {renderFieldBadge('premium.discount')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="number"
                          className="input"
                          placeholder="Discount (-₹)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.discount || ''}
                          onChange={(e) => setMotorData({ ...motorData, discount: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="Loading (+₹)"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={motorData.loading || ''}
                          onChange={(e) => setMotorData({ ...motorData, loading: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          GST (18%) & Cess Amount
                        </label>
                        {renderFieldBadge('premium.gst')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="number"
                          className="input"
                          placeholder="GST Amount"
                          style={{ flex: 1, fontSize: '13px' }}
                          value={policyData.gst || ''}
                          onChange={(e) => setPolicyData({ ...policyData, gst: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input"
                          placeholder="Cess"
                          style={{ width: '80px', fontSize: '13px' }}
                          value={motorData.cess || ''}
                          onChange={(e) => setMotorData({ ...motorData, cess: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>
                          Gross Paid Premium (INR) *
                        </label>
                        {renderFieldBadge('premium.finalPremium')}
                      </div>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '14px', fontWeight: '700', color: '#15803d', borderColor: '#86efac' }}
                        value={policyData.finalPremium || ''}
                        onChange={(e) => setPolicyData({ ...policyData, finalPremium: e.target.value })}
                        placeholder="₹ Total Gross Premium"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Payment Frequency
                        </label>
                        {renderFieldBadge('premium.frequency', 'CRM Default')}
                      </div>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={policyData.premiumFrequency || 'yearly'}
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

                {/* 6. Insured Members (For Health / Floater) */}
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

                {/* 6. Nominee Details */}
                {activeTab === 'nominee' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Nominee Full Name
                        </label>
                        {renderFieldBadge('nominee.name')}
                      </div>
                      <input
                        type="text"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.name || ''}
                        onChange={(e) => setNomineeData({ ...nomineeData, name: e.target.value })}
                        placeholder="e.g. Suman Sharma"
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Relationship with Insured
                        </label>
                        {renderFieldBadge('nominee.relationship')}
                      </div>
                      <select
                        className="select"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.relation || 'Spouse'}
                        onChange={(e) => setNomineeData({ ...nomineeData, relation: e.target.value })}
                      >
                        <option value="Spouse">Spouse / Husband / Wife</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Partner">Partner</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Nominee Date of Birth
                        </label>
                        {renderFieldBadge('nominee.dob')}
                      </div>
                      <input
                        type="date"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.dob || ''}
                        onChange={(e) => setNomineeData({ ...nomineeData, dob: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>
                          Entitlement Share (%)
                        </label>
                        {renderFieldBadge('nominee.share')}
                      </div>
                      <input
                        type="number"
                        className="input"
                        style={{ width: '100%', fontSize: '13px' }}
                        value={nomineeData.share || 100}
                        onChange={(e) => setNomineeData({ ...nomineeData, share: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 7. Additional / CRM Metadata (Broker & Payment Details) */}
                {activeTab === 'crm' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                        Intermediary / Brokerage Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Broker / Agency Name
                            </label>
                            {renderFieldBadge('brokerDetails.brokerAgency')}
                          </div>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={brokerData.brokerAgency || ''}
                            onChange={(e) => setBrokerData({ ...brokerData, brokerAgency: e.target.value })}
                            placeholder="e.g. INSecure Insurance Broking"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Agent / POSP Name
                            </label>
                            {renderFieldBadge('brokerDetails.agentName')}
                          </div>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={brokerData.agentName || ''}
                            onChange={(e) => setBrokerData({ ...brokerData, agentName: e.target.value })}
                            placeholder="Agent Name"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Sub-Agent / Reference
                            </label>
                            {renderFieldBadge('brokerDetails.subAgent')}
                          </div>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={brokerData.subAgent || ''}
                            onChange={(e) => setBrokerData({ ...brokerData, subAgent: e.target.value })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Broker Code / Agent Code
                            </label>
                            {renderFieldBadge('brokerDetails.agentCode')}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="Broker Code"
                              style={{ flex: 1, fontSize: '12px' }}
                              value={brokerData.brokerCode || ''}
                              onChange={(e) => setBrokerData({ ...brokerData, brokerCode: e.target.value })}
                            />
                            <input
                              type="text"
                              className="input"
                              placeholder="Agent Code"
                              style={{ flex: 1, fontSize: '12px' }}
                              value={brokerData.agentCode || ''}
                              onChange={(e) => setBrokerData({ ...brokerData, agentCode: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                        Payment & Receipt Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Payment Status
                            </label>
                            {renderFieldBadge('paymentDetails.paymentStatus')}
                          </div>
                          <select
                            className="select"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.paymentStatus || 'completed'}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentStatus: e.target.value })}
                          >
                            <option value="completed">Completed / Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Payment Mode / Method
                            </label>
                            {renderFieldBadge('paymentDetails.paymentMethod')}
                          </div>
                          <select
                            className="select"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.paymentMethod || 'Online'}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                          >
                            <option value="Online">Online (UPI / NetBanking)</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Cheque">Cheque</option>
                            <option value="NEFT/RTGS">NEFT / RTGS</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Payment Date
                            </label>
                            {renderFieldBadge('paymentDetails.paymentDate')}
                          </div>
                          <input
                            type="date"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.paymentDate || ''}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Payment Amount (INR)
                            </label>
                            {renderFieldBadge('paymentDetails.paymentAmount')}
                          </div>
                          <input
                            type="number"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.paymentAmount || ''}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentAmount: e.target.value })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Transaction Reference / UTR
                            </label>
                            {renderFieldBadge('paymentDetails.transactionReference')}
                          </div>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.transactionReference || ''}
                            onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                            placeholder="UTR / Transaction ID"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                              Receipt Number
                            </label>
                            {renderFieldBadge('paymentDetails.receiptNumber')}
                          </div>
                          <input
                            type="text"
                            className="input"
                            style={{ width: '100%', fontSize: '12px' }}
                            value={paymentData.receiptNumber || ''}
                            onChange={(e) => setPaymentData({ ...paymentData, receiptNumber: e.target.value })}
                          />
                        </div>
                      </div>
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
