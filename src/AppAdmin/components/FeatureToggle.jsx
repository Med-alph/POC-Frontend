import React, { useState } from 'react';

const FeatureToggle = ({ feature, enabled, limitValue, onChange }) => {
  const [localLimitValue, setLocalLimitValue] = useState(limitValue || 0);

  const handleToggle = () => {
    if (!enabled && feature.type === 'limit') {
      // When enabling a limit feature, set a default value if none exists
      const defaultLimit = localLimitValue || 100;
      setLocalLimitValue(defaultLimit);
      onChange(feature.key, true, defaultLimit);
    } else {
      onChange(feature.key, !enabled, feature.type === 'limit' ? (localLimitValue || 0) : null);
    }
  };

  const handleLimitChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setLocalLimitValue(value);
    if (enabled) {
      onChange(feature.key, true, value);
    }
  };

  const getFeatureIcon = (type) => {
    return type === 'limit' ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3 flex-1">
        <div className="flex-shrink-0 mt-0.5 text-blue-600">
          {getFeatureIcon(feature.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900">{feature.name}</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {feature.type}
            </span>
          </div>
          
          {feature.description && (
            <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
          )}
          
          <p className="text-xs text-gray-400 mt-1">Key: {feature.key}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Limit Value Input (for limit type features) */}
        {feature.type === 'limit' && enabled && (
          <div className="flex items-center space-x-2">
            <label htmlFor={`limit-${feature.key}`} className="text-sm text-gray-600">
              Limit:
            </label>
            <input
              id={`limit-${feature.key}`}
              type="number"
              min="1"
              value={localLimitValue}
              onChange={handleLimitChange}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
            />
          </div>
        )}

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-labelledby={`toggle-${feature.key}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default FeatureToggle;