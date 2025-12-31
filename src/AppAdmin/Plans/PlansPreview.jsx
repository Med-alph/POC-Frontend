import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import plansApi from '../../api/plansapi';
import featuresApi from '../../api/featuresapi';
import PlanPreview from './PlanPreview';
import toast from 'react-hot-toast';

const PlansPreview = () => {
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const [plansResponse, featuresResponse] = await Promise.all([
        plansApi.getAllPlans(),
        featuresApi.getAllFeatures()
      ]);
      // Only show active plans in preview
      setPlans(plansResponse.filter(plan => plan.status === 'active'));
      setFeatures(featuresResponse);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const sortPlansByTier = (plans) => {
    const tierOrder = { starter: 1, professional: 2, business: 3, enterprise: 4 };
    return plans.sort((a, b) => (tierOrder[a.tier] || 5) - (tierOrder[b.tier] || 5));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedPlans = sortPlansByTier(plans);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the perfect plan for your needs. Upgrade or downgrade at any time.
              </p>
            </div>
            <Link
              to="/app-admin/plans"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {sortedPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active plans available</h3>
            <p className="text-gray-500">Plans will appear here once they are activated.</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
              {sortedPlans.map((plan) => (
                <div key={plan.id} className="flex">
                  <PlanPreview plan={plan} features={features} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPreview;