// src/modules/procedures/ProcedureList.jsx
// Main Procedure Management UI (list + search/filter/pagination + CRUD modals)

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Search, Loader2, Edit2, Trash2 } from 'lucide-react';
import procedureService from './procedure.service';
import ProcedureFormModal from './ProcedureFormModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

/**
 * @typedef {Object} Procedure
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} category
 * @property {string} description
 * @property {number} default_cost
 * @property {number} estimated_duration
 * @property {boolean} is_active
 */

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Simple client-side pagination fallback in case backend doesn't support it
const DEFAULT_PAGE_SIZE = 10;

const ProcedureList = () => {
  const { toast } = useToast?.() || { toast: null };

  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState(null);
  const [formFieldErrors, setFormFieldErrors] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProcedure, setDeletingProcedure] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input for 400ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to first page on search change
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  // Fetch procedures whenever filters change
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Map statusFilter -> is_active param
        let isActive = undefined;
        if (statusFilter === 'active') isActive = true;
        if (statusFilter === 'inactive') isActive = false;

        const response = await procedureService.listProcedures({
          search: debouncedSearch,
          isActive,
          page,
          pageSize,
        });

        // Support both paginated and non-paginated backend responses.
        // Expected shapes:
        // - { items: [...], total: 123 }
        // - or plain array [...]
        let items = [];
        let total = 0;

        if (Array.isArray(response)) {
          items = response;
          total = response.length;
        } else if (response && Array.isArray(response.items)) {
          items = response.items;
          total = typeof response.total === 'number' ? response.total : response.items.length;
        } else {
          items = [];
          total = 0;
        }

        if (!isCancelled) {
          setProcedures(items);
          setTotalItems(total);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load procedures', err);
          setError(err.message || 'Failed to load procedures');
          if (toast) {
            toast({
              title: 'Error loading procedures',
              description: err.message || 'Unexpected error occurred.',
              variant: 'destructive',
            });
          }
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setInitialFetchDone(true);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, statusFilter, page, pageSize, toast]);

  const currentPageCount = procedures.length;
  const totalPages = useMemo(() => {
    if (!totalItems || pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const handleAddClick = () => {
    setEditingProcedure(null);
    setFormServerError(null);
    setFormFieldErrors(null);
    setFormOpen(true);
  };

  const handleEditClick = (proc) => {
    setEditingProcedure(proc);
    setFormServerError(null);
    setFormFieldErrors(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    if (formSubmitting) return;
    setFormOpen(false);
    setEditingProcedure(null);
    setFormServerError(null);
    setFormFieldErrors(null);
  };

  const reloadAfterChange = async () => {
    // simple: trigger reload by re-running effect – change page to itself
    setPage((prev) => prev);
  };

  const extractFieldErrors = (error) => {
    if (!error) return null;
    if (error.fieldErrors && typeof error.fieldErrors === 'object') {
      // Backend already sent structured field errors
      const normalized = {};
      Object.entries(error.fieldErrors).forEach(([k, v]) => {
        if (Array.isArray(v)) normalized[k] = v.join(', ');
        else if (typeof v === 'string') normalized[k] = v;
      });
      return normalized;
    }
    if (error.raw && typeof error.raw === 'object') {
      // Try to infer from common patterns
      if (error.raw.errors && typeof error.raw.errors === 'object') {
        const normalized = {};
        Object.entries(error.raw.errors).forEach(([k, v]) => {
          if (Array.isArray(v)) normalized[k] = v.join(', ');
          else if (typeof v === 'string') normalized[k] = v;
        });
        return normalized;
      }
    }
    return null;
  };

  const handleFormSubmit = async (values) => {
    setFormSubmitting(true);
    setFormServerError(null);
    setFormFieldErrors(null);

    try {
      if (editingProcedure && editingProcedure.id) {
        await procedureService.updateProcedure(editingProcedure.id, values);
        if (toast) {
          toast({
            title: 'Procedure updated',
            description: `"${values.name}" has been updated successfully.`,
          });
        }
      } else {
        await procedureService.createProcedure(values);
        if (toast) {
          toast({
            title: 'Procedure created',
            description: `"${values.name}" has been added to the catalog.`,
          });
        }
      }

      setFormOpen(false);
      setEditingProcedure(null);
      await reloadAfterChange();
    } catch (err) {
      console.error('Failed to submit procedure form', err);
      const fieldErrs = extractFieldErrors(err);
      setFormFieldErrors(fieldErrs);
      setFormServerError(
        err.message || 'Failed to save procedure. Please try again.'
      );
      if (toast) {
        toast({
          title: 'Save failed',
          description: err.message || 'Please review the form and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (proc) => {
    setDeletingProcedure(proc);
    setDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeletingProcedure(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProcedure) return;
    setDeleting(true);

    try {
      await procedureService.deleteProcedure(deletingProcedure.id);

      // Optimistic UI update
      setProcedures((prev) =>
        prev.filter((p) => p.id !== deletingProcedure.id)
      );
      setTotalItems((prev) => Math.max(0, prev - 1));

      if (toast) {
        toast({
          title: 'Procedure deleted',
          description: `"${deletingProcedure.name}" has been deleted from the catalog.`,
        });
      }
    } catch (err) {
      console.error('Failed to delete procedure', err);
      if (toast) {
        toast({
          title: 'Delete failed',
          description: err.message || 'Unable to delete this procedure.',
          variant: 'destructive',
        });
      }
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeletingProcedure(null);
      // Optionally reload to ensure list is in sync
      setPage((prev) => prev);
    }
  };

  const statusPill = (isActive) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const renderTableBody = () => {
    if (loading && !initialFetchDone) {
      return (
        <tr>
          <td
            colSpan={7}
            className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Loading procedures...
            </span>
          </td>
        </tr>
      );
    }

    if (!loading && initialFetchDone && procedures.length === 0) {
      return (
        <tr>
          <td
            colSpan={7}
            className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex flex-col items-center gap-2">
              <ClipboardList className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">No procedures found</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Try adjusting filters or add a new procedure to your master catalog.
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return procedures.map((proc) => (
      <tr
        key={proc.id}
        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors"
      >
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-50 font-medium">
          {proc.name}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
          {proc.code || '-'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
          {proc.category || '-'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
          {proc.default_cost != null && proc.default_cost !== ''
            ? `₹${Number(proc.default_cost).toLocaleString()}`
            : '-'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
          {proc.estimated_duration != null && proc.estimated_duration !== ''
            ? `${proc.estimated_duration} min`
            : '-'}
        </td>
        <td className="px-4 py-3">{statusPill(proc.is_active)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleEditClick(proc)}
              className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(proc)}
              className="inline-flex items-center rounded-md border border-red-100 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/60"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Procedure Catalog
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage procedure master data for your EMR. This does not perform billing
              or payment actions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Procedure
          </button>
        </div>

        {/* Filters / Search */}
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="w-full lg:max-w-sm">
                <label
                  htmlFor="procedure-search"
                  className="sr-only"
                >
                  Search procedures
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="procedure-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, code, or category..."
                    className="block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status:
                </span>
                <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-0.5">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(filter.value);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === filter.value
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Code
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Default Cost
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Est. Duration
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-950">
                {renderTableBody()}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination / Error */}
          <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              {loading && initialFetchDone && (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  Refreshing...
                </span>
              )}
              {!loading && (
                <span>
                  Showing {currentPageCount} of {totalItems} procedure
                  {totalItems === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-500 truncate max-w-xs sm:max-w-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => (p < totalPages ? p + 1 : p))
                }
                disabled={page >= totalPages || loading}
                className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <ProcedureFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingProcedure}
        submitting={formSubmitting}
        serverError={formServerError}
        fieldErrors={formFieldErrors}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deletingProcedure?.name}
        isDeleting={deleting}
        title="Delete Procedure"
        message="Are you sure you want to delete this procedure from the master catalog?"
        confirmLabel="Delete Procedure"
      />
    </div>
  );
};

export default ProcedureList;



