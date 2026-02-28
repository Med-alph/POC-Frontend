// src/modules/procedures/ProcedureFormModal.jsx
// Reusable Create/Edit modal for Procedure master
// - Validates fields locally
// - Surfaces backend field errors
// - Shows loading state on submit

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * @typedef {Object} ProcedureFormValues
 * @property {string} name
 * @property {string} code
 * @property {string} category
 * @property {string} description
 * @property {number | ''} default_cost
 * @property {number | ''} estimated_duration
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} ProcedureFormModalProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {(values: ProcedureFormValues) => Promise<void>} onSubmit
 * @property {ProcedureFormValues | null} initialData
 * @property {boolean} submitting
 * @property {string | null} serverError
 * @property {Record<string, string> | null} fieldErrors
 */

const emptyForm = {
  name: '',
  code: '',
  category: '',
  description: '',
  default_cost: '',
  estimated_duration: '',
  is_active: true,
};

const ProcedureFormModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
  submitting,
  serverError,
  fieldErrors,
}) => {
  const { toast } = useToast?.() || { toast: null };
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Initialize/reset form when modal is opened or initial data changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setValues({
          name: initialData.name || '',
          code: initialData.code || '',
          category: initialData.category || '',
          description: initialData.description || '',
          default_cost:
            initialData.default_cost !== undefined && initialData.default_cost !== null
              ? Number(initialData.default_cost)
              : '',
          estimated_duration:
            initialData.estimated_duration !== undefined &&
            initialData.estimated_duration !== null
              ? Number(initialData.estimated_duration)
              : '',
          is_active:
            typeof initialData.is_active === 'boolean' ? initialData.is_active : true,
        });
      } else {
        setValues(emptyForm);
      }
      setErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};

    if (!values.name || values.name.trim().length < 3) {
      newErrors.name = 'Name is required and must be at least 3 characters';
    }

    if (values.default_cost !== '' && Number(values.default_cost) <= 0) {
      newErrors.default_cost = 'Default cost must be a positive number';
    }

    if (
      values.estimated_duration !== '' &&
      (!Number.isInteger(Number(values.estimated_duration)) ||
        Number(values.estimated_duration) <= 0)
    ) {
      newErrors.estimated_duration =
        'Estimated duration must be a positive integer (minutes)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      if (toast) {
        toast({
          title: 'Validation error',
          description: 'Please fix the highlighted fields.',
          variant: 'destructive',
        });
      }
      return;
    }

    const payload = {
      ...values,
      default_cost:
        values.default_cost === '' ? null : Number(values.default_cost),
      estimated_duration:
        values.estimated_duration === '' ? null : Number(values.estimated_duration),
    };

    await onSubmit(payload);
  };

  const mergedFieldError = (field) => {
    return fieldErrors?.[field] || errors[field] || null;
  };

  const title = initialData ? 'Edit Procedure' : 'Add Procedure';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage procedure master data (not billing or payments).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {serverError}
            </div>
          )}

          {/* Row 1: Name + Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="procedure-name"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="procedure-name"
                type="text"
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  mergedFieldError('name')
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g. MRI Brain"
                required
                minLength={3}
              />
              {mergedFieldError('name') && (
                <p className="mt-1 text-xs text-red-600">
                  {mergedFieldError('name')}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="procedure-code"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Code
              </label>
              <input
                id="procedure-code"
                type="text"
                value={values.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  mergedFieldError('code')
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g. PROC-001"
              />
              {mergedFieldError('code') && (
                <p className="mt-1 text-xs text-red-600">
                  {mergedFieldError('code')}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Category + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="procedure-category"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category
              </label>
              <input
                id="procedure-category"
                type="text"
                value={values.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  mergedFieldError('category')
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g. Radiology, Surgery"
              />
              {mergedFieldError('category') && (
                <p className="mt-1 text-xs text-red-600">
                  {mergedFieldError('category')}
                </p>
              )}
            </div>

            {/* Status toggle */}
            <div className="flex flex-col justify-between">
              <label
                htmlFor="procedure-status"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Status
              </label>
              <button
                id="procedure-status"
                type="button"
                onClick={() => handleChange('is_active', !values.is_active)}
                className={`inline-flex items-center justify-between rounded-full px-3 py-1.5 text-xs font-medium border ${
                  values.is_active
                    ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700'
                    : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
                aria-pressed={values.is_active}
              >
                <span>{values.is_active ? 'Active' : 'Inactive'}</span>
                <span
                  className={`ml-2 inline-flex h-4 w-7 items-center rounded-full border ${
                    values.is_active
                      ? 'bg-green-500 border-green-600'
                      : 'bg-gray-400 border-gray-500'
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full bg-white transform transition-transform ${
                      values.is_active ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Row 3: Cost + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="procedure-default-cost"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Default Cost
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-gray-400">
                  ₹
                </span>
                <input
                  id="procedure-default-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.default_cost}
                  onChange={(e) =>
                    handleChange('default_cost', e.target.value === '' ? '' : e.target.value)
                  }
                  className={`block w-full rounded-md border pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    mergedFieldError('default_cost')
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder="e.g. 1500"
                />
              </div>
              {mergedFieldError('default_cost') && (
                <p className="mt-1 text-xs text-red-600">
                  {mergedFieldError('default_cost')}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="procedure-estimated-duration"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Estimated Duration (minutes)
              </label>
              <input
                id="procedure-estimated-duration"
                type="number"
                min="0"
                step="1"
                value={values.estimated_duration}
                onChange={(e) =>
                  handleChange(
                    'estimated_duration',
                    e.target.value === '' ? '' : e.target.value
                  )
                }
                className={`block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  mergedFieldError('estimated_duration')
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="e.g. 45"
              />
              {mergedFieldError('estimated_duration') && (
                <p className="mt-1 text-xs text-red-600">
                  {mergedFieldError('estimated_duration')}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="procedure-description"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="procedure-description"
              rows={3}
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                mergedFieldError('description')
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="Additional notes or description for internal reference."
            />
            {mergedFieldError('description') && (
              <p className="mt-1 text-xs text-red-600">
                {mergedFieldError('description')}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && (
                <span className="mr-2 inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {initialData ? 'Save Changes' : 'Create Procedure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcedureFormModal;



