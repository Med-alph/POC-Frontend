import React, { useState } from 'react';
import { X, Package, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import inventoryAPI from '../../api/inventoryapi';

const StockOutFEFOModal = ({ isOpen, onClose, item, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    reason: 'Dispensed to patient'
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

  const validateForm = () => {
    if (!formData.quantity || formData.quantity <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }
    
    if (parseInt(formData.quantity) > item?.current_stock) {
      setError(`Insufficient stock. Available: ${item.current_stock}`);
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
      const stockOutData = {
        item_id: item.id,
        quantity: parseInt(formData.quantity),
        reason: formData.reason
      };

      await inventoryAPI.stockOutFEFO(stockOutData);
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        quantity: '',
        reason: 'Dispensed to patient'
      });
    } catch (err) {
      setError(err.message || 'Failed to process stock out');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Out (FEFO)</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-600">Available Stock: {item.current_stock} {item.unit}</p>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">FEFO (First Expiry First Out)</p>
              <p>Stock will be consumed from batches with earliest expiry dates first.</p>
            </div>
          </div>
        </div>

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
              placeholder="Enter quantity to dispense"
              min="1"
              max={item?.current_stock || 0}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Dispensed to patient">Dispensed to patient</option>
              <option value="Used in treatment">Used in treatment</option>
              <option value="Transferred to department">Transferred to department</option>
              <option value="Wastage - expired">Wastage - expired</option>
              <option value="Wastage - damaged">Wastage - damaged</option>
              <option value="Other">Other</option>
            </select>
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
              variant="destructive"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Dispense Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockOutFEFOModal;