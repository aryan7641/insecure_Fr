// Indian Insurance CRM formatting utilities

export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

export const getDaysRemaining = (targetDate) => {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getLOBBadge = (lob) => {
  const norm = (lob || '').toLowerCase();
  switch (norm) {
    case 'health':
      return { label: 'Health', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    case 'motor':
    case 'vehicle':
    case 'auto':
      return { label: 'Motor', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'life':
      return { label: 'Life', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
    case 'term':
      return { label: 'Term Life', bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe' };
    case 'travel':
      return { label: 'Travel', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
    case 'home':
      return { label: 'Home', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
    case 'commercial':
    case 'corporate':
      return { label: 'Commercial', bg: '#f8fafc', color: '#334155', border: '#cbd5e1' };
    case 'group':
      return { label: 'Group Insurance', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' };
    default:
      return { label: lob || 'General', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
};
