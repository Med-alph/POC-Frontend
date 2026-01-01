import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PlanSelectionCard = ({ plan, features, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const getTierIcon = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'starter':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'professional':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'business':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'enterprise':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        );
    }
  };

  // Get feature details for selected features
  const selectedFeatureDetails = plan.features?.map(planFeature => {
    const featureDetail = features.find(f => f.key === planFeature.feature_key || f.id === planFeature.feature_id);
    return {
      ...featureDetail,
      ...planFeature,
      name: featureDetail?.name || planFeature.feature_key
    };
  }).filter(Boolean) || [];

  // Group features by category
  const featuresByCategory = selectedFeatureDetails.reduce((acc, feature) => {
    const category = feature.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  return (
    <div 
      className={`relative bg-white border-2 rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer transform min-h-[600px] flex flex-col ${
        isSelected 
          ? 'border-blue-500 ring-4 ring-blue-100 scale-105' 
          : isHovered 
          ? 'border-gray-300 shadow-xl scale-102' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${getGradientColor(plan.tier)} px-6 py-8 text-white text-center`}>
        <div className="text-white text-4xl mb-3 flex justify-center">
          {getTierIcon(plan.tier)}
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <div className="flex items-center justify-center mt-3">
          <span className="bg-black bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium text-white border border-white border-opacity-30">
            {plan.tier}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="px-6 py-6 text-center border-b border-gray-100">
        <div className="text-4xl font-bold text-gray-900">
          {formatPrice(plan.price, plan.billing_cycle)}
        </div>
        {plan.price > 0 && (
          <div className="text-sm text-gray-500 mt-2">
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
            <p className="text-sm text-gray-500">No features configured</p>
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
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
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
        <Button
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
            isSelected 
              ? `bg-gradient-to-r ${getGradientColor(plan.tier)}` 
              : `bg-gradient-to-r ${getGradientColor(plan.tier)} opacity-80 hover:opacity-100`
          }`}
        >
          {isSelected ? 'Selected' : 'Select Plan'}
        </Button>
      </div>
    </div>
  );
};

export default PlanSelectionCard;