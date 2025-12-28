import React, { createContext, useContext, useState, useEffect } from 'react';
import inventoryAPI from '../api/inventoryapi';
import toast from 'react-hot-toast';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: null,
    include_archived: false,
    stock_status: 'all', // all, low_stock, out_of_stock
  });

  // Load items with current filters
  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await inventoryAPI.getItems(filters);
      if (result.success) {
        setItems(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load items');
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const result = await inventoryAPI.getCategories(filters.include_archived);
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error loading categories:', error);
    }
  };

  // Load transactions
  const loadTransactions = async (transactionFilters = {}) => {
    setLoading(true);
    try {
      const result = await inventoryAPI.getTransactions(transactionFilters);
      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load transactions');
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      const result = await inventoryAPI.getDashboard();
      if (result.success) {
        setDashboard(result.data || {});
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error loading dashboard:', error);
    }
  };

  // Create stock transaction
  const createStockTransaction = async (data) => {
    try {
      const result = await inventoryAPI.createTransaction(data);
      if (result.success) {
        // Update local item stock
        setItems(prev => prev.map(item => 
          item.id === data.item_id 
            ? { ...item, current_stock: result.data.new_stock }
            : item
        ));
        
        // Add transaction to local state
        setTransactions(prev => [result.data, ...prev]);
        
        toast.success(`Stock updated. New level: ${result.data.new_stock}`);
        
        // Refresh dashboard data
        loadDashboard();
      }
      return result;
    } catch (error) {
      toast.error('Failed to create transaction');
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  // Create item
  const createItem = async (data) => {
    try {
      const result = await inventoryAPI.createItem(data);
      if (result.success) {
        let newItem = result.data;
        
        // If initial stock was provided, create a stock-in transaction
        if (data.current_stock && data.current_stock > 0) {
          try {
            const stockTransaction = await inventoryAPI.createTransaction({
              item_id: newItem.id,
              transaction_type: 'IN',
              quantity: data.current_stock,
              reason: 'Initial stock',
              cost_per_unit: data.cost_per_unit || null,
            });
            
            if (stockTransaction.success) {
              // Update the item with new stock level
              newItem = { ...newItem, current_stock: stockTransaction.data.new_stock };
            }
          } catch (stockError) {
            console.error('Error creating initial stock transaction:', stockError);
            toast.error('Item created but failed to set initial stock');
          }
        }
        
        setItems(prev => [newItem, ...prev]);
        toast.success('Item created successfully');
        loadDashboard();
      }
      return result;
    } catch (error) {
      toast.error('Failed to create item');
      console.error('Error creating item:', error);
      throw error;
    }
  };

  // Update item
  const updateItem = async (id, data) => {
    try {
      const result = await inventoryAPI.updateItem(id, data);
      if (result.success) {
        setItems(prev => prev.map(item => 
          item.id === id ? result.data : item
        ));
        toast.success('Item updated successfully');
      }
      return result;
    } catch (error) {
      toast.error('Failed to update item');
      console.error('Error updating item:', error);
      throw error;
    }
  };

  // Create category
  const createCategory = async (data) => {
    try {
      const result = await inventoryAPI.createCategory(data);
      if (result.success) {
        setCategories(prev => [result.data, ...prev]);
        toast.success('Category created successfully');
      }
      return result;
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
      throw error;
    }
  };

  // Update category
  const updateCategory = async (id, data) => {
    try {
      const result = await inventoryAPI.updateCategory(id, data);
      if (result.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? result.data : cat
        ));
        toast.success('Category updated successfully');
      }
      return result;
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
      throw error;
    }
  };

  // Archive category (using DELETE endpoint)
  const archiveCategory = async (id) => {
    try {
      const result = await inventoryAPI.deleteCategory(id);
      if (result.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, is_active: false } : cat
        ));
        toast.success('Category archived successfully');
      }
      return result;
    } catch (error) {
      toast.error('Failed to archive category');
      console.error('Error archiving category:', error);
      throw error;
    }
  };

  // Restore category
  const restoreCategory = async (id) => {
    try {
      const result = await inventoryAPI.restoreCategory(id);
      if (result.success) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, is_active: true } : cat
        ));
        toast.success('Category restored successfully');
      }
      return result;
    } catch (error) {
      toast.error('Failed to restore category');
      console.error('Error restoring category:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    loadItems();
  }, [filters]);

  useEffect(() => {
    loadCategories();
    loadDashboard();
  }, []);

  const value = {
    // State
    items,
    categories,
    transactions,
    dashboard,
    loading,
    filters,
    
    // Actions
    loadItems,
    loadCategories,
    loadTransactions,
    loadDashboard,
    createStockTransaction,
    createItem,
    updateItem,
    createCategory,
    updateCategory,
    archiveCategory,
    restoreCategory,
    setFilters,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};