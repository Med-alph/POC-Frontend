import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import featuresApi from '../../api/featuresapi';
import FeatureForm from './FeatureForm';
import { getCategoryIcon, getCategoryColor, getCategoryIconColor } from '../utils/categoryIcons.jsx';
import toast from 'react-hot-toast';

const FeaturesManagement = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [deletingFeature, setDeletingFeature] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await featuresApi.getAllFeatures();
      setFeatures(response);
    } catch (error) {
      console.error('Failed to load features:', error);
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async (featureData) => {
    try {
      await featuresApi.createFeature(featureData);
      toast.success('Feature created successfully');
      setShowCreateForm(false);
      loadFeatures();
    } catch (error) {
      console.error('Failed to create feature:', error);
      toast.error(error.message || 'Failed to create feature');
    }
  };

  const handleUpdateFeature = async (id, featureData) => {
    try {
      await featuresApi.updateFeature(id, featureData);
      toast.success('Feature updated successfully');
      setEditingFeature(null);
      loadFeatures();
    } catch (error) {
      console.error('Failed to update feature:', error);
      toast.error(error.message || 'Failed to update feature');
    }
  };

  const handleDeleteFeature = async (id, featureName) => {
    setDeletingFeature({ id, name: featureName });
  };

  const confirmDeleteFeature = async () => {
    if (!deletingFeature) return;

    try {
      await featuresApi.deleteFeature(deletingFeature.id);
      toast.success('Feature deleted successfully');
      setDeletingFeature(null);
      loadFeatures();
    } catch (error) {
      console.error('Failed to delete feature:', error);
      toast.error(error.message || 'Failed to delete feature');
    }
  };

  // Filter features
  const filteredFeatures = features.filter(feature => {
    const matchesSearch = 
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || feature.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group features by category
  const featuresByCategory = filteredFeatures.reduce((acc, feature) => {
    const category = feature.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});



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
          <h1 className="text-2xl font-bold text-gray-900">Features Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage features for subscription plans ({filteredFeatures.length} features)
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Feature
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search features</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search features by name or key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <label htmlFor="filter" className="sr-only">Filter by category</label>
            <select
              id="filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="core">Core</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
              <option value="developer">Developer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Features by Category */}
      {Object.keys(featuresByCategory).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first feature'
            }
          </p>
          {(!searchTerm && filterCategory === 'all') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Feature
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
            <div key={category} className={`border rounded-lg ${getCategoryColor(category)}`}>
              <div className="px-6 py-4 border-b border-current border-opacity-20">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${getCategoryIconColor(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {category} Features ({categoryFeatures.length})
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryFeatures.map((feature) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      onEdit={setEditingFeature}
                      onDelete={handleDeleteFeature}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Feature Modal */}
      {showCreateForm && (
        <FeatureFormModal
          title="Create New Feature"
          onSave={handleCreateFeature}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Feature Modal */}
      {editingFeature && (
        <FeatureFormModal
          title="Edit Feature"
          feature={editingFeature}
          onSave={(data) => handleUpdateFeature(editingFeature.id, data)}
          onClose={() => setEditingFeature(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingFeature && (
        <DeleteConfirmationModal
          featureName={deletingFeature.name}
          onConfirm={confirmDeleteFeature}
          onCancel={() => setDeletingFeature(null)}
        />
      )}
    </div>
  );
};

const FeatureCard = ({ feature, onEdit, onDelete }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'boolean':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'limit':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 5.07a11.952 11.952 0 003.994 1.93M15 9.94c0-1.92.297-3.718.845-5.433M19.5 9.94c0-1.92-.297-3.718-.845-5.433M12 18.364A11.952 11.952 0 008.006 16.43M9 9.94c0 1.92-.297 3.718-.845 5.433M4.5 9.94c0 1.92.297 3.718.845 5.433" />
          </svg>
        );
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
      case 'json':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getTypeBadge = (type) => {
    return type === 'limit' 
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : type === 'boolean'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : type === 'text'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">{getTypeIcon(feature.type)}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(feature.type)}`}>
            {feature.type}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(feature)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit feature"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(feature.id, feature.name)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete feature"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-1">{feature.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
      <p className="text-xs text-gray-400">Key: {feature.key}</p>
    </div>
  );
};

const FeatureFormModal = ({ title, feature, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <FeatureForm
            feature={feature}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ featureName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Feature</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete "<span className="font-medium">{featureName}</span>"? 
              This action cannot be undone and may affect existing plans that use this feature.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete Feature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesManagement;