import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';
import toast from 'react-hot-toast';

export default function AddItemModal({ isOpen, onClose, editItem = null }) {
  const { categories, createItem, updateItem, loadCategories } = useInventory();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    unit: '',
    current_stock: '',
    reorder_level: '',
    cost_per_unit: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || '',
        sku: editItem.sku || '',
        description: editItem.description || '',
        category_id: editItem.category_id?.toString() || '',
        unit: editItem.unit || '',
        current_stock: editItem.current_stock?.toString() || '',
        reorder_level: editItem.reorder_level?.toString() || '',
        cost_per_unit: editItem.cost_per_unit?.toString() || '',
      });
    }
  }, [editItem]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.unit.trim()) {
      toast.error('Unit is required');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        description: formData.description.trim() || null,
        category_id: parseInt(formData.category_id),
        unit: formData.unit.trim(),
        current_stock: parseInt(formData.current_stock) || 0,
        reorder_level: parseInt(formData.reorder_level) || null,
        cost_per_unit: parseFloat(formData.cost_per_unit) || null,
      };

      if (editItem) {
        await updateItem(editItem.id, itemData);
      } else {
        await createItem(itemData);
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category_id: '',
      unit: '',
      current_stock: '',
      reorder_level: '',
      cost_per_unit: '',
    });
    onClose();
  };

  const handleCategoryCreated = (newCategory) => {
    // Refresh categories after creating a new one
    loadCategories();
    
    // Auto-select the newly created category
    if (newCategory && newCategory.id) {
      setFormData(prev => ({ ...prev, category_id: newCategory.id.toString() }));
      toast.success(`Category "${newCategory.name}" created and selected!`);
    } else {
      toast.success('Category created successfully! You can now select it.');
    }
    
    setShowCategoryModal(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter item name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input
              id="sku"
              placeholder="Enter SKU (optional)"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter item description (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 flex items-center gap-1 whitespace-nowrap"
                title="Create New Category"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">
              Unit <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unit"
              placeholder="e.g., pieces, kg, liters, boxes"
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Stock */}
            <div className="space-y-2">
              <Label htmlFor="current_stock">Initial Stock</Label>
              <Input
                id="current_stock"
                type="number"
                placeholder="0"
                value={formData.current_stock}
                onChange={(e) => handleInputChange('current_stock', e.target.value)}
                min="0"
              />
            </div>

            {/* Reorder Level */}
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                placeholder="Minimum stock level"
                value={formData.reorder_level}
                onChange={(e) => handleInputChange('reorder_level', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Cost per Unit */}
          <div className="space-y-2">
            <Label htmlFor="cost_per_unit">Cost per Unit (₹)</Label>
            <Input
              id="cost_per_unit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.cost_per_unit}
              onChange={(e) => handleInputChange('cost_per_unit', e.target.value)}
              min="0"
            />
          </div>

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
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : (editItem ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />
    </Dialog>
  );
}