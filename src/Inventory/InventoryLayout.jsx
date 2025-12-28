import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Package, BarChart3, FolderOpen, History } from 'lucide-react';
import { InventoryProvider } from '../contexts/InventoryContext';

const inventoryTabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/inventory/dashboard', icon: BarChart3 },
  { id: 'items', label: 'Items', path: '/inventory/items', icon: Package },
  { id: 'categories', label: 'Categories', path: '/inventory/categories', icon: FolderOpen },
  { id: 'transactions', label: 'Transactions', path: '/inventory/transactions', icon: History },
];

export default function InventoryLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab = inventoryTabs.find(tab => tab.path === location.pathname)?.id || 'dashboard';

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Inventory Management
              </h1>
            </div>
            
            {/* Sub Navigation */}
            <div className="flex gap-1 overflow-x-auto">
              {inventoryTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </InventoryProvider>
  );
}