// Mock Data for INSecure Financial CRM (India Context - INR Currency)

export const MOCK_AGENCIES = [
  { id: 'agency-1', name: 'Apex Wealth & Insurance Advisors', code: 'APEX01', role: 'Admin' },
  { id: 'agency-2', name: 'SecureLife Financial Services', code: 'SECU02', role: 'Admin' },
];

export const MOCK_USERS = [
  { id: 'user-admin-1', name: 'Vikramaditya Verma', email: 'admin@apexwealth.in', role: 'Admin', agencyId: 'agency-1' },
  { id: 'user-agent-1', name: 'Priya Sundaram', email: 'priya@apexwealth.in', role: 'Agent', agencyId: 'agency-1' },
  { id: 'user-agent-2', name: 'Amitabh Sharma', email: 'amit@apexwealth.in', role: 'Agent', agencyId: 'agency-1' },
];

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-101',
    agencyId: 'agency-1',
    name: 'Rahul Sharma',
    mobile: '9876543210',
    email: 'rahul.sharma@example.com',
    dob: '1985-06-15',
    pan: 'ABCPS1234F',
    aadhaar: '4521 8890 1234',
    address: 'Flat 402, Green Glen Heights, HSR Layout, Bengaluru, KA - 560102',
    occupation: 'Senior Software Architect',
    annualIncome: 3200000,
    assignedAgentId: 'user-agent-1',
    assignedAgentName: 'Priya Sundaram',
    nominees: [
      { name: 'Sunita Sharma', relation: 'Spouse', age: 36, share: 100 }
    ],
    familyMembers: [
      { name: 'Sunita Sharma', relation: 'Spouse', dob: '1988-09-20' },
      { name: 'Aarav Sharma', relation: 'Son', dob: '2015-03-10' }
    ],
    insuranceSummary: { activePolicies: 2, totalPremium: 68000 },
    mfSummary: { currentPortfolioValue: 1420000, totalInvested: 1100000, activeSips: 3, totalSipAmount: 35000 }
  },
  {
    id: 'cust-102',
    agencyId: 'agency-1',
    name: 'Meera Deshmukh',
    mobile: '9820123456',
    email: 'meera.d@example.com',
    dob: '1990-11-04',
    pan: 'BMZPD9876K',
    aadhaar: '9812 3456 7890',
    address: 'B-12, Sagar Darshan, Worli, Mumbai, MH - 400018',
    occupation: 'Marketing Director',
    annualIncome: 2800000,
    assignedAgentId: 'user-agent-1',
    assignedAgentName: 'Priya Sundaram',
    nominees: [
      { name: 'Rohan Deshmukh', relation: 'Brother', age: 31, share: 100 }
    ],
    familyMembers: [],
    insuranceSummary: { activePolicies: 1, totalPremium: 45000 },
    mfSummary: { currentPortfolioValue: 850000, totalInvested: 700000, activeSips: 2, totalSipAmount: 20000 }
  },
  {
    id: 'cust-103',
    agencyId: 'agency-1',
    name: 'Rajesh Nair',
    mobile: '9447112233',
    email: 'rajesh.nair@example.com',
    dob: '1978-02-28',
    pan: 'CLKPN4321M',
    aadhaar: '1122 3344 5566',
    address: 'G-7, Jawahar Nagar, Kochi, KL - 682020',
    occupation: 'Business Owner',
    annualIncome: 4500000,
    assignedAgentId: 'user-agent-2',
    assignedAgentName: 'Amitabh Sharma',
    nominees: [
      { name: 'Anitha Nair', relation: 'Spouse', age: 44, share: 100 }
    ],
    familyMembers: [
      { name: 'Anitha Nair', relation: 'Spouse', dob: '1980-04-12' },
      { name: 'Riya Nair', relation: 'Daughter', dob: '2008-07-25' }
    ],
    insuranceSummary: { activePolicies: 3, totalPremium: 125000 },
    mfSummary: { currentPortfolioValue: 3400000, totalInvested: 2600000, activeSips: 4, totalSipAmount: 60000 }
  }
];

export const MOCK_POLICIES = [
  {
    id: 'pol-201',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    policyNumber: 'HDFC-HE-998822',
    company: 'HDFC ERGO General Insurance',
    policyType: 'Health Insurance (Optima Secure)',
    premium: 28000,
    frequency: 'Annual',
    startDate: '2023-11-15',
    renewalDate: '2026-10-15', // Within 30 days of late Sept
    status: 'Expiring Soon',
    sumAssured: 1000000,
    nominee: 'Sunita Sharma',
    assignedAgentName: 'Priya Sundaram'
  },
  {
    id: 'pol-202',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    policyNumber: 'TATA-AIA-334411',
    company: 'Tata AIA Life Insurance',
    policyType: 'Term Life Insurance',
    premium: 40000,
    frequency: 'Annual',
    startDate: '2022-04-10',
    renewalDate: '2027-04-10',
    status: 'Active',
    sumAssured: 20000000,
    nominee: 'Sunita Sharma',
    assignedAgentName: 'Priya Sundaram'
  },
  {
    id: 'pol-203',
    agencyId: 'agency-1',
    customerId: 'cust-102',
    customerName: 'Meera Deshmukh',
    policyNumber: 'STAR-COMP-771122',
    company: 'Star Health Insurance',
    policyType: 'Comprehensive Health Plan',
    premium: 45000,
    frequency: 'Annual',
    startDate: '2024-01-20',
    renewalDate: '2026-10-05', // Within 30 days
    status: 'Expiring Soon',
    sumAssured: 1500000,
    nominee: 'Rohan Deshmukh',
    assignedAgentName: 'Priya Sundaram'
  }
];

