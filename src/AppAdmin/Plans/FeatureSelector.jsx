import React, { useState } from 'react';
import FeatureToggle from '../components/FeatureToggle';

const FeatureSelector = ({ features, selectedFeatures, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    const category = feature.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  // Filter features based on search term
  const filteredFeaturesByCategory = Object.keys(featuresByCategory).reduce((acc, category) => {
    const filteredFeatures = featuresByCategory[category].filter(feature =>
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredFeatures.length > 0) {
      acc[category] = filteredFeatures;
    }
    return acc;
  }, {});

  const handleFeatureChange = (featureKey, enabled, limitValue = null) => {
    const updatedFeatures = [...selectedFeatures];
    const existingIndex = updatedFeatures.findIndex(f => f.feature_key === featureKey);

    if (enabled) {
      const featureData = {
        feature_key: featureKey,
        enabled: true,
        ...(limitValue !== null && { limit_value: limitValue })
      };

      if (existingIndex >= 0) {
        updatedFeatures[existingIndex] = featureData;
      } else {
        updatedFeatures.push(featureData);
      }
    } else {
      if (existingIndex >= 0) {
        updatedFeatures.splice(existingIndex, 1);
      }
    }

    onChange(updatedFeatures);
  };

  const isFeatureSelected = (featureKey) => {
    return selectedFeatures.some(f => f.feature_key === featureKey && f.enabled);
  };

  const getFeatureLimitValue = (featureKey) => {
    const feature = selectedFeatures.find(f => f.feature_key === featureKey);
    return feature?.limit_value || null;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      core: '🔧',
      premium: '⭐',
      enterprise: '👑',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category) => {
    const colors = {
      core: 'bg-blue-50 border-blue-200',
      premium: 'bg-green-50 border-green-200',
      enterprise: 'bg-purple-50 border-purple-200',
      other: 'bg-gray-50 border-gray-200'
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search features..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Features by Category */}
      <div className="space-y-4">
        {Object.keys(filteredFeaturesByCategory).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No features found matching your search' : 'No features available'}
          </div>
        ) : (
          Object.entries(filteredFeaturesByCategory).map(([category, categoryFeatures]) => (
            <div key={category} className={`border rounded-lg p-4 ${getCategoryColor(category)}`}>
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">{getCategoryIcon(category)}</span>
                <h4 className="text-sm font-medium text-gray-900 capitalize">
                  {category} Features ({categoryFeatures.length})
                </h4>
              </div>
              
              <div className="space-y-3">
                {categoryFeatures.map((feature) => (
                  <FeatureToggle
                    key={feature.key}
                    feature={feature}
                    enabled={isFeatureSelected(feature.key)}
                    limitValue={getFeatureLimitValue(feature.key)}
                    onChange={handleFeatureChange}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Features Summary */}
      {selectedFeatures.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Selected Features ({selectedFeatures.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedFeatures.map((selectedFeature) => {
              const feature = features.find(f => f.key === selectedFeature.feature_key);
              return (
                <span
                  key={selectedFeature.feature_key}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {feature?.name || selectedFeature.feature_key}
                  {selectedFeature.limit_value && (
                    <span className="ml-1 text-blue-600">({selectedFeature.limit_value})</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureSelector;