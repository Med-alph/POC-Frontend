import React from 'react';
import { CheckCircle, Package, Calendar, AlertTriangle } from 'lucide-react';

const BatchManagementSummary = () => {
  const features = [
    {
      icon: <Package className="h-5 w-5 text-green-600" />,
      title: "Batch Tracking",
      description: "Complete batch-level inventory management with unique batch numbers and expiry dates"
    },
    {
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      title: "FEFO Logic",
      description: "First Expiry First Out automatic consumption for pharmaceutical compliance"
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      title: "Expiry Alerts",
      description: "Real-time monitoring of expired and expiring items with dashboard widgets"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-purple-600" />,
      title: "Enhanced UI",
      description: "Updated inventory pages with batch information, expiry status, and batch management"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">✅ Batch Management System Implemented</h2>
        <p className="text-gray-600">Complete pharmaceutical-grade inventory management with FEFO compliance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">🎯 Key Features Implemented:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Stock In with batch creation and expiry date tracking</li>
          <li>• Stock Out with automatic FEFO consumption logic</li>
          <li>• Batch view and management for each inventory item</li>
          <li>• Expiry alerts dashboard with expired and expiring items</li>
          <li>• Enhanced transaction history with batch information</li>
          <li>• Updated inventory dashboard with expiry status widgets</li>
        </ul>
      </div>
    </div>
  );
};

export default BatchManagementSummary;