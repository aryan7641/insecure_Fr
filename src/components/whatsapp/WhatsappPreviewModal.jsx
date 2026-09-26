import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-renewal',
    name: 'Policy Renewal Reminder (General)',
    body: 'Dear {{customerName}}, your {{insuranceCompany}} policy (No. {{policyNumber}}) of ₹{{premium}} is due for renewal on {{renewalDate}}. Please renew on time to avoid coverage lapse. For any assistance, feel free to contact {{agentName}}.',
    variables: ['customerName', 'insuranceCompany', 'policyNumber', 'premium', 'renewalDate', 'agentName']
  },
  {
    id: 'tpl-motor',
    name: 'Motor Insurance Renewal Notice',
    body: 'Hi {{customerName}}, your vehicle insurance for {{vehicleNumber}} ({{insuranceCompany}}) is expiring on {{renewalDate}}. Avail your {{ncb}}% No-Claim-Bonus discount by renewing before expiry. Reply to this message or call {{agentName}} to renew.',
    variables: ['customerName', 'vehicleNumber', 'insuranceCompany', 'renewalDate', 'ncb', 'agentName']
  },
  {
    id: 'tpl-health',
    name: 'Health Insurance Due Reminder',
    body: 'Dear {{customerName}}, a friendly reminder that your Health Insurance plan with {{insuranceCompany}} (Sum Insured: ₹{{sumAssured}}) is due for renewal on {{renewalDate}}. Premium: ₹{{premium}}. Maintain continuous waiting-period benefits by renewing today.',
    variables: ['customerName', 'insuranceCompany', 'sumAssured', 'renewalDate', 'premium']
  },
  {
    id: 'tpl-welcome',
    name: 'Welcome & Policy Document Dispatch',
    body: 'Dear {{customerName}}, thank you for choosing our insurance advisory services! Your policy with {{insuranceCompany}} (Policy #{{policyNumber}}) is active. We are always available for any endorsement, claims or servicing requests.',
    variables: ['customerName', 'insuranceCompany', 'policyNumber']
  }
];

export const WhatsappPreviewModal = ({ isOpen, onClose, customer, policy }) => {
  const { currentUser } = useAuth();
  if (!customer) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [templateVars, setTemplateVars] = useState({});
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];

  useEffect(() => {
    const formattedRenewal = policy?.renewalDate 
      ? new Date(policy.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '15 Oct 2026';

    const formattedPremium = policy?.premium || policy?.finalPremium
      ? Number(policy.premium || policy.finalPremium).toLocaleString('en-IN')
      : '25,000';

    const formattedSumAssured = policy?.sumAssured
      ? Number(policy.sumAssured).toLocaleString('en-IN')
      : '10,00,000';

    const vars = {
      customerName: customer.name || 'Customer',
      insuranceCompany: policy?.insuranceCompany || policy?.company || 'HDFC ERGO General Insurance',
      policyNumber: policy?.policyNumber || 'HDFC-HE-998822',
      premium: formattedPremium,
      renewalDate: formattedRenewal,
      sumAssured: formattedSumAssured,
      vehicleNumber: policy?.vehicleDetails?.registrationNumber || 'MH02EK4921',
      ncb: policy?.vehicleDetails?.ncb ? `${policy.vehicleDetails.ncb}` : '25',
      agentName: currentUser?.name || 'Your Dedicated Insurance Advisor'
    };

    setTemplateVars(vars);

    // If policy is motor, auto-select motor template
    if (policy?.policyType === 'motor') {
      setSelectedTemplateId('tpl-motor');
    } else if (policy?.policyType === 'health') {
      setSelectedTemplateId('tpl-health');
    }
  }, [customer, policy, currentUser, selectedTemplateId]);

  const handleVarChange = (varKey, val) => {
    setTemplateVars(prev => ({ ...prev, [varKey]: val }));
  };

  const renderMessageText = () => {
    if (isCustomMode) return customMessage;
    let text = template.body;
    Object.entries(templateVars).forEach(([key, val]) => {
      text = text.replaceAll(`{{${key}}}`, val || '');
    });
    return text;
  };

  const handleOpenWhatsapp = () => {
    const messageText = renderMessageText();
    const rawMobile = customer.mobile || '';
    const cleanMobile = rawMobile.replace(/[^0-9]/g, '').slice(-10);
    const waUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Click-to-WhatsApp (Indian Insurance Templates)" maxWidth="580px">
      <div className="form-group">
        <label className="form-label">Select Predefined Insurance Template</label>
        <select 
          className="form-select" 
          value={selectedTemplateId} 
          onChange={(e) => {
            setSelectedTemplateId(e.target.value);
            setIsCustomMode(false);
          }}
        >
          {DEFAULT_TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Dynamic Variables */}
      <div style={{
        padding: '12px 14px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Template Parameters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {template.variables.map(vKey => (
            <div key={vKey} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{`{{${vKey}}}`}</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '13px' }}
                value={templateVars[vKey] || ''}
                onChange={(e) => handleVarChange(vKey, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Message Preview */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label className="form-label">Live Message Preview</label>
          <button 
            type="button" 
            style={{ fontSize: '11px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              if (!isCustomMode) {
                setCustomMessage(renderMessageText());
                setIsCustomMode(true);
              } else {
                setIsCustomMode(false);
              }
            }}
          >
            {isCustomMode ? 'Reset to Template' : 'Edit Text Directly'}
          </button>
        </div>

        {isCustomMode ? (
          <textarea
            className="form-textarea"
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        ) : (
          <div style={{
            padding: '14px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: '#15803d',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5'
          }}>
            {renderMessageText()}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleOpenWhatsapp} 
          style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
        >
          <MessageSquare size={16} /> Open in WhatsApp <ExternalLink size={14} />
        </button>
      </div>
    </Modal>
  );
};
