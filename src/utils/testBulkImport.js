/**
 * Test utility for bulk import functionality
 * This can be used to test the bulk import without running the full app
 */

import * as XLSX from 'xlsx';
import { generateSampleExcelData, normalizeInventoryData, validateExcelFile } from './excelUtils.js';

// Test function to create a sample Excel file
export const createTestExcelFile = () => {
  const sampleData = generateSampleExcelData();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");
  
  // Convert to buffer for testing
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Create a File-like object for testing
  const file = new File([buffer], 'test_inventory.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  return file;
};

// Test function to validate the Excel processing
export const testExcelProcessing = () => {
  try {
    const testFile = createTestExcelFile();
    console.log('✅ Test file created successfully:', testFile.name, testFile.size, 'bytes');
    
    const validationErrors = validateExcelFile(testFile);
    if (validationErrors.length === 0) {
      console.log('✅ File validation passed');
    } else {
      console.log('❌ File validation failed:', validationErrors);
    }
    
    // Test data normalization
    const sampleData = generateSampleExcelData();
    const normalizedData = normalizeInventoryData(sampleData);
    console.log('✅ Data normalization test:', normalizedData.length, 'items processed');
    
    return {
      success: true,
      file: testFile,
      normalizedData
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test the API payload format
export const testAPIPayload = () => {
  const sampleData = generateSampleExcelData();
  const normalizedData = normalizeInventoryData(sampleData);
  
  // Remove internal fields that shouldn't be sent to API
  const apiPayload = normalizedData.map(item => {
    const { _rowIndex, ...apiItem } = item;
    return apiItem;
  });
  
  console.log('API Payload Test:');
  console.log(JSON.stringify({ items: apiPayload }, null, 2));
  
  return apiPayload;
};

// Run all tests
export const runAllTests = () => {
  console.log('🧪 Running Bulk Import Tests...\n');
  
  const processingTest = testExcelProcessing();
  if (processingTest.success) {
    console.log('✅ Excel processing test passed\n');
  } else {
    console.log('❌ Excel processing test failed\n');
    return false;
  }
  
  const apiTest = testAPIPayload();
  if (apiTest && apiTest.length > 0) {
    console.log('✅ API payload test passed\n');
  } else {
    console.log('❌ API payload test failed\n');
    return false;
  }
  
  console.log('🎉 All tests passed! Bulk import functionality is ready.');
  return true;
};

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.testBulkImport = {
    createTestExcelFile,
    testExcelProcessing,
    testAPIPayload,
    runAllTests
  };
}