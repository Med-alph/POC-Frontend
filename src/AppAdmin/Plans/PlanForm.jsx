import React, { useState, useEffect } from 'react';
import FeatureSelector from './FeatureSelector';
import { getTierIcon, getTierColor, getTierIconColor } from '../utils/tierIcons.jsx';

const PlanForm = ({ plan, features, onSave, onPlanChange, saving, isEditing }) => {
  const [formData, setFormData] = useState(plan);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(plan);
  }, [plan]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    const updatedData = {
      ...formData,
      [name]: newValue
    };
    
    setFormData(updatedData);
    
    // Notify parent of changes for real-time preview
    if (onPlanChange) {
      onPlanChange(updatedData);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFeaturesChange = (features) => {
    const updatedData = {
      ...formData,
      features
    };
    
    setFormData(updatedData);
    
    // Notify parent of changes for real-time preview
    if (onPlanChange) {
      onPlanChange(updatedData);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.tier) {
      newErrors.tier = 'Plan tier is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (!formData.billing_cycle) {
      newErrors.billing_cycle = 'Billing cycle is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert data types for backend compatibility
    const processedData = {
      ...formData,
      price: parseFloat(formData.price) || 0, // Convert string to number
      features: formData.features.map(feature => ({
        ...feature,
        limit_value: feature.limit_value ? parseInt(feature.limit_value) : undefined // Convert string to number
      }))
    };

    onSave(processedData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Plan Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Professional Plan"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
              Plan Tier *
            </label>
            <div className="mt-1 relative">
              <select
                id="tier"
                name="tier"
                value={formData.tier}
                onChange={handleInputChange}
                className={`block w-full border rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tier ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${getTierIconColor(formData.tier)}`}>
                {getTierIcon(formData.tier)}
              </div>
            </div>
            {errors.tier && <p className="mt-1 text-sm text-red-600">{errors.tier}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe what this plan offers..."
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className={`block w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="billing_cycle" className="block text-sm font-medium text-gray-700">
              Billing Cycle *
            </label>
            <select
              id="billing_cycle"
              name="billing_cycle"
              value={formData.billing_cycle}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.billing_cycle ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            {errors.billing_cycle && <p className="mt-1 text-sm text-red-600">{errors.billing_cycle}</p>}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Status</h3>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Plan Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Draft plans are not visible to clients. Active plans are available for subscription.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Features</h3>
        <FeatureSelector
          features={features}
          selectedFeatures={formData.features}
          onChange={handleFeaturesChange}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? 'Update Plan' : 'Create Plan'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PlanForm;