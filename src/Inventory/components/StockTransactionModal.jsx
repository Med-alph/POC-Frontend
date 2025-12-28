import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import toast from 'react-hot-toast';

export default function StockTransactionModal({ isOpen, onClose, item, type }) {
  const { createStockTransaction } = useInventory();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (type === 'OUT' && parseInt(quantity) > item.current_stock) {
      toast.error('Insufficient stock available');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        item_id: item.id,
        transaction_type: type,
        quantity: parseInt(quantity),
        reason: reason || null,
      };

      if (type === 'IN' && costPerUnit) {
        transactionData.cost_per_unit = parseFloat(costPerUnit);
      }

      await createStockTransaction(transactionData);
      onClose();
      
      // Reset form
      setQuantity('');
      setReason('');
      setCostPerUnit('');
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    setReason('');
    setCostPerUnit('');
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Stock {type === 'IN' ? 'In' : 'Out'}: {item.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
            <p className="text-sm">
              Current Stock: <span className="font-semibold">{item.current_stock} {item.unit}</span>
            </p>
            {item.reorder_level && (
              <p className="text-xs text-muted-foreground">
                Reorder Level: {item.reorder_level} {item.unit}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={type === 'OUT' ? item.current_stock : undefined}
              required
            />
            {type === 'OUT' && (
              <p className="text-xs text-muted-foreground">
                Maximum available: {item.current_stock} {item.unit}
              </p>
            )}
          </div>

          {/* Cost per unit (only for stock in) */}
          {type === 'IN' && (
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (₹)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                placeholder="Enter cost per unit"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                min="0"
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this transaction (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Transaction Preview:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {type === 'IN' ? 'Adding' : 'Removing'} {quantity} {item.unit}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                New Stock Level: {type === 'IN' 
                  ? item.current_stock + parseInt(quantity || 0)
                  : item.current_stock - parseInt(quantity || 0)
                } {item.unit}
              </p>
              {type === 'IN' && costPerUnit && (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Total Cost: ₹{(parseFloat(costPerUnit) * parseInt(quantity || 0)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !quantity}
              className="flex-1"
            >
              {loading ? 'Processing...' : `Confirm ${type === 'IN' ? 'Stock In' : 'Stock Out'}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}