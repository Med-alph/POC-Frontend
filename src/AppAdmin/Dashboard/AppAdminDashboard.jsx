import React from 'react';
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
import HospitalQueriesPage from './HospitalQueriesPage';
import AppAdminTicketChatPage from './AppAdminTicketChatPage';

const AppAdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppAdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="queries" replace />} />
          <Route path="dashboard" element={<Navigate to="/queries" replace />} />
          <Route path="queries/ticket/:ticketId" element={<AppAdminTicketChatPage />} />
          <Route path="queries" element={<HospitalQueriesPage />} />
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

export default AppAdminDashboard;