export const MOCK_MUTUAL_FUNDS = [
  {
    id: 'mf-301',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    folioNumber: '1098273645',
    amc: 'SBI Mutual Fund',
    schemeName: 'SBI Bluechip Fund - Direct Growth',
    schemeCode: '102837',
    investedAmount: 500000,
    currentValue: 680000,
    units: 8245.12,
    latestNav: 82.47,
    navDate: '2026-09-22'
  },
  {
    id: 'mf-302',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    folioNumber: '9182736450',
    amc: 'HDFC Mutual Fund',
    schemeName: 'HDFC Mid-Cap Opportunities Fund - Growth',
    schemeCode: '119283',
    investedAmount: 600000,
    currentValue: 740000,
    units: 5410.50,
    latestNav: 136.77,
    navDate: '2026-09-22'
  }
];

export const MOCK_SIPS = [
  {
    id: 'sip-401',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    folioNumber: '1098273645',
    amc: 'SBI Mutual Fund',
    schemeName: 'SBI Bluechip Fund - Direct Growth',
    amount: 15000,
    frequency: 'Monthly',
    sipDate: 5, // 5th of every month
    startDate: '2023-01-05',
    status: 'Active',
    assignedAgentName: 'Priya Sundaram'
  },
  {
    id: 'sip-402',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    folioNumber: '9182736450',
    amc: 'HDFC Mutual Fund',
    schemeName: 'HDFC Mid-Cap Opportunities Fund - Growth',
    amount: 20000,
    frequency: 'Monthly',
    sipDate: 10, // 10th of every month
    startDate: '2023-03-10',
    status: 'Active',
    assignedAgentName: 'Priya Sundaram'
  }
];

export const MOCK_FOLLOWUPS = [
  {
    id: 'fol-501',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    assignedAgentId: 'user-agent-1',
    assignedAgentName: 'Priya Sundaram',
    policyNumber: 'HDFC-HE-998822',
    title: 'Health Policy Renewal Discussion',
    dueDate: '2026-09-24', // Due today
    status: 'Pending',
    notes: 'Auto-generated renewal follow-up for policy HDFC-HE-998822 expiring on 15 Oct 2026.',
    type: 'Renewal'
  },
  {
    id: 'fol-502',
    agencyId: 'agency-1',
    customerId: 'cust-102',
    customerName: 'Meera Deshmukh',
    assignedAgentId: 'user-agent-1',
    assignedAgentName: 'Priya Sundaram',
    policyNumber: 'STAR-COMP-771122',
    title: 'Star Health Premium Payment Followup',
    dueDate: '2026-09-20', // Overdue
    status: 'Overdue',
    notes: 'Customer asked to call back after salary credit.',
    type: 'Manual'
  }
];

export const MOCK_DOCUMENTS = [
  {
    id: 'doc-601',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    fileName: 'Rahul_PAN_Card.pdf',
    category: 'PAN',
    fileType: 'PDF',
    size: '1.2 MB',
    uploadedAt: '2026-09-10',
    status: 'Confirmed',
    ocrExtracted: {
      panNumber: 'ABCPS1234F',
      nameOnCard: 'RAHUL SHARMA',
      dob: '1985-06-15'
    }
  },
  {
    id: 'doc-602',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    fileName: 'HDFC_Health_Policy_Scan.jpg',
    category: 'Policy Document',
    fileType: 'JPG',
    size: '2.4 MB',
    uploadedAt: '2026-09-22',
    status: 'Pending Verification',
    ocrExtracted: {
      policyNumber: 'HDFC-HE-998822',
      insurer: 'HDFC ERGO General Insurance',
      premium: '28000',
      renewalDate: '2026-10-15'
    }
  }
];

export const MOCK_WHATSAPP_TEMPLATES = [
  {
    id: 'tpl-701',
    agencyId: 'agency-1',
    name: 'Insurance Renewal Reminder',
    scope: 'Agency-wide',
    body: 'Dear {{customer_name}}, your {{policy_type}} policy ({{insurer}}) is due for renewal on {{renewal_date}}. Please connect with us to ensure unbroken coverage.',
    variables: ['customer_name', 'policy_type', 'insurer', 'renewal_date']
  },
  {
    id: 'tpl-702',
    agencyId: 'agency-1',
    name: 'SIP Installment Reminder',
    scope: 'Agent-specific',
    body: 'Hi {{customer_name}}, a gentle reminder that your monthly SIP of ₹{{sip_amount}} in {{scheme_name}} is due on {{sip_date}}.',
    variables: ['customer_name', 'sip_amount', 'scheme_name', 'sip_date']
  }
];

export const MOCK_ACTIVITY = [
  {
    id: 'act-801',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    agentName: 'Priya Sundaram',
    action: 'Document Uploaded',
    details: 'Uploaded HDFC_Health_Policy_Scan.jpg under Policy Document category',
    timestamp: '2026-09-22 14:30'
  },
  {
    id: 'act-802',
    agencyId: 'agency-1',
    customerId: 'cust-101',
    customerName: 'Rahul Sharma',
    agentName: 'System',
    action: 'Renewal Follow-up Created',
    details: 'Created automatic 30-day renewal follow-up for HDFC-HE-998822',
    timestamp: '2026-09-15 06:00'
  }
];
