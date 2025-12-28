import React from 'react';
import { Info, Code, Database } from 'lucide-react';

const BatchInfoNote = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-2">Batch Information Display</h3>
          <p className="text-sm text-blue-800 mb-3">
            The transaction history now shows batch information for each stock movement. 
            Currently, batch data is loaded separately for optimal performance.
          </p>
          
          <div className="bg-blue-100 rounded-md p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-900">Backend Optimization Suggestion</span>
            </div>
            <p className="text-xs text-blue-700">
              For better performance, consider updating the backend transactions API to include 
              batch information in the response using JOIN queries or eager loading.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Code className="h-3 w-3" />
            <span>Current: Frontend loads batch data separately | Optimal: Backend includes batch in transaction response</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchInfoNote;