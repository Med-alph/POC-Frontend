import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import plansApi from '../../api/plansapi';
import featuresApi from '../../api/featuresapi';
import PlanForm from './PlanForm';
import PlanPreview from './PlanPreview';
import toast from 'react-hot-toast';

const PlansEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [plan, setPlan] = useState({
    name: '',
    tier: 'starter',
    price: 0,
    billing_cycle: 'monthly',
    status: 'draft',
    description: '',
    features: []
  });
  
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Add handler for real-time plan updates
  const handlePlanChange = (updatedPlan) => {
    setPlan(updatedPlan);
  };

  useEffect(() => {
    loadFeatures();
    if (isEditing) {
      loadPlan();
    }
  }, [id]);

  const loadFeatures = async () => {
    try {
      const response = await featuresApi.getAllFeatures();
      setFeatures(response);
    } catch (error) {
      console.error('Failed to load features:', error);
      toast.error('Failed to load features');
    }
  };

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await plansApi.getPlanById(id);
      
      // Transform plan features for the form
      const planFeatures = response.planFeatures?.map(pf => ({
        feature_key: pf.feature_key,
        enabled: pf.enabled,
        limit_value: pf.limit_value
      })) || [];

      setPlan({
        name: response.name,
        tier: response.tier,
        price: response.price,
        billing_cycle: response.billing_cycle,
        status: response.status,
        description: response.description || '',
        features: planFeatures
      });
    } catch (error) {
      console.error('Failed to load plan:', error);
      toast.error('Failed to load plan');
      navigate('/app-admin/plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planData) => {
    try {
      setSaving(true);
      
      if (isEditing) {
        await plansApi.updatePlan(id, planData);
        toast.success('Plan updated successfully');
      } else {
        await plansApi.createPlan(planData);
        toast.success('Plan created successfully');
      }
      
      navigate('/app-admin/plans');
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} plan`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Plan' : 'Create New Plan'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update plan details and features' : 'Configure a new subscription plan'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button
            onClick={() => navigate('/app-admin/plans')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          <PlanForm
            plan={plan}
            features={features}
            onSave={handleSave}
            onPlanChange={handlePlanChange}
            saving={saving}
            isEditing={isEditing}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                How this plan will appear to clients
              </p>
            </div>
            <PlanPreview plan={plan} features={features} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansEditor;