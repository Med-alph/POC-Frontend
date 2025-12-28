import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Package } from 'lucide-react';
import inventoryAPI from '../../api/inventoryapi';

const ExpiryAlertsDebug = () => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getExpiryAlerts(30);
      console.log('Raw API Response:', response);
      setAlerts(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading expiry alerts...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">🔍 Expiry Alerts Debug</h2>
        <p className="text-gray-600">Raw API response and data structure analysis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-900">
            {alerts?.summary?.expired_count || 0}
          </p>
          <p className="text-sm text-red-700">
            Items: {alerts?.expired?.length || 0}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {alerts?.summary?.expiring_soon_count || 0}
          </p>
          <p className="text-sm text-orange-700">
            Items: {alerts?.expiring_soon?.length || 0}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Total Quantity</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {(alerts?.summary?.total_expired_quantity || 0) + (alerts?.summary?.total_expiring_quantity || 0)}
          </p>
          <p className="text-sm text-blue-700">
            At risk
          </p>
        </div>
      </div>

      {/* Expiring Soon Items */}
      {alerts?.expiring_soon?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Expiring Soon Items:</h3>
          <div className="space-y-2">
            {alerts.expiring_soon.map((alert, index) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {alert.item?.name || 'Unknown Item'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Batch: {alert.batch_number} | Quantity: {alert.current_quantity}
                    </p>
                    <p className="text-sm text-orange-600">
                      Expires in {alert.days_to_expiry} days ({new Date(alert.expiry_date).toLocaleDateString()})
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {alert.days_to_expiry} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Items */}
      {alerts?.expired?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Expired Items:</h3>
          <div className="space-y-2">
            {alerts.expired.map((alert, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {alert.item?.name || 'Unknown Item'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Batch: {alert.batch_number} | Quantity: {alert.current_quantity}
                    </p>
                    <p className="text-sm text-red-600">
                      Expired on {new Date(alert.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                    Expired
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Raw API Response:</h3>
        <pre className="text-xs text-gray-600 overflow-auto max-h-40">
          {JSON.stringify(alerts, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <button
          onClick={loadAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ExpiryAlertsDebug;