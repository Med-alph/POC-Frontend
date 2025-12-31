import React, { useState, useEffect } from 'react';

const FeatureForm = ({ feature, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'core',
    type: 'boolean'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (feature) {
      setFormData({
        key: feature.key || '',
        name: feature.name || '',
        description: feature.description || '',
        category: feature.category || 'core',
        type: feature.type || 'boolean'
      });
    }
  }, [feature]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate key from name if creating new feature
    if (name === 'name' && !feature) {
      const generatedKey = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        key: generatedKey
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.key.trim()) {
      newErrors.key = 'Feature key is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      newErrors.key = 'Key must contain only lowercase letters, numbers, and underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Feature name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const predefinedFeatures = [
    { key: 'patients_limit', name: 'Patient Records Limit', type: 'limit', category: 'core' },
    { key: 'appointments_limit', name: 'Appointments Limit', type: 'limit', category: 'core' },
    { key: 'staff_limit', name: 'Staff Members Limit', type: 'limit', category: 'core' },
    { key: 'video_calls', name: 'Video Consultations', type: 'boolean', category: 'premium' },
    { key: 'ai_analysis', name: 'AI Medical Analysis', type: 'boolean', category: 'enterprise' },
    { key: 'whatsapp_integration', name: 'WhatsApp Integration', type: 'boolean', category: 'premium' },
    { key: 'telegram_integration', name: 'Telegram Integration', type: 'boolean', category: 'premium' },
    { key: 'inventory_management', name: 'Inventory Management', type: 'boolean', category: 'premium' },
    { key: 'advanced_reports', name: 'Advanced Analytics', type: 'boolean', category: 'premium' },
    { key: 'api_access', name: 'REST API Access', type: 'boolean', category: 'developer' },
    { key: 'custom_branding', name: 'Custom Branding', type: 'boolean', category: 'enterprise' },
    { key: 'priority_support', name: '24/7 Priority Support', type: 'boolean', category: 'enterprise' }
  ];

  const handlePredefinedSelect = (predefined) => {
    setFormData({
      key: predefined.key,
      name: predefined.name,
      description: `Enable ${predefined.name.toLowerCase()} functionality`,
      category: predefined.category,
      type: predefined.type
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Predefined Features (only for new features) */}
      {!feature && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Quick Start - Common Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {predefinedFeatures.map((predefined) => (
              <button
                key={predefined.key}
                type="button"
                onClick={() => handlePredefinedSelect(predefined)}
                className="text-left p-2 text-xs bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-blue-900">{predefined.name}</div>
                <div className="text-blue-600">{predefined.category} • {predefined.type}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Feature Name *
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
            placeholder="e.g., Video Consultations"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700">
            Feature Key *
          </label>
          <input
            type="text"
            id="key"
            name="key"
            value={formData.key}
            onChange={handleInputChange}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.key ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., video_calls"
            disabled={!!feature} // Disable editing key for existing features
          />
          {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier using lowercase letters, numbers, and underscores only
          </p>
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
          placeholder="Describe what this feature provides..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="core">Core - Essential features</option>
            <option value="premium">Premium - Advanced features</option>
            <option value="enterprise">Enterprise - High-end features</option>
            <option value="developer">Developer - API & Integration</option>
            <option value="other">Other</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.type ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="boolean">Boolean - On/Off feature</option>
            <option value="limit">Limit - Feature with usage limits</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.type === 'boolean' 
              ? 'Feature can be enabled or disabled'
              : 'Feature has configurable usage limits (e.g., max patients, API calls)'
            }
          </p>
        </div>
      </div>

      {/* Example Usage */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Key:</strong> {formData.key || 'feature_key'}</p>
          <p><strong>Name:</strong> {formData.name || 'Feature Name'}</p>
          <p><strong>Type:</strong> {formData.type === 'boolean' ? 'Enable/Disable' : 'Usage Limit'}</p>
          <p><strong>Category:</strong> {formData.category}</p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {feature ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature ? 'Update Feature' : 'Create Feature'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FeatureForm;