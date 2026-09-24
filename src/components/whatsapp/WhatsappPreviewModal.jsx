import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { MOCK_WHATSAPP_TEMPLATES } from '../../api/mockData';

export const WhatsappPreviewModal = ({ isOpen, onClose, customer, policy }) => {
  if (!customer) return null;

  const [selectedTemplateId, setSelectedTemplateId] = useState(MOCK_WHATSAPP_TEMPLATES[0].id);
  const [templateVars, setTemplateVars] = useState({});

  const template = MOCK_WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_WHATSAPP_TEMPLATES[0];

  useEffect(() => {
    // Populate variables automatically from customer & policy context
    setTemplateVars({
      customer_name: customer.name || 'Customer',
      policy_type: policy?.policyType || 'Health Insurance',
      insurer: policy?.company || 'HDFC ERGO',
      renewal_date: policy?.renewalDate || '15 Oct 2026',
      sip_amount: '15,000',
      scheme_name: 'SBI Bluechip Fund',
      sip_date: '5th'
    });
  }, [customer, policy, selectedTemplateId]);

  const handleVarChange = (varKey, val) => {
    setTemplateVars(prev => ({ ...prev, [varKey]: val }));
  };

  // Generate finalized text with {{variable}} replacement
  const renderMessageText = () => {
    let text = template.body;
    Object.entries(templateVars).forEach(([key, val]) => {
      text = text.replaceAll(`{{${key}}}`, val || '');
    });
    return text;
  };

  const handleOpenWhatsapp = () => {
    const messageText = renderMessageText();
    const cleanMobile = customer.mobile.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dispatch WhatsApp Message" maxWidth="560px">
      <div className="form-group">
        <label className="form-label">Select Message Template</label>
        <select 
          className="form-select" 
          value={selectedTemplateId} 
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          {MOCK_WHATSAPP_TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.scope})</option>
          ))}
        </select>
      </div>

      {/* Dynamic Variables Form */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Template Variables
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {template.variables.map(vKey => (
            <div key={vKey} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>{`{{${vKey}}}`}</label>
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

      {/* Message Preview Box */}
      <div className="form-group">
        <label className="form-label">Final Message Preview</label>
        <div style={{
          padding: '14px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          color: '#15803d',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5'
        }}>
          {renderMessageText()}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleOpenWhatsapp} style={{ backgroundColor: '#25D366' }}>
          <MessageSquare size={16} /> Open in WhatsApp Web/App <ExternalLink size={14} />
        </button>
      </div>
    </Modal>
  );
};
