import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppAdminNavbar from './AppAdminNavbar';
import PlansOverview from '../Plans/PlansOverview';
import PlansList from '../Plans/PlansList';
import PlansEditor from '../Plans/PlansEditor';
import PlansPreview from '../Plans/PlansPreview';
import FeaturesManagement from '../Features/FeaturesManagement';
import SubscriptionsOverview from '../Subscriptions/SubscriptionsOverview';
import SubscriptionsList from '../Subscriptions/SubscriptionsList';
import TenantOnboardingOverview from '../TenantOnboarding/TenantOnboardingOverview';
import TenantOnboardingList from '../TenantOnboarding/TenantOnboardingList';
import { useAppAdminAuth } from '../contexts/AppAdminAuthContext';
import plansApi from '../../api/plansapi';
import subscriptionsApi from '../../api/subscriptionsapi';
import featuresApi from '../../api/featuresapi';
import tenantsAPI from '../../api/tenantsapi';

const AppAdminDashboard = () => {
  const { admin } = useAppAdminAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalFeatures: 0,
    totalTenants: 0,
    activeTenants: 0,
    loading: true
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setDashboardStats(prev => ({ ...prev, loading: true }));
      }

      const [plansResponse, subscriptionsResponse, featuresResponse, tenantsResponse] = await Promise.all([
        plansApi.getAllPlans(),
        subscriptionsApi.getAllSubscriptions(),
        featuresApi.getAllFeatures(),
        tenantsAPI.getAll()
      ]);

      const activePlans = plansResponse.filter(plan => plan.status === 'active').length;
      const activeSubscriptions = subscriptionsResponse.filter(sub => sub.status === 'active').length;
      const tenants = tenantsResponse.data || [];
      const activeTenants = tenants.filter(tenant => tenant.status === 'Active').length;

      setDashboardStats({
        totalPlans: plansResponse.length,
        activePlans,
        totalSubscriptions: subscriptionsResponse.length,
        activeSubscriptions,
        totalFeatures: featuresResponse.length,
        totalTenants: tenants.length,
        activeTenants,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setDashboardStats(prev => ({ ...prev, loading: false }));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    loadDashboardStats(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppAdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <DashboardHome
              stats={dashboardStats}
              admin={admin}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          } />
          <Route path="plans" element={<PlansOverview />} />
          <Route path="plans/list" element={<PlansList />} />
          <Route path="plans/new" element={<PlansEditor />} />
          <Route path="plans/edit/:id" element={<PlansEditor />} />
          <Route path="plans/preview" element={<PlansPreview />} />
          <Route path="features" element={<FeaturesManagement />} />
          <Route path="tenant-onboarding" element={<TenantOnboardingOverview />} />
          <Route path="tenant-onboarding/list" element={<TenantOnboardingList />} />
          <Route path="subscriptions" element={<SubscriptionsOverview />} />
          <Route path="subscriptions/list" element={<SubscriptionsList />} />
        </Routes>
      </div>
    </div>
  );
};

const DashboardHome = ({ stats, admin, onRefresh, refreshing }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {admin?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage subscription plans and monitor system-wide subscriptions
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${refreshing
              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
          >
            {refreshing ? (
              <>
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        <StatCard
          title="Total Plans"
          value={stats.totalPlans}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          loading={stats.loading}
          color="blue"
        />
        <StatCard
          title="Active Plans"
          value={stats.activePlans}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={stats.loading}
          color="green"
        />
        <StatCard
          title="Total Features"
          value={stats.totalFeatures}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          loading={stats.loading}
          color="purple"
        />
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          loading={stats.loading}
          color="orange"
        />
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          loading={stats.loading}
          color="teal"
        />
        <StatCard
          title="Total Subscriptions"
          value={stats.totalSubscriptions}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          loading={stats.loading}
          color="indigo"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          loading={stats.loading}
          color="pink"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickActionCard
            title="Create New Plan"
            description="Add a new subscription plan with custom features"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            href="/plans/new"
            color="blue"
          />
          <QuickActionCard
            title="Manage Plans"
            description="View and edit existing subscription plans"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            href="/plans/list"
            color="green"
          />
          <QuickActionCard
            title="Manage Features"
            description="Create and configure plan features"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
            }
            href="/features"
            color="purple"
          />
          <QuickActionCard
            title="Onboard Tenant"
            description="Add new tenants and assign plans"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            href="/tenant-onboarding"
            color="orange"
          />
          <QuickActionCard
            title="View Subscriptions"
            description="Monitor all tenant subscriptions and payments"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            href="/subscriptions/list"
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, loading, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {loading ? (
              <div className="animate-pulse bg-current opacity-25 rounded w-8 h-8"></div>
            ) : (
              value
            )}
          </p>
        </div>
        <div className="text-current opacity-80">{icon}</div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon, href, color }) => {
  const colorClasses = {
    blue: 'hover:bg-blue-50 border-blue-200',
    green: 'hover:bg-green-50 border-green-200',
    purple: 'hover:bg-purple-50 border-purple-200',
    orange: 'hover:bg-orange-50 border-orange-200',
    indigo: 'hover:bg-indigo-50 border-indigo-200',
  };

  return (
    <a
      href={href}
      className={`block p-4 border rounded-lg transition-colors ${colorClasses[color]} hover:shadow-md`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-current">{icon}</div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
};

export default AppAdminDashboard;