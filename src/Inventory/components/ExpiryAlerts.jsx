import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package, Filter, RefreshCw } from 'lucide-react';
import inventoryAPI from '../../api/inventoryapi';
import { getExpiryStatus, formatExpiryDate, getExpiryStatusIcon } from '../../utils/batchUtils';

const ExpiryAlerts = () => {
  const [alerts, setAlerts] = useState({ expired: [], expiring_soon: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, expired, expiring_soon
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    fetchExpiryAlerts();
  }, [daysFilter]);

  const fetchExpiryAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await inventoryAPI.getExpiryAlerts(daysFilter);
      setAlerts(response.data || { expired: [], expiring_soon: [], summary: {} });
    } catch (err) {
      setError('Failed to load expiry alerts');
      console.error('Error fetching expiry alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'expired':
        return alerts.expired || [];
      case 'expiring_soon':
        return alerts.expiring_soon || [];
      default:
        return [...(alerts.expired || []), ...(alerts.expiring_soon || [])];
    }
  };

  const filteredAlerts = getFilteredAlerts();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Expiry Alerts</h2>
          </div>
          <button
            onClick={fetchExpiryAlerts}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Expired Items</p>
                <p className="text-2xl font-bold text-red-900">
                  {alerts.summary?.expired_count || 0}
                </p>
              </div>
              <div className="text-red-500">
                🔴
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-900">
                  {alerts.summary?.expiring_soon_count || 0}
                </p>
              </div>
              <div className="text-orange-500">
                🟠
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Alerts</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(alerts.summary?.expired_count || 0) + (alerts.summary?.expiring_soon_count || 0)}
                </p>
              </div>
              <div className="text-blue-500">
                📊
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="expired">Expired Only</option>
              <option value="expiring_soon">Expiring Soon</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading alerts...</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Package size={48} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No expiry alerts found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days to Expiry
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlerts.map((alert, index) => {
                  const expiryStatus = getExpiryStatus(alert.expiry_date);
                  return (
                    <tr key={`${alert.item_id}-${alert.batch_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.bgColor} ${expiryStatus.textColor}`}>
                          {getExpiryStatusIcon(expiryStatus.status)} {expiryStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {alert.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.batch_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatExpiryDate(alert.expiry_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.current_quantity} {alert.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${expiryStatus.status === 'expired' ? 'text-red-600' : expiryStatus.status === 'expiring_soon' ? 'text-orange-600' : 'text-gray-600'}`}>
                          {expiryStatus.status === 'expired' ? 
                            `${expiryStatus.days} days ago` : 
                            `${expiryStatus.days} days`
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryAlerts;