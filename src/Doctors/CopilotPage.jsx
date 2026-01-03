import React, { useState, useEffect } from 'react';
import { Search, User, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientsAPI } from '@/api/patientsapi';
import CopilotPanel from '@/components/CopilotPanel';
import toast from 'react-hot-toast';

const CopilotPage = () => {
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Fetch all patients on mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Open copilot when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      setIsCopilotOpen(true);
    }
  }, [selectedPatientId]);

  const fetchAllPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await patientsAPI.getAll({
        limit: 1000,
        offset: 0
      });
      setAllPatients(response.data || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients list');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchTerm(''); // Clear search after selection
  };

  // Filter patients based on search
  const filteredPatients = allPatients.filter(p =>
    p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_info?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Patient Selector */}
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              Patient Insights
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Get AI-powered insights and recommendations for patient care
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Patient Search */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search & Select Patient
              </label>
              
              {loadingPatients ? (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading patients...
                </div>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white text-base transition-all"
                    />
                  </div>

                  {/* Search Results as Cards */}
                  {searchTerm && (
                    <div className="mt-3 max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                      {filteredPatients.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No patients found matching "{searchTerm}"</p>
                        </div>
                      ) : (
                        filteredPatients.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handlePatientSelect(p.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md hover:scale-[1.01] ${
                              selectedPatientId === p.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {p.patient_name?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                  {p.patient_name}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <span className="truncate">ID: {p.patient_code || p.id.slice(0, 8)}</span>
                                  {p.contact_info && (
                                    <>
                                      <span>•</span>
                                      <span>{p.contact_info}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {selectedPatientId === p.id && (
                                <div className="flex-shrink-0">
                                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Show instruction when no search */}
                  {!searchTerm && !selectedPatientId && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      Start typing to search for a patient
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Selected Patient Info */}
            {selectedPatientId && (() => {
              const selectedPatient = allPatients.find(p => p.id === selectedPatientId);
              return selectedPatient ? (
                <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {selectedPatient.patient_name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedPatient.patient_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="font-medium">Age: {selectedPatient.age || 'N/A'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">ID: {selectedPatient.patient_code || selectedPatient.id?.slice(0, 8)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">Phone: {selectedPatient.contact_info || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Ready</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        {/* Empty State */}
        {!selectedPatientId && !searchTerm && (
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Select a Patient
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Search and select a patient above to view AI-powered patient insights
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Copilot Panel */}
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setSelectedPatientId(null);
        }}
        patientId={selectedPatientId}
      />
    </div>
  );
};

export default CopilotPage;

