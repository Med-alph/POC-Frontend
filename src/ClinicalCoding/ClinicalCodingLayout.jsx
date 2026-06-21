import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Code2, ClipboardList, BarChart3 } from 'lucide-react';

const codingTabs = [
  { id: 'queue', label: 'Coding Queue', path: '/medical-coding/queue', icon: ClipboardList },
];

export default function ClinicalCodingLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const activeTab =
    codingTabs.find(
      (tab) => tab.path === currentPath || (tab.id === 'queue' && currentPath === '/medical-coding')
    )?.id || 'queue';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-900 transition-colors duration-300">
      {/* Premium Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-gray-800 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/95 dark:bg-gray-950/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-100 dark:shadow-none">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                  Medical Coding
                </h1>
                <p className="text-xs text-slate-400 dark:text-gray-400 font-light mt-0.5">
                  Attach ICD-10 diagnosis codes and CPT procedure codes to completed consultations.
                </p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-gray-800 pb-px">
            {codingTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400 font-bold scale-[1.02]'
                      : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800/40 rounded-t-lg'
                  }`}
                >
                  <IconComponent
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isActive ? 'text-violet-600 dark:text-violet-400 rotate-6' : 'text-slate-400 dark:text-gray-500'
                    }`}
                  />
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
