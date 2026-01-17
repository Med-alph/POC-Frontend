import React from 'react';
import { Link } from 'react-router-dom';
import PlanStatusBadge from './PlanStatusBadge';
import { getTierIcon, getTierColor, getTierIconColor } from '../utils/tierIcons.jsx';

const PlanCard = ({ plan, features, onToggleStatus, onDelete, showActions = false }) => {

  const formatPrice = (price, billingCycle) => {
    if (price === 0) return 'Free';
    return `$${price}/${billingCycle === 'yearly' ? 'year' : 'month'}`;
  };



  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTierIconColor(plan.tier)}`}>
              {getTierIcon(plan.tier)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(plan.tier)}`}>
                  {plan.tier}
                </span>
                <PlanStatusBadge status={plan.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showActions && (
              <>
                <button
                  onClick={() => onToggleStatus(plan.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-50"
                  title={plan.status === 'active' ? 'Deactivate plan' : 'Activate plan'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>

                <Link
                  to={`/plans/edit/${plan.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                  title="Edit plan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>

                <button
                  onClick={() => onDelete(plan.id, plan.name)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                  title="Delete plan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.billing_cycle)}
          </div>
          {plan.price > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              Billed {plan.billing_cycle}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {plan.description && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600">{plan.description}</p>
        </div>
      )}

      {/* Features */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Features</h4>
        {plan.planFeatures && plan.planFeatures.length > 0 ? (
          <div className="space-y-2">
            {plan.planFeatures.slice(0, 4).map((planFeature, index) => (
              <div key={index} className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">
                  {planFeature.feature?.name || planFeature.feature_key}
                  {planFeature.limit_value && (
                    <span className="text-gray-500"> (up to {planFeature.limit_value})</span>
                  )}
                </span>
              </div>
            ))}
            {plan.planFeatures.length > 4 && (
              <div className="text-sm text-gray-500">
                +{plan.planFeatures.length - 4} more features
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No features configured</p>
        )}
      </div>

      {/* Footer */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
            <Link
              to={`/plans/edit/${plan.id}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit Plan →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCard;