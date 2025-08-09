

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeStyle = (status) => {
  const statusStyles = {
    assigntocourier: { backgroundColor: '#dbeafe', color: '#1e40af' },
    completed: { backgroundColor: '#dcfce7', color: '#166534' },
    pending: { backgroundColor: '#fef3c7', color: '#92400e' },
    cancelled: { backgroundColor: '#fee2e2', color: '#dc2626' },
  };
  return statusStyles[status] || { backgroundColor: '#f3f4f6', color: '#374151' };
};

export const getStatusText = (status) => {
  if (status === 'assigntocourier') return 'Ready for Delivery';
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

