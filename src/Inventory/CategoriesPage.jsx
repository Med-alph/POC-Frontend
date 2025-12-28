import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Plus, Search, MoreHorizontal, FolderOpen, Edit, Archive, RotateCcw, Grid, List, RefreshCw, Download, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AddCategoryModal from './components/AddCategoryModal';
import ConfirmationModal from '../components/ui/confirmation-modal';
import toast, { Toaster } from 'react-hot-toast';
import inventoryAPI from '../api/inventoryapi';

export default function CategoriesPage() {
  const { categories, loading, filters, setFilters, loadCategories } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Statistics
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(cat => cat.is_active).length;
    const archived = categories.filter(cat => !cat.is_active).length;
    const withItems = categories.filter(cat => (cat.item_count || 0) > 0).length;
    return { total, active, archived, withItems };
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Archived filter
      const matchesArchived = filters.include_archived || category.is_active;
      
      return matchesSearch && matchesArchived;
    });
  }, [categories, searchTerm, filters.include_archived]);

  // Paginated categories
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage]);

  useEffect(() => {
    loadCategories();
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters.include_archived, searchTerm]);

  const handleRefresh = () => {
    loadCategories();
    toast.success("Categories data refreshed");
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Description', 'Items Count', 'Status', 'Created Date'],
      ...categories.map(category => [
        category.name,
        category.description || 'N/A',
        category.item_count || 0,
        category.is_active ? 'Active' : 'Archived',
        new Date(category.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Categories data exported");
  };

  const handleIncludeArchived = (checked) => {
    setFilters(prev => ({ ...prev, include_archived: checked }));
  };

  const handleEdit = (category) => {
    setEditCategory(category);
    setShowEditModal(true);
  };

  const handleArchiveRestore = (category) => {
    setSelectedCategory(category);
    setConfirmAction({
      type: category.is_active ? 'archive' : 'restore',
      title: category.is_active ? 'Archive Category' : 'Restore Category',
      description: category.is_active 
        ? `Are you sure you want to archive "${category.name}"? This will hide it from the active categories list.`
        : `Are you sure you want to restore "${category.name}"? This will make it active again.`,
      confirmText: category.is_active ? 'Archive' : 'Restore',
      variant: category.is_active ? 'destructive' : 'default'
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedCategory || !confirmAction) return;

    setActionLoading(true);
    try {
      if (confirmAction.type === 'archive') {
        await inventoryAPI.deleteCategory(selectedCategory.id);
        toast.success(`Category "${selectedCategory.name}" has been archived`);
      } else if (confirmAction.type === 'restore') {
        await inventoryAPI.restoreCategory(selectedCategory.id);
        toast.success(`Category "${selectedCategory.name}" has been restored`);
      }
      
      // Refresh the categories list
      loadCategories();
      setShowConfirmModal(false);
      setSelectedCategory(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Action failed:', error);
      toast.error(`Failed to ${confirmAction.type} category. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditCategory(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditCategory(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Categories Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Organize your inventory items into categories</p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Categories</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <FolderOpen className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <div className="h-6 w-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">With Items</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.withItems}</p>
                </div>
                <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Archived</p>
                  <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{stats.archived}</p>
                </div>
                <div className="h-6 w-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-gray-600 dark:text-gray-400 rounded-full"></div>
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
                  placeholder="Search categories..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-archived-categories"
                  checked={filters.include_archived}
                  onCheckedChange={handleIncludeArchived}
                />
                <label htmlFor="include-archived-categories" className="text-sm font-medium">
                  Include Archived
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <span>{filteredCategories.length} of {categories.length} categories</span>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm font-medium rounded-md"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Display */}
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading categories...</div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {categories.length === 0 ? 'No categories found' : 'No categories match your filters'}
              </p>
              {categories.length === 0 ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Category
                </Button>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Category Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Description</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Items Count</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow 
                      key={category.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${!category.is_active ? 'opacity-60' : ''}`}
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Created {new Date(category.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {category.description ? (
                            <span className="line-clamp-2">{category.description}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">No description</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="font-medium">
                          {category.item_count || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge 
                          variant={category.is_active ? "outline" : "secondary"}
                          className={category.is_active 
                            ? "border-green-500 text-green-700 bg-green-50" 
                            : "bg-gray-100 text-gray-600"
                          }
                        >
                          {category.is_active ? 'Active' : 'Archived'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleArchiveRestore(category)}
                              className={category.is_active ? "text-red-600" : "text-blue-600"}
                            >
                              {category.is_active ? (
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCategories.map((category) => (
                  <Card key={category.id} className={`hover:shadow-md transition-shadow ${!category.is_active ? 'opacity-75' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className={`text-base font-semibold truncate ${!category.is_active ? 'text-gray-600' : ''}`}>
                            {category.name}
                          </CardTitle>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleArchiveRestore(category)}
                              className={category.is_active ? "text-red-600" : "text-blue-600"}
                            >
                              {category.is_active ? (
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
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {category.item_count || 0} items
                        </Badge>
                        <Badge 
                          variant={category.is_active ? "outline" : "secondary"}
                          className={category.is_active 
                            ? "border-green-500 text-green-700" 
                            : ""
                          }
                        >
                          {category.is_active ? 'Active' : 'Archived'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        {filteredCategories.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {paginatedCategories.length} of {filteredCategories.length} categories
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
                  Page {currentPage} of {Math.ceil(filteredCategories.length / PAGE_SIZE) || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= Math.ceil(filteredCategories.length / PAGE_SIZE)}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddCategoryModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
          />
        )}

        {showEditModal && (
          <AddCategoryModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            editCategory={editCategory}
          />
        )}

        {showConfirmModal && confirmAction && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedCategory(null);
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