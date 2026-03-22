import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppAdminLogin from './Login/AppAdminLogin';
import AppAdminDashboard from './Dashboard/AppAdminDashboard';
import AppAdminProtectedRoute from './components/AppAdminProtectedRoute';

// App Admin Component Imports
import PlansOverview from './Plans/PlansOverview';
import PlansList from './Plans/PlansList';
import PlansEditor from './Plans/PlansEditor';
import PlansPreview from './Plans/PlansPreview';
import FeaturesManagement from './Features/FeaturesManagement';
import SubscriptionsOverview from './Subscriptions/SubscriptionsOverview';
import SubscriptionsList from './Subscriptions/SubscriptionsList';
import TenantOnboardingOverview from './TenantOnboarding/TenantOnboardingOverview';
import TenantOnboardingList from './TenantOnboarding/TenantOnboardingList';
import HospitalQueriesPage from './Dashboard/HospitalQueriesPage';
import AppAdminTicketChatPage from './Dashboard/AppAdminTicketChatPage';

const AppAdminApp = () => {
    return (
        <Routes>
            <Route path="/login" element={<AppAdminLogin />} />
            
            {/* Wrap all protected routes in a single layout route */}
            <Route
                element={
                    <AppAdminProtectedRoute>
                        <AppAdminDashboard />
                    </AppAdminProtectedRoute>
                }
            >
              <Route path="/" element={<Navigate to="/queries" replace />} />
              <Route path="/queries" element={<HospitalQueriesPage />} />
              <Route path="/queries/ticket/:ticketId" element={<AppAdminTicketChatPage />} />
              <Route path="/plans" element={<PlansOverview />} />
              <Route path="/plans/list" element={<PlansList />} />
              <Route path="/plans/new" element={<PlansEditor />} />
              <Route path="/plans/edit/:id" element={<PlansEditor />} />
              <Route path="/plans/preview" element={<PlansPreview />} />
              <Route path="/features" element={<FeaturesManagement />} />
              <Route path="/tenant-onboarding" element={<TenantOnboardingOverview />} />
              <Route path="/tenant-onboarding/list" element={<TenantOnboardingList />} />
              <Route path="/subscriptions" element={<SubscriptionsOverview />} />
              <Route path="/subscriptions/list" element={<SubscriptionsList />} />
              <Route path="*" element={<Navigate to="/queries" replace />} />
            </Route>
        </Routes>
    );
};

export default AppAdminApp;
