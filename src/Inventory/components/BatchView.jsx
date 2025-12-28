import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import inventoryAPI from '../../api/inventoryapi';
import { getExpiryStatus, formatExpiryDate, sortBatchesByExpiry } from '../../utils/batchUtils';

const BatchView = ({ isOpen, onClose, item }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjustModal, setAdjustModal] = useState({ open: false, batch: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, batch: null, action: null });

  useEffect(() => {
    if (isOpen && item) {
      fetchBatches();
    }
  }, [isOpen, item]);

  const fetchBatches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await inventoryAPI.getBatchesByItem(item.id);
      setBatches(sortBatchesByExpiry(response.data || []));
    } catch (err) {
      setError('Failed to load batches');
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkExpired = async (batch) => {
    setConfirmModal({
      open: true,
      batch,
      action: 'expire',
      title: 'Mark Batch as Expired',
      description: `Are you sure you want to mark batch "${batch.batch_number}" as expired? This action cannot be undone.`,
      confirmText: 'Mark as Expired'
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.batch) return;
    
    try {
      if (confirmModal.action === 'expire') {
        await inventoryAPI.markBatchExpired(confirmModal.batch.id);
        fetchBatches(); // Refresh the list
      }
      setConfirmModal({ open: false, batch: null, action: null });
    } catch (err) {
      setError('Failed to mark batch as expired');
    }
  };

  const handleAdjustQuantity = async (batchId, newQuantity, reason) => {
    try {
      await inventoryAPI.adjustBatch(batchId, {
        new_quantity: parseInt(newQuantity),
        reason: reason || 'Manual adjustment'
      });
      setAdjustModal({ open: false, batch: null });
      fetchBatches(); // Refresh the list
    } catch (err) {
      setError('Failed to adjust batch quantity');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch Management</DialogTitle>
          {item && <p className="text-gray-600">{item.name}</p>}
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading batches...</div>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No batches found for this item</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost/Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatExpiryDate(batch.expiry_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.bgColor} ${expiryStatus.textColor}`}>
                            {expiryStatus.text}
                            {expiryStatus.status !== 'good' && (
                              <span className="ml-1">
                                ({expiryStatus.days} days)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.current_quantity} / {batch.initial_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.cost_per_unit ? `$${batch.cost_per_unit}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatExpiryDate(batch.received_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAdjustModal({ open: true, batch })}
                              className="text-blue-600 hover:text-blue-900"
                              title="Adjust Quantity"
                            >
                              <Edit size={16} />
                            </button>
                            {batch.current_quantity > 0 && expiryStatus.status !== 'expired' && (
                              <button
                                onClick={() => handleMarkExpired(batch)}
                                className="text-red-600 hover:text-red-900"
                                title="Mark as Expired"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Adjust Quantity Modal */}
      {adjustModal.open && (
        <AdjustQuantityModal
          batch={adjustModal.batch}
          onClose={() => setAdjustModal({ open: false, batch: null })}
          onSubmit={handleAdjustQuantity}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <ConfirmationModal
          batch={confirmModal.batch}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          onClose={() => setConfirmModal({ open: false, batch: null, action: null })}
          onConfirm={handleConfirmAction}
        />
      )}
    </Dialog>
  );
};

const AdjustQuantityModal = ({ batch, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState(batch?.current_quantity || 0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(batch.id, quantity, reason);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Batch Quantity</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-800">Batch: {batch?.batch_number}</p>
          <p className="text-sm text-gray-600">Current Quantity: {batch?.current_quantity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Adjustment
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for adjustment"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Adjust
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmationModal = ({ batch, title, description, confirmText, onClose, onConfirm }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <p className="text-gray-600">{description}</p>
          {batch && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">Batch: {batch.batch_number}</p>
              <p className="text-sm text-gray-600">Quantity: {batch.current_quantity}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchView;