import React from 'react';
import ExpiryAlerts from './components/ExpiryAlerts';

export default function ExpiryAlertsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Expiry Alerts</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monitor and manage items approaching expiry dates</p>
        </div>

        <ExpiryAlerts />
      </main>
    </div>
  );
}