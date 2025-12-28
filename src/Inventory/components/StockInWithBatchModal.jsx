import React, { useState } from 'react';
import { X, Package, Calendar, DollarSign, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import inventoryAPI from '../../api/inventoryapi';
import { generateBatchNumber } from '../../utils/batchUtils';

const StockInWithBatchModal = ({ isOpen, onClose, item, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    batch_number: '',
    expiry_date: '',
    cost_per_unit: '',
    reason: 'Stock received'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAutoGenerateBatch = () => {
    setFormData(prev => ({
      ...prev,
      batch_number: generateBatchNumber()
    }));
  };

  const validateForm = () => {
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }
    if (!formData.batch_number.trim()) {
      setError('Batch number is required');
      return false;
    }
    if (!formData.expiry_date) {
      setError('Expiry date is required');
      return false;
    }
    
    const expiryDate = new Date(formData.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate <= today) {
      setError('Expiry date must be in the future');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const stockInData = {
        item_id: item.id,
        quantity: parseInt(formData.quantity),
        batch_number: formData.batch_number.trim(),
        expiry_date: formData.expiry_date,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        reason: formData.reason
      };

      await inventoryAPI.stockInWithBatch(stockInData);
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        quantity: '',
        batch_number: '',
        expiry_date: '',
        cost_per_unit: '',
        reason: 'Stock received'
      });
    } catch (err) {
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock In with Batch</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-600">Current Stock: {item.current_stock} {item.unit}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package size={16} className="inline mr-1" />
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash size={16} className="inline mr-1" />
              Batch Number *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter batch number"
                required
              />
              <button
                type="button"
                onClick={handleAutoGenerateBatch}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Auto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign size={16} className="inline mr-1" />
              Cost per Unit (Optional)
            </label>
            <input
              type="number"
              name="cost_per_unit"
              value={formData.cost_per_unit}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter cost per unit"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockInWithBatchModal;