import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Pill, BarChart3, ClipboardList } from 'lucide-react';

const pharmacyTabs = [
  { id: 'queue', label: 'Work Queue', path: '/pharmacy/queue', icon: ClipboardList },
  { id: 'stats', label: 'Stats & Analytics', path: '/pharmacy/stats', icon: BarChart3 },
];

export default function PharmacyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Resolve active tab based on route
  const currentPath = location.pathname;
  const activeTab = pharmacyTabs.find(tab => tab.path === currentPath || (tab.id === 'queue' && currentPath === '/pharmacy'))?.id || 'queue';

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-900 transition-colors duration-300">
      {/* Premium Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-gray-800 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/95 dark:bg-gray-950/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none animate-pulse-slow">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                  In-House Pharmacy
                </h1>
                <p className="text-xs text-slate-400 dark:text-gray-400 font-light mt-0.5">
                  Fulfill prescriptions, verify stock, trigger cashier billing and dispense medicines.
                </p>
              </div>
            </div>
          </div>
          
          {/* Sub Navigation Tabs with Premium Underline Effect */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-gray-800 pb-px">
            {pharmacyTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold scale-[1.02]'
                      : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800/40 rounded-t-lg'
                  }`}
                >
                  <IconComponent className={`h-4 w-4 transition-transform duration-300 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400 rotate-6' : 'text-slate-400 dark:text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Outlet />
      </div>
    </div>
  );
}
