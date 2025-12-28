import { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Plus, Search, Filter, MoreHorizontal, Package, AlertTriangle, RefreshCw, Download, Users, Edit, Archive, RotateCcw, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import StockTransactionModal from './components/StockTransactionModal';
import StockInWithBatchModal from './components/StockInWithBatchModal';
import StockOutFEFOModal from './components/StockOutFEFOModal';
import BatchView from './components/BatchView';
import AddItemModal from './components/AddItemModal';
import BulkImportModal from './components/BulkImportModal';
import ConfirmationModal from '../components/ui/confirmation-modal';
import toast, { Toaster } from 'react-hot-toast';
import inventoryAPI from '../api/inventoryapi';
import { getExpiryStatus, getExpiryStatusIcon } from '../utils/batchUtils';

export default function ItemsPage() {
  const { items, categories, loading, filters, setFilters, loadItems, loadCategories } = useInventory();
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBatchStockInModal, setShowBatchStockInModal] = useState(false);
  const [showBatchStockOutModal, setShowBatchStockOutModal] = useState(false);
  const [showBatchViewModal, setShowBatchViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [transactionType, setTransactionType] = useState('IN');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [itemBatches, setItemBatches] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const inStock = items.filter(item => item.current_stock > 0 && item.is_active).length;
    const lowStock = items.filter(item => item.is_low_stock && item.current_stock > 0).length;
    const outOfStock = items.filter(item => item.current_stock === 0 && item.is_active).length;
    const archived = items.filter(item => !item.is_active).length;
    return { total, inStock, lowStock, outOfStock, archived };
  }, [items]);

  // Filtered items count for pagination
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = !filters.search || 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Category filter
      const matchesCategory = !filters.category_id || 
        item.category_id?.toString() === filters.category_id;
      
      // Stock status filter
      let matchesStockStatus = true;
      if (filters.stock_status && filters.stock_status !== 'all') {
        switch (filters.stock_status) {
          case 'in_stock':
            matchesStockStatus = item.current_stock > 0 && !item.is_low_stock && item.is_active;
            break;
          case 'low_stock':
            matchesStockStatus = item.is_low_stock && item.current_stock > 0 && item.is_active;
            break;
          case 'out_of_stock':
            matchesStockStatus = item.current_stock === 0 && item.is_active;
            break;
          default:
            matchesStockStatus = true;
        }
      }
      
      // Archived filter
      const matchesArchived = filters.include_archived || item.is_active;
      
      return matchesSearch && matchesCategory && matchesStockStatus && matchesArchived;
    });
  }, [items, filters]);

  // Filtered and paginated items
  const filteredAndPaginatedItems = useMemo(() => {
    // Apply pagination to filtered items
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    loadCategories();
    setTotalCount(filteredItems.length);
    // Reset to page 1 when filters change
    setCurrentPage(1);
    // Load batch info for visible items
    loadBatchInfo();
  }, [filteredItems]);

  const loadBatchInfo = async () => {
    try {
      const batchPromises = filteredAndPaginatedItems.map(async (item) => {
        try {
          const response = await inventoryAPI.getBatchesByItem(item.id);
          return { itemId: item.id, batches: response.data || [] };
        } catch (err) {
          return { itemId: item.id, batches: [] };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const batchMap = {};
      batchResults.forEach(({ itemId, batches }) => {
        batchMap[itemId] = batches;
      });
      setItemBatches(batchMap);
    } catch (err) {
      console.error('Error loading batch info:', err);
    }
  };

  const handleRefresh = () => {
    loadItems();
    toast.success("Items data refreshed");
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'SKU', 'Category', 'Current Stock', 'Unit', 'Reorder Level', 'Status'],
      ...items.map(item => [
        item.name,
        item.sku || 'N/A',
        item.category?.name || 'No Category',
        item.current_stock,
        item.unit,
        item.reorder_level || 'Not set',
        item.is_active ? (item.current_stock === 0 ? 'Out of Stock' : item.is_low_stock ? 'Low Stock' : 'In Stock') : 'Archived'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-items.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Items data exported");
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCategoryFilter = (categoryId) => {
    setFilters(prev => ({ 
      ...prev, 
      category_id: categoryId === 'all' ? null : categoryId 
    }));
  };

  const handleStockStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, stock_status: status }));
  };

  const handleIncludeArchived = (checked) => {
    setFilters(prev => ({ ...prev, include_archived: checked }));
  };

  const handleStockAction = (item, type) => {
    setSelectedItem(item);
    setTransactionType(type);
    
    // Use batch-enabled modals for stock operations
    if (type === 'IN') {
      setShowBatchStockInModal(true);
    } else if (type === 'OUT') {
      setShowBatchStockOutModal(true);
    } else {
      // Fallback to old modal for other types
      setShowStockModal(true);
    }
  };

  const handleViewBatches = (item) => {
    setSelectedItem(item);
    setShowBatchViewModal(true);
  };

  const handleStockSuccess = () => {
    loadItems();
    loadBatchInfo();
  };

  const handleBulkImportSuccess = () => {
    loadItems();
    loadBatchInfo();
    setShowBulkImportModal(false);
    toast.success("Bulk import completed successfully");
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const handleArchiveItem = (item) => {
    setSelectedItem(item);
    setConfirmAction({
      type: item.is_active ? 'archive' : 'restore',
      title: item.is_active ? 'Archive Item' : 'Restore Item',
      description: item.is_active 
        ? `Are you sure you want to archive "${item.name}"? This will hide it from the active inventory list.`
        : `Are you sure you want to restore "${item.name}"? This will make it active again.`,
      confirmText: item.is_active ? 'Archive' : 'Restore',
      variant: item.is_active ? 'destructive' : 'default'
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedItem || !confirmAction) return;

    setActionLoading(true);
    try {
      if (confirmAction.type === 'archive') {
        await inventoryAPI.deleteItem(selectedItem.id);
        toast.success(`Item "${selectedItem.name}" has been archived`);
      } else if (confirmAction.type === 'restore') {
        await inventoryAPI.restoreItem(selectedItem.id);
        toast.success(`Item "${selectedItem.name}" has been restored`);
      }
      
      // Refresh the items list
      loadItems();
      setShowConfirmModal(false);
      setSelectedItem(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Action failed:', error);
      toast.error(`Failed to ${confirmAction.type} item. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getItemExpiryStatus = (item) => {
    const batches = itemBatches[item.id] || [];
    if (batches.length === 0) return null;
    
    // Find the earliest expiry status among active batches
    const activeBatches = batches.filter(batch => batch.current_quantity > 0);
    if (activeBatches.length === 0) return null;
    
    const expiryStatuses = activeBatches.map(batch => getExpiryStatus(batch.expiry_date));
    
    // Return the most urgent status
    if (expiryStatuses.some(status => status.status === 'expired')) {
      return expiryStatuses.find(status => status.status === 'expired');
    }
    if (expiryStatuses.some(status => status.status === 'expiring_soon')) {
      return expiryStatuses.find(status => status.status === 'expiring_soon');
    }
    if (expiryStatuses.some(status => status.status === 'expiring_later')) {
      return expiryStatuses.find(status => status.status === 'expiring_later');
    }
    
    return expiryStatuses[0] || null;
  };

  const getStockStatusBadge = (item) => {
    // Stock Status Logic:
    // 1. Archived: is_active === false
    // 2. Out of Stock: current_stock === 0 (regardless of is_low_stock)
    // 3. Low Stock: is_low_stock === true AND current_stock > 0
    // 4. In Stock: current_stock > 0 AND is_low_stock === false
    
    if (!item.is_active) return <Badge variant="secondary">Archived</Badge>;
    if (item.current_stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (item.is_low_stock) return <Badge variant="outline" className="border-orange-500 text-orange-700">Low Stock</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-700">In Stock</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Items Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your inventory items, stock levels, and categories</p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Package className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">In Stock</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.inStock}</p>
                </div>
                <div className="h-6 w-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Low Stock</p>
                  <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-400 dark:text-orange-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Out of Stock</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.outOfStock}</p>
                </div>
                <div className="h-6 w-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative w-full sm:w-64 md:w-80 lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search items by name or SKU..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select value={filters.category_id || 'all'} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 md:w-40 lg:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.stock_status} onValueChange={handleStockStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 md:w-40 lg:w-48">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-archived"
                  checked={filters.include_archived}
                  onCheckedChange={handleIncludeArchived}
                />
                <label htmlFor="include-archived" className="text-sm font-medium">
                  Include Archived
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkImportModal(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Import</span>
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading items...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {items.length === 0 ? 'No items found' : 'No items match your filters'}
              </p>
              {items.length === 0 ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Item Details</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">SKU</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Current Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Batches</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Expiry Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Reorder Level</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndPaginatedItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${!item.is_active ? 'opacity-60' : ''}`}
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {item.category?.name ? (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                            {item.category.name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">No Category</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{item.sku || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">{item.current_stock}</span>
                          {item.is_low_stock && item.current_stock > 0 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {(itemBatches[item.id] || []).length} batches
                          </span>
                          <button
                            onClick={() => handleViewBatches(item)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            View Details
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {(() => {
                          const expiryStatus = getItemExpiryStatus(item);
                          if (!expiryStatus) {
                            return <span className="text-xs text-gray-400">No batches</span>;
                          }
                          return (
                            <div className="flex flex-col items-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${expiryStatus.bgColor} ${expiryStatus.textColor}`}>
                                {getExpiryStatusIcon(expiryStatus.status)} {expiryStatus.text}
                              </span>
                              {expiryStatus.status !== 'good' && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {expiryStatus.days} days
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-sm text-gray-900 dark:text-white">{item.reorder_level || 'Not set'}</span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {getStockStatusBadge(item)}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStockAction(item, 'IN')}
                            disabled={!item.is_active}
                            className="h-8 px-2"
                          >
                            In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStockAction(item, 'OUT')}
                            disabled={!item.is_active || item.current_stock === 0}
                            className="h-8 px-2"
                          >
                            Out
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStockAction(item, 'IN')}>
                                Stock In (Batch)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStockAction(item, 'OUT')}>
                                Stock Out (FEFO)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewBatches(item)}>
                                <Package className="h-4 w-4 mr-2" />
                                View Batches
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleArchiveItem(item)}
                                className={item.is_active ? "text-red-600" : "text-blue-600"}
                              >
                                {item.is_active ? (
                                  <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        {/* Footer with pagination */}
        {filteredItems.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredAndPaginatedItems.length} of {filteredItems.length} items
                {filters.search && (
                  <span className="ml-2 text-blue-600">• Filtered by "{filters.search}"</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(filteredItems.length / PAGE_SIZE) || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= Math.ceil(filteredItems.length / PAGE_SIZE)}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showStockModal && (
          <StockTransactionModal
            isOpen={showStockModal}
            onClose={() => setShowStockModal(false)}
            item={selectedItem}
            type={transactionType}
          />
        )}

        {showBatchStockInModal && (
          <StockInWithBatchModal
            isOpen={showBatchStockInModal}
            onClose={() => setShowBatchStockInModal(false)}
            item={selectedItem}
            onSuccess={handleStockSuccess}
          />
        )}

        {showBatchStockOutModal && (
          <StockOutFEFOModal
            isOpen={showBatchStockOutModal}
            onClose={() => setShowBatchStockOutModal(false)}
            item={selectedItem}
            onSuccess={handleStockSuccess}
          />
        )}

        {showBatchViewModal && (
          <BatchView
            isOpen={showBatchViewModal}
            onClose={() => setShowBatchViewModal(false)}
            item={selectedItem}
          />
        )}

        {showAddModal && (
          <AddItemModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {showEditModal && (
          <AddItemModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditItem(null);
            }}
            editItem={editItem}
          />
        )}

        {showBulkImportModal && (
          <BulkImportModal
            isOpen={showBulkImportModal}
            onClose={() => setShowBulkImportModal(false)}
            onSuccess={handleBulkImportSuccess}
          />
        )}

        {showConfirmModal && confirmAction && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedItem(null);
              setConfirmAction(null);
            }}
            onConfirm={handleConfirmAction}
            title={confirmAction.title}
            description={confirmAction.description}
            confirmText={confirmAction.confirmText}
            variant={confirmAction.variant}
            loading={actionLoading}
          />
        )}
      </main>
    </div>
  );
}