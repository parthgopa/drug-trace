// Utility functions for formatting data

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRole = (role) => {
  if (!role) return 'N/A';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    pending: 'text-yellow-600 bg-yellow-100',
    accepted: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100',
    resolved: 'text-blue-600 bg-blue-100',
    genuine: 'text-green-600 bg-green-100',
    fake: 'text-red-600 bg-red-100',
    expired: 'text-orange-600 bg-orange-100',
    recalled: 'text-purple-600 bg-purple-100',
  };
  return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-100';
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    admin: 'text-purple-700 bg-purple-100',
    owner: 'text-blue-700 bg-blue-100',
    manufacturer: 'text-green-700 bg-green-100',
    distributor: 'text-yellow-700 bg-yellow-100',
    retailer: 'text-orange-700 bg-orange-100',
    customer: 'text-gray-700 bg-gray-100',
  };
  return colors[role?.toLowerCase()] || 'text-gray-700 bg-gray-100';
};
