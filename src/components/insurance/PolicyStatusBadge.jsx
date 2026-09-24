import React from 'react';

export const PolicyStatusBadge = ({ status }) => {
  let badgeClass = 'badge-neutral';

  switch (status) {
    case 'Active':
      badgeClass = 'badge-success';
      break;
    case 'Expiring Soon':
      badgeClass = 'badge-warning';
      break;
    case 'Expired':
      badgeClass = 'badge-danger';
      break;
    case 'Renewed':
      badgeClass = 'badge-info';
      break;
    default:
      badgeClass = 'badge-neutral';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
