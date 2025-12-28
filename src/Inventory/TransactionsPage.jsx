import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { ArrowUpCircle, ArrowDownCircle, Download, Calendar, RefreshCw, Search, User, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import toast, { Toaster } from 'react-hot-toast';
import { formatExpiryDate } from '../utils/batchUtils';
import inventoryAPI from '../api/inventoryapi';

export default function TransactionsPage() {
  const { transactions, items, loading, loadTransactions, loadItems } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [batchData, setBatchData] = useState({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    item_id: 'all',
    transaction_type: 'all',
    staff_id: '',
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Statistics
  const stats = useMemo(() => {
    const total = transactions.length;
    const stockIn = transactions.filter(t => t.transaction_type === 'IN').length;
    const stockOut = transactions.filter(t => t.transaction_type === 'OUT').length;
    const adjustments = transactions.filter(t => t.transaction_type === 'ADJUSTMENT').length;
    return { total, stockIn, stockOut, adjustments };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter (item name, SKU, staff name, reason)
      const matchesSearch = !searchTerm || 
        (transaction.item?.name && transaction.item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.item?.sku && transaction.item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.staff?.staff_name && transaction.staff.staff_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.reason && transaction.reason.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Date range filter
      const matchesDateRange = (!filters.start_date || new Date(transaction.created_at) >= new Date(filters.start_date)) &&
                              (!filters.end_date || new Date(transaction.created_at) <= new Date(filters.end_date + 'T23:59:59'));
      
      // Item filter
      const matchesItem = !filters.item_id || filters.item_id === 'all' || transaction.item_id?.toString() === filters.item_id;
      
      // Transaction type filter
      const matchesType = !filters.transaction_type || filters.transaction_type === 'all' || transaction.transaction_type === filters.transaction_type;
      
      return matchesSearch && matchesDateRange && matchesItem && matchesType;
    });
  }, [transactions, searchTerm, filters]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    loadItems();
    loadTransactions();
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Load batch data for transactions that have batch_id
  useEffect(() => {
    const loadBatchData = async () => {
      if (paginatedTransactions.length === 0) return;
      
      // Get unique batch IDs that we don't already have
      const missingBatchIds = paginatedTransactions
        .filter(t => t.batch_id && !batchData[t.batch_id])
        .map(t => t.batch_id);
      
      if (missingBatchIds.length === 0) return;
      
      setLoadingBatches(true);
      
      // Group transactions by item_id to minimize API calls
      const itemGroups = {};
      paginatedTransactions.forEach(t => {
        if (t.batch_id && missingBatchIds.includes(t.batch_id)) {
          if (!itemGroups[t.item_id]) {
            itemGroups[t.item_id] = [];
          }
          itemGroups[t.item_id].push(t.batch_id);
        }
      });

      try {
        const batchPromises = Object.keys(itemGroups).map(async (itemId) => {
          try {
            const response = await inventoryAPI.getBatchesByItem(itemId);
            const batches = response.data || [];
            return { itemId, batches };
          } catch (err) {
            console.error(`Error loading batches for item ${itemId}:`, err);
            return { itemId, batches: [] };
          }
        });

        const itemBatchResults = await Promise.all(batchPromises);
        const newBatchData = {};
        
        itemBatchResults.forEach(({ batches }) => {
          batches.forEach(batch => {
            if (missingBatchIds.includes(batch.id)) {
              newBatchData[batch.id] = batch;
            }
          });
        });
        
        setBatchData(prev => ({ ...prev, ...newBatchData }));
      } catch (err) {
        console.error('Error loading batch data:', err);
      } finally {
        setLoadingBatches(false);
      }
    };

    loadBatchData();
  }, [paginatedTransactions]);

  const handleRefresh = () => {
    loadTransactions();
    toast.success("Transactions data refreshed");
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Item Name', 'SKU', 'Type', 'Quantity', 'Staff', 'Reason'],
      ...transactions.map(transaction => [
        new Date(transaction.created_at).toLocaleString(),
        transaction.item?.name || 'N/A',
        transaction.item?.sku || 'N/A',
        transaction.transaction_type,
        `${transaction.transaction_type === 'OUT' ? '-' : '+'}${transaction.quantity}`,
        transaction.staff?.staff_name || 'System',
        transaction.reason || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Transactions data exported");
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      start_date: '',
      end_date: '',
      item_id: 'all',
      transaction_type: 'all',
      staff_id: '',
    });
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'IN':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Stock In</Badge>;
      case 'OUT':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Stock Out</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Adjustment</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBatchInfo = (transaction) => {
    if (!transaction.batch_id) {
      return <span className="text-xs text-gray-400 italic">No batch info</span>;
    }

    const batch = batchData[transaction.batch_id];
    
    if (batch) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {batch.batch_number}
            </span>
          </div>
          {batch.expiry_date && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Exp: {formatExpiryDate(batch.expiry_date)}
            </span>
          )}
        </div>
      );
    }
    
    if (loadingBatches) {
      return (
        <div className="flex items-center gap-1">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="text-xs text-gray-400 italic">Loading...</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        <Package className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-400">
          Batch: {transaction.batch_id.slice(0, 8)}...
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Transaction History</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and filter all inventory transactions</p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock In</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.stockIn}</p>
                </div>
                <ArrowUpCircle className="h-6 w-6 text-green-400 dark:text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Out</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.stockOut}</p>
                </div>
                <ArrowDownCircle className="h-6 w-6 text-red-400 dark:text-red-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Adjustments</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.adjustments}</p>
                </div>
                <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
          <div className="space-y-4">
            {/* First Row: Search and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {filteredTransactions.length} of {transactions.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Second Row: Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Range */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full sm:w-36"
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full sm:w-36"
                  placeholder="End Date"
                />
              </div>

              {/* Item Filter */}
              <Select value={filters.item_id} onValueChange={(value) => handleFilterChange('item_id', value)}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Transaction Type */}
              <Select value={filters.transaction_type} onValueChange={(value) => handleFilterChange('transaction_type', value)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
              </p>
              {transactions.length === 0 ? (
                <p className="text-xs text-gray-400 mt-2">Transactions will appear here when you perform stock operations</p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Date & Time</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Item Details</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Batch Info</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Type</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Quantity</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Staff</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {transaction.item?.name || 'Unknown Item'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {transaction.item?.sku || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {renderBatchInfo(transaction)}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {getTransactionBadge(transaction.transaction_type)}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center">
                          <span className={`font-semibold ${transaction.transaction_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.transaction_type === 'OUT' ? '-' : '+'}
                            {transaction.quantity} {transaction.item?.unit || ''}
                          </span>
                          {transaction.stock_after !== undefined && transaction.stock_after !== null ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Stock: {transaction.stock_after}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Current: {transaction.item?.current_stock || 'N/A'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {transaction.staff?.staff_name || 'System'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {transaction.reason ? (
                            <span className="line-clamp-2">{transaction.reason}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">No reason provided</span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
                {searchTerm && (
                  <span className="ml-2 text-blue-600">• Filtered by "{searchTerm}"</span>
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
                  Page {currentPage} of {Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= Math.ceil(filteredTransactions.length / PAGE_SIZE)}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}