/**
 * INSecure Frontend Subtype-Specific Schema Registry
 * Supports all 22 Phase 1 Insurance Subtypes for Dynamic Forms and OCR Review.
 */

export const SUBTYPE_SCHEMAS = {
  // Health (8)
  'individual_health': {
    type: 'health',
    subtype: 'individual_health',
    name: 'Individual Health Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'premium', 'members', 'nominee'],
    customFields: [
      { key: 'health.roomRentLimit', label: 'Room Rent Limit', type: 'text', category: 'coverage', placeholder: 'e.g. 1% of SI or No Capping' },
      { key: 'health.icuLimit', label: 'ICU Limit', type: 'text', category: 'coverage', placeholder: 'e.g. 2% of SI or No Capping' },
      { key: 'health.coPayment', label: 'Co-Payment (%)', type: 'text', category: 'coverage', placeholder: 'e.g. 0% or 10%' },
      { key: 'health.deductible', label: 'Deductible (INR)', type: 'currency', category: 'coverage' },
      { key: 'health.waitingPeriodPreExisting', label: 'PED Waiting (Months)', type: 'number', category: 'coverage', placeholder: '24 or 36' },
      { key: 'health.noClaimBonus', label: 'Cumulative Bonus / NCB (INR)', type: 'currency', category: 'coverage' },
      { key: 'health.restorationBenefit', label: 'Restoration Benefit', type: 'text', category: 'coverage', placeholder: '100% Once a year' }
    ]
  },
  'family_floater': {
    type: 'health',
    subtype: 'family_floater',
    name: 'Family Floater Health Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'members', 'premium', 'nominee'],
    customFields: [
      { key: 'health.familySize', label: 'Family Composition (e.g. 2A+2C)', type: 'text', category: 'coverage', placeholder: '2 Adults + 2 Children' },
      { key: 'health.roomRentLimit', label: 'Room Rent Limit', type: 'text', category: 'coverage' },
      { key: 'health.icuLimit', label: 'ICU Limit', type: 'text', category: 'coverage' },
      { key: 'health.coPayment', label: 'Co-Payment (%)', type: 'text', category: 'coverage' },
      { key: 'health.waitingPeriodPreExisting', label: 'PED Waiting (Months)', type: 'number', category: 'coverage' },
      { key: 'health.noClaimBonus', label: 'Cumulative Bonus (INR)', type: 'currency', category: 'coverage' },
      { key: 'health.restorationBenefit', label: 'Restoration Benefit', type: 'text', category: 'coverage' }
    ]
  },
  'senior_citizen_health': {
    type: 'health',
    subtype: 'senior_citizen_health',
    name: 'Senior Citizen Health Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'members', 'premium', 'nominee'],
    customFields: [
      { key: 'health.entryAge', label: 'Entry Age (Years)', type: 'number', category: 'coverage' },
      { key: 'health.coPayment', label: 'Mandatory Co-Payment (%)', type: 'text', category: 'coverage', placeholder: 'e.g. 20%' },
      { key: 'health.diseaseSpecificLimits', label: 'Disease Sub-Limits', type: 'text', category: 'coverage', placeholder: 'e.g. Cataract ₹40k, Knee ₹1L' },
      { key: 'health.waitingPeriodPreExisting', label: 'PED Waiting (Months)', type: 'number', category: 'coverage' }
    ]
  },
  'group_health': {
    type: 'health',
    subtype: 'group_health',
    name: 'Group Health Insurance (GMC)',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'members', 'premium', 'nominee'],
    customFields: [
      { key: 'health.employerName', label: 'Corporate Employer Name', type: 'text', category: 'policy' },
      { key: 'health.masterPolicyNumber', label: 'Master Policy Number', type: 'text', category: 'policy' },
      { key: 'health.employeeId', label: 'Employee Code', type: 'text', category: 'customer' },
      { key: 'health.maternityCover', label: 'Maternity Cover (INR)', type: 'currency', category: 'coverage' }
    ]
  },
  'critical_illness': {
    type: 'health',
    subtype: 'critical_illness',
    name: 'Critical Illness Insurance',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'premium', 'nominee'],
    customFields: [
      { key: 'health.numberOfIllnessesCovered', label: 'Illnesses Covered Count', type: 'number', category: 'coverage', placeholder: 'e.g. 36 illnesses' },
      { key: 'health.survivalPeriodDays', label: 'Survival Period (Days)', type: 'number', category: 'coverage', placeholder: '30 days' },
      { key: 'health.waitingPeriodDays', label: 'Waiting Period (Days)', type: 'number', category: 'coverage', placeholder: '90 days' }
    ]
  },
  'top_up': {
    type: 'health',
    subtype: 'top_up',
    name: 'Top-up Health Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'members', 'premium', 'nominee'],
    customFields: [
      { key: 'health.thresholdDeductible', label: 'Per-Claim Deductible (INR)', type: 'currency', category: 'coverage', required: true, placeholder: 'e.g. 500000' },
      { key: 'health.topUpSumInsured', label: 'Top-up Additional Sum Insured (INR)', type: 'currency', category: 'coverage' }
    ]
  },
  'super_top_up': {
    type: 'health',
    subtype: 'super_top_up',
    name: 'Super Top-up Health Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'members', 'premium', 'nominee'],
    customFields: [
      { key: 'health.aggregateDeductible', label: 'Annual Aggregate Deductible (INR)', type: 'currency', category: 'coverage', required: true, placeholder: 'e.g. 500000 cumulative' },
      { key: 'health.topUpSumInsured', label: 'Super Top-up Sum Insured (INR)', type: 'currency', category: 'coverage' }
    ]
  },
  'personal_accident': {
    type: 'health',
    subtype: 'personal_accident',
    name: 'Personal Accident Insurance',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'coverage', 'premium', 'nominee'],
    customFields: [
      { key: 'health.accidentalDeathSum', label: 'Accidental Death Sum (INR)', type: 'currency', category: 'coverage' },
      { key: 'health.permanentTotalDisability', label: 'Permanent Total Disability (%)', type: 'text', category: 'coverage', placeholder: '100% - 150%' },
      { key: 'health.temporaryTotalDisability', label: 'Temporary Total Disability (Weekly)', type: 'currency', category: 'coverage' }
    ]
  },

  // Motor (3)
  'car': {
    type: 'motor',
    subtype: 'car',
    name: 'Car Insurance (Private 4-Wheeler)',
    entities: { hasMembers: false, hasVehicle: true, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'vehicle', 'policy', 'coverage', 'premium', 'nominee', 'crm'],
    customFields: []
  },
  'two_wheeler': {
    type: 'motor',
    subtype: 'two_wheeler',
    name: 'Two-Wheeler Insurance',
    entities: { hasMembers: false, hasVehicle: true, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'vehicle', 'policy', 'coverage', 'premium', 'nominee', 'crm'],
    customFields: []
  },
  'commercial_vehicle': {
    type: 'motor',
    subtype: 'commercial_vehicle',
    name: 'Commercial Vehicle Insurance',
    entities: { hasMembers: false, hasVehicle: true, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'vehicle', 'policy', 'coverage', 'premium', 'nominee', 'crm'],
    customFields: [
      { key: 'motor.gvw', label: 'Gross Vehicle Weight (GVW Kg)', type: 'number', category: 'motor' },
      { key: 'motor.carryingCapacity', label: 'Carrying Capacity (Tons)', type: 'number', category: 'motor' },
      { key: 'motor.passengerCapacity', label: 'Passenger Capacity', type: 'number', category: 'motor' },
      { key: 'motor.permitType', label: 'Permit Type', type: 'text', category: 'motor', placeholder: 'National / State Permit' }
    ]
  },

  // Life (9)
  'term': {
    type: 'life',
    subtype: 'term',
    name: 'Term Life Insurance (Pure Protection)',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.uin', label: 'IRDAI UIN Code', type: 'text', category: 'policy' },
      { key: 'life.policyTermYears', label: 'Policy Term (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.smokerStatus', label: 'Smoker Status', type: 'select', category: 'life', options: [{ label: 'Non-Smoker', value: 'non_smoker' }, { label: 'Smoker', value: 'smoker' }] },
      { key: 'life.accidentalDeathRider', label: 'Accidental Death Rider (INR)', type: 'currency', category: 'life' },
      { key: 'life.criticalIllnessRider', label: 'Critical Illness Rider (INR)', type: 'currency', category: 'life' }
    ]
  },
  'term_return_of_premium': {
    type: 'life',
    subtype: 'term_return_of_premium',
    name: 'Term with Return of Premium (TROP)',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.policyTermYears', label: 'Policy Term (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.maturityDate', label: 'Maturity Date', type: 'date', category: 'life' },
      { key: 'life.maturityAmount', label: 'Maturity Refund Amount (INR)', type: 'currency', category: 'life' }
    ]
  },
  'whole_life': {
    type: 'life',
    subtype: 'whole_life',
    name: 'Whole Life Insurance',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.maturityAge', label: 'Maturity Age (e.g. 100)', type: 'number', category: 'life' },
      { key: 'life.guaranteedAdditions', label: 'Guaranteed Additions (INR)', type: 'currency', category: 'life' }
    ]
  },
  'endowment': {
    type: 'life',
    subtype: 'endowment',
    name: 'Endowment Plan',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.policyTermYears', label: 'Policy Term (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.maturityDate', label: 'Maturity Date', type: 'date', category: 'life', required: true },
      { key: 'life.guaranteedMaturityBenefit', label: 'Guaranteed Maturity Benefit (INR)', type: 'currency', category: 'life' }
    ]
  },
  'money_back': {
    type: 'life',
    subtype: 'money_back',
    name: 'Money Back Plan',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.policyTermYears', label: 'Policy Term (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.survivalBenefitSchedule', label: 'Survival Payout Schedule', type: 'text', category: 'life', placeholder: 'e.g. 20% at 5th, 10th year' }
    ]
  },
  'ulip': {
    type: 'life',
    subtype: 'ulip',
    name: 'Unit Linked Insurance Plan (ULIP)',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.policyTermYears', label: 'Policy Term (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.premiumPaymentTermYears', label: 'PPT (Years)', type: 'number', category: 'life', required: true },
      { key: 'life.fundName', label: 'Fund Name', type: 'text', category: 'life', placeholder: 'e.g. Multi Cap Growth Fund' },
      { key: 'life.unitsHeld', label: 'Units Count', type: 'number', category: 'life' },
      { key: 'life.nav', label: 'Unit NAV (INR)', type: 'currency', category: 'life' },
      { key: 'life.totalFundValue', label: 'Current Fund Value (INR)', type: 'currency', category: 'life' }
    ]
  },
  'child_insurance': {
    type: 'life',
    subtype: 'child_insurance',
    name: 'Child Insurance Plan',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.childName', label: "Child's Full Name", type: 'text', category: 'life', required: true },
      { key: 'life.childDob', label: "Child's DOB", type: 'date', category: 'life', required: true },
      { key: 'life.childAge', label: "Child's Age", type: 'number', category: 'life' },
      { key: 'life.educationMilestoneBenefit', label: 'Milestone Education Payout Schedule', type: 'text', category: 'life' }
    ]
  },
  'pension_annuity': {
    type: 'life',
    subtype: 'pension_annuity',
    name: 'Pension / Annuity Plan',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.annuityType', label: 'Annuity Type', type: 'select', category: 'life', options: [{ label: 'Immediate Annuity', value: 'immediate' }, { label: 'Deferred Annuity', value: 'deferred' }] },
      { key: 'life.annuityAmount', label: 'Guaranteed Annuity / Pension (INR)', type: 'currency', category: 'life', required: true },
      { key: 'life.annuityCommencementDate', label: 'Annuity Start Date', type: 'date', category: 'life', required: true },
      { key: 'life.returnOfPurchasePrice', label: 'Return of Purchase Price to Nominee', type: 'boolean', category: 'life' }
    ]
  },
  'group_life': {
    type: 'life',
    subtype: 'group_life',
    name: 'Group Life / Group Term (GTL)',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: true, hasTravelDetails: false, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'life', 'premium', 'nominee'],
    customFields: [
      { key: 'life.masterPolicyNumber', label: 'Master Policy Number', type: 'text', category: 'policy' },
      { key: 'life.employerName', label: 'Corporate Group / Employer', type: 'text', category: 'policy' },
      { key: 'life.employeeId', label: 'Member / Employee Code', type: 'text', category: 'customer' }
    ]
  },

  // General (2)
  'travel': {
    type: 'general',
    subtype: 'travel',
    name: 'Travel Insurance',
    entities: { hasMembers: true, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: true, hasPropertyDetails: false },
    sections: ['customer', 'policy', 'travel', 'coverage', 'premium', 'nominee'],
    customFields: [
      { key: 'travel.passportNumber', label: 'Passport Number', type: 'text', category: 'travel', required: true },
      { key: 'travel.destinationCountry', label: 'Destination Country / Zone', type: 'text', category: 'travel', required: true, placeholder: 'e.g. USA, Schengen' },
      { key: 'travel.tripDurationDays', label: 'Trip Duration (Days)', type: 'number', category: 'travel', required: true },
      { key: 'travel.medicalExpensesLimit', label: 'Medical Evacuation / Cover (USD)', type: 'text', category: 'coverage', placeholder: '$100,000' }
    ]
  },
  'home_property': {
    type: 'general',
    subtype: 'home_property',
    name: 'Home / Property Insurance',
    entities: { hasMembers: false, hasVehicle: false, hasLifeDetails: false, hasTravelDetails: false, hasPropertyDetails: true },
    sections: ['customer', 'policy', 'property', 'coverage', 'premium', 'nominee'],
    customFields: [
      { key: 'property.propertyAddress', label: 'Property Address', type: 'text', category: 'property', required: true },
      { key: 'property.propertyType', label: 'Structure Type', type: 'select', category: 'property', options: [{ label: 'Apartment / Flat', value: 'flat' }, { label: 'Independent Villa / House', value: 'villa' }] },
      { key: 'property.buildingSumInsured', label: 'Building Structure Sum Insured (INR)', type: 'currency', category: 'coverage', required: true },
      { key: 'property.contentsSumInsured', label: 'Home Contents Sum Insured (INR)', type: 'currency', category: 'coverage' }
    ]
  }
};

export const getSubtypeSchema = (subtypeCode) => {
  if (!subtypeCode) return SUBTYPE_SCHEMAS['individual_health'];
  const code = subtypeCode.toLowerCase().trim();
  return SUBTYPE_SCHEMAS[code] || SUBTYPE_SCHEMAS['individual_health'];
};
