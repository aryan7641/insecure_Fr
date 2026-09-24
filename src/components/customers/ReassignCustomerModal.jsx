import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { MOCK_USERS } from '../../api/mockData';
import { useToast } from '../../context/ToastContext';

export const ReassignCustomerModal = ({ isOpen, onClose, customer, onReassignSuccess }) => {
  const { addToast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState('');

  if (!customer) return null;

  const agents = MOCK_USERS.filter(u => u.role === 'Agent');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    const newAgent = agents.find(a => a.id === selectedAgentId);
    addToast(`Customer ${customer.name} reassigned to ${newAgent?.name}`, 'success');
    if (onReassignSuccess) onReassignSuccess(customer.id, newAgent);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reassign Customer Agent" maxWidth="480px">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          <div>Customer: <strong>{customer.name}</strong></div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Currently Assigned: {customer.assignedAgentName}</div>
        </div>

        <div className="form-group">
          <label className="form-label">Select Target Agent *</label>
          <select 
            className="form-select" 
            required 
            value={selectedAgentId} 
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            <option value="">-- Choose Agent --</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!selectedAgentId}>
            <UserCheck size={16} /> Reassign Customer
          </button>
        </div>
      </form>
    </Modal>
  );
};
