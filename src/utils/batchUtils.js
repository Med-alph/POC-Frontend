// Batch and Expiry Utility Functions

export const getExpiryStatus = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiry < 0) {
    return { 
      status: 'expired', 
      color: 'red', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-800',
      text: 'Expired',
      days: Math.abs(daysToExpiry)
    };
  }
  
  if (daysToExpiry <= 30) {
    return { 
      status: 'expiring_soon', 
      color: 'orange', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-800',
      text: 'Expiring Soon',
      days: daysToExpiry
    };
  }
  
  if (daysToExpiry <= 90) {
    return { 
      status: 'expiring_later', 
      color: 'yellow', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800',
      text: 'Expiring Later',
      days: daysToExpiry
    };
  }
  
  return { 
    status: 'good', 
    color: 'green', 
    bgColor: 'bg-green-100', 
    textColor: 'text-green-800',
    text: 'Good',
    days: daysToExpiry
  };
};

export const formatExpiryDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const generateBatchNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BATCH${timestamp}${random}`;
};

export const sortBatchesByExpiry = (batches) => {
  return [...batches].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
};

export const getExpiryStatusIcon = (status) => {
  switch (status) {
    case 'expired':
      return '🔴';
    case 'expiring_soon':
      return '🟠';
    case 'expiring_later':
      return '🟡';
    default:
      return '🟢';
  }
};