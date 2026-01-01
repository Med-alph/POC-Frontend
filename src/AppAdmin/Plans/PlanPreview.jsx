import React from 'react';
import PlanStatusBadge from '../components/PlanStatusBadge';
import { getTierIcon, getTierColor } from '../utils/tierIcons.jsx';

const PlanPreview = ({ plan, features }) => {
  const formatPrice = (price, billingCycle) => {
    if (price === 0) return 'Free';
    return `$${price}/${billingCycle === 'yearly' ? 'year' : 'month'}`;
  };



  const getGradientColor = (tier) => {
    const colors = {
      starter: 'from-blue-500 to-blue-600',
      professional: 'from-green-500 to-green-600',
      business: 'from-purple-500 to-purple-600',
      enterprise: 'from-yellow-500 to-yellow-600'
    };
    return colors[tier?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  // Get feature details for selected features - updated to work with API response
  const selectedFeatureDetails = plan.planFeatures?.map(planFeature => {
    const featureDetail = features.find(f => f.key === planFeature.feature_key || f.id === planFeature.feature_id);
    return {
      ...featureDetail,
      ...planFeature,
      name: featureDetail?.name || planFeature.feature_key
    };
  }).filter(Boolean) || [];

  // Group features by category for better display
  const featuresByCategory = selectedFeatureDetails.reduce((acc, feature) => {
    const category = feature.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  return (
    <div className="w-full h-full">
      {/* Plan Card Preview */}
      <div className="w-full h-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getGradientColor(plan.tier)} px-6 py-8 text-white text-center`}>
          <div className="text-white text-4xl mb-2 flex justify-center">
            {getTierIcon(plan.tier)}
          </div>
          <h3 className="text-xl font-bold">{plan.name || 'Plan Name'}</h3>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <span className="bg-black bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium text-white border border-white border-opacity-30">
              {plan.tier}
            </span>
            <span className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium">
              <span className="mr-1">
                {plan.status === 'active' ? (
                  <svg className="w-3 h-3 inline text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : plan.status === 'draft' ? (
                  <svg className="w-3 h-3 inline text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 inline text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <span className={`${
                plan.status === 'active' ? 'text-green-700' : 
                plan.status === 'draft' ? 'text-yellow-700' : 
                'text-red-700'
              }`}>
                {plan.status === 'active' ? 'Active' : 
                 plan.status === 'draft' ? 'Draft' : 
                 plan.status === 'inactive' ? 'Inactive' : 
                 plan.status || 'Unknown'}
              </span>
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="px-6 py-6 text-center border-b border-gray-100">
          <div className="text-4xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.billing_cycle)}
          </div>
          {plan.price > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              Billed {plan.billing_cycle}
            </div>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-600 text-center">{plan.description}</p>
          </div>
        )}

        {/* Features */}
        <div className="px-6 py-6 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 text-center">
            What's Included
          </h4>
          
          {Object.keys(featuresByCategory).length === 0 ? (
            <div className="text-center py-4">
              <div className="text-gray-400 text-2xl mb-2">
                <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No features selected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
                <div key={category}>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {category} Features
                  </h5>
                  <div className="space-y-2">
                    {categoryFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">
                          {feature.name}
                          {feature.limit_value && (
                            <span className="text-gray-500 ml-1">
                              (up to {feature.limit_value})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="px-6 py-6 bg-gray-50 mt-auto">
          <button
            disabled
            className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r ${getGradientColor(plan.tier)} opacity-75 cursor-not-allowed`}
          >
            Choose {plan.name || 'This Plan'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Preview only - not functional
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanPreview;