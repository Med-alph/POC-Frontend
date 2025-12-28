/**
 * Utility functions for Excel file processing and validation
 */

export const validateInventoryRow = (row, rowIndex) => {
  const errors = [];
  
  // Required fields validation
  if (!row.name && !row.Name) {
    errors.push(`Row ${rowIndex + 2}: Name is required`);
  }
  
  if (!row.category && !row.Category) {
    errors.push(`Row ${rowIndex + 2}: Category is required`);
  }
  
  if (!row.unit && !row.Unit) {
    errors.push(`Row ${rowIndex + 2}: Unit is required`);
  }
  
  // Numeric field validation
  const reorderLevel = row.reorder_level || row['Reorder Level'];
  if (reorderLevel && isNaN(Number(reorderLevel))) {
    errors.push(`Row ${rowIndex + 2}: Reorder level must be a number`);
  }
  
  const costPerUnit = row.cost_per_unit || row['Cost Per Unit'];
  if (costPerUnit && isNaN(Number(costPerUnit))) {
    errors.push(`Row ${rowIndex + 2}: Cost per unit must be a number`);
  }
  
  const currentStock = row.current_stock || row['Current Stock'];
  if (currentStock && isNaN(Number(currentStock))) {
    errors.push(`Row ${rowIndex + 2}: Current stock must be a number`);
  }
  
  return errors;
};

export const normalizeInventoryData = (rawData) => {
  return rawData.map((row, index) => {
    const normalized = {
      name: row.name || row.Name || '',
      sku: row.sku || row.SKU || '',
      category: row.category || row.Category || '',
      unit: row.unit || row.Unit || '',
      reorder_level: Number(row.reorder_level || row['Reorder Level'] || 0),
      cost_per_unit: Number(row.cost_per_unit || row['Cost Per Unit'] || 0),
      current_stock: Number(row.current_stock || row['Current Stock'] || 0),
      description: row.description || row.Description || ''
    };
    
    // Add row index for error tracking
    normalized._rowIndex = index + 2; // +2 because Excel rows start at 1 and we have header
    
    return normalized;
  });
};

export const generateSampleExcelData = () => {
  return [
    {
      name: "Paracetamol 500mg",
      sku: "MED-PAR-500",
      category: "Medicines",
      unit: "tablets",
      reorder_level: 200,
      cost_per_unit: 0.50,
      current_stock: 100,
      description: "Pain relief medication"
    },
    {
      name: "Surgical Gloves",
      sku: "SUP-GLV-001", 
      category: "Supplies",
      unit: "pairs",
      reorder_level: 50,
      cost_per_unit: 2.00,
      current_stock: 25,
      description: "Disposable surgical gloves"
    },
    {
      name: "Bandages",
      sku: "SUP-BND-001",
      category: "Supplies", 
      unit: "rolls",
      reorder_level: 30,
      cost_per_unit: 1.50,
      current_stock: 15,
      description: "Medical bandages"
    },
    {
      name: "Syringes 5ml",
      sku: "SUP-SYR-005",
      category: "Supplies",
      unit: "pieces",
      reorder_level: 100,
      cost_per_unit: 0.75,
      current_stock: 50,
      description: "Disposable syringes 5ml"
    },
    {
      name: "Antiseptic Solution",
      sku: "MED-ANT-001",
      category: "Medicines",
      unit: "bottles",
      reorder_level: 20,
      cost_per_unit: 5.00,
      current_stock: 10,
      description: "Antiseptic solution for wound cleaning"
    }
  ];
};

export const validateExcelFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return errors;
  }
  
  // Check file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Please select an Excel file (.xlsx or .xls)');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push('File size too large. Maximum size is 10MB');
  }
  
  return errors;
};

export const formatImportErrors = (errors) => {
  return errors.map(error => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.row && error.item && error.error) {
      return `Row ${error.row}: ${error.item} - ${error.error}`;
    }
    
    return error.message || 'Unknown error';
  });
};