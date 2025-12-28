import { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import inventoryAPI from '../../api/inventoryapi';
import * as XLSX from 'xlsx';
import { 
  validateExcelFile, 
  normalizeInventoryData, 
  generateSampleExcelData,
  formatImportErrors 
} from '../../utils/excelUtils';

const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const fileInputRef = useRef(null);

  const sampleData = generateSampleExcelData();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");
    XLSX.writeFile(wb, "inventory_import_template.xlsx");
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file
      const fileErrors = validateExcelFile(selectedFile);
      if (fileErrors.length > 0) {
        setValidationErrors(fileErrors);
        return;
      }
      
      setFile(selectedFile);
      setImportResult(null);
      setValidationErrors([]);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setValidationErrors(['Excel file is empty or has no data rows']);
          return;
        }
        
        // Normalize and validate data
        const normalizedData = normalizeInventoryData(jsonData);
        setPreviewData(normalizedData.slice(0, 5)); // Show first 5 rows for preview
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setValidationErrors(['Error parsing Excel file. Please check the file format.']);
        setShowPreview(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Transform data to match API format
          const items = normalizeInventoryData(jsonData);

          const result = await inventoryAPI.bulkImportItems(items);
          setImportResult(result);
          
          if (result.success && onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error('Import error:', error);
          setImportResult({
            success: false,
            message: error.message || 'Import failed'
          });
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File reading error:', error);
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    setPreviewData([]);
    setShowPreview(false);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Import Inventory Items
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Required Columns:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>name</strong> - Item name</li>
                    <li>• <strong>category</strong> - Item category</li>
                    <li>• <strong>unit</strong> - Unit of measurement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Columns:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>sku</strong> - Stock keeping unit</li>
                    <li>• <strong>reorder_level</strong> - Minimum stock level</li>
                    <li>• <strong>cost_per_unit</strong> - Cost per unit</li>
                    <li>• <strong>current_stock</strong> - Initial stock quantity</li>
                    <li>• <strong>description</strong> - Item description</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Import Tips</span>
                </div>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Categories will be auto-created if they don't exist</li>
                  <li>• SKU must be unique within your hospital</li>
                  <li>• Duplicate names within the import will be rejected</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to select Excel file (.xlsx, .xls)
                    </span>
                  </label>
                </div>
                
                {file && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFile(null);
                        setShowPreview(false);
                        setPreviewData([]);
                        setValidationErrors([]);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Validation Errors</span>
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview (First 5 rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th key={key} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Result */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Import Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className={`font-medium ${importResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {importResult.message}
                  </p>
                  
                  {importResult.success && importResult.data && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{importResult.data.total}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{importResult.data.created}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{importResult.data.failed}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                      </div>
                    </div>
                  )}

                  {importResult.data?.errors && importResult.data.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Errors ({importResult.data.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {importResult.data.errors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                            <strong>Row {error.row}:</strong> {error.item} - {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose}>
            {importResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {file && !importResult && validationErrors.length === 0 && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Items
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;