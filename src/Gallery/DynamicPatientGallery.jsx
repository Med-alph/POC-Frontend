import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Camera, User, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientsAPI } from '@/api/patientsapi';
import imagesAPI from '@/api/imagesapi';
import DermImageComparison from './PatientGallery';
import toast from 'react-hot-toast';

export default function DynamicPatientGallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientIdFromUrl = searchParams.get('patientId');
  
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdFromUrl || '');
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Get hospital_id from localStorage user
  const getHospitalId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.hospital_id;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  // Fetch all patients on mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Fetch patient data when selection changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientData(selectedPatientId);
      // Update URL
      setSearchParams({ patientId: selectedPatientId });
    }
  }, [selectedPatientId]);

  const fetchAllPatients = async () => {
    try {
      setLoadingPatients(true);
      const hospitalId = getHospitalId();
      
      if (!hospitalId) {
        toast.error('Hospital ID not found. Please log in again.');
        return;
      }

      const response = await patientsAPI.getAll({
        hospital_id: hospitalId,
        limit: 1000,
        offset: 0
      });
      setAllPatients(response.data || []);
      
      // If URL has patientId, set it as selected
      if (patientIdFromUrl) {
        setSelectedPatientId(patientIdFromUrl);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients list');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientData = async (patientId) => {
    try {
      setLoading(true);
      
      // Fetch patient details
      const patientData = await patientsAPI.getById(patientId);
      setPatient(patientData);
      
      // Fetch sessions
      const sessionsData = await imagesAPI.getPatientSessions(patientId);
      console.log('🔍 Raw sessions data from backend:', sessionsData);
      console.log('🔍 First session structure:', sessionsData?.[0]);
      console.log('🔍 First session has is_reviewed?', 'is_reviewed' in (sessionsData?.[0] || {}));
      console.log('🔍 First session has reviewed_by?', 'reviewed_by' in (sessionsData?.[0] || {}));
      console.log('🔍 First session has reviewed_at?', 'reviewed_at' in (sessionsData?.[0] || {}));
      setSessions(sessionsData || []);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load patient images');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);
  };

  // Filter patients based on search
  const filteredPatients = allPatients.filter(p => 
    p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_info?.includes(searchTerm)
  );

  // Transform sessions to match DermImageComparison format
  const transformedPatient = patient && sessions.length > 0 ? {
    name: patient.patient_name || 'Patient',
    age: patient.age || 'N/A',
    id: patient.patient_code || patient.id?.slice(0, 8),
    patientId: patient.id, // Full patient ID for API calls
    // Keep sessions structure for proper grouping
    sessions: sessions
      .sort((a, b) => new Date(a.session_date) - new Date(b.session_date)) // Sort first
      .map((session, sessionIndex) => ({
        sessionId: session.session_id || session.id, // Handle both session_id and id
        sessionNumber: sessionIndex + 1, // Number after sorting
        sessionDate: new Date(session.session_date),
        dateFormatted: new Date(session.session_date).toLocaleDateString('en-IN'),
        sessionLabel: session.session_label || `Session ${sessionIndex + 1}`,
        bodyPart: session.body_part,
        notes: session.notes,
        isBaseline: session.is_baseline,
        uploadedBy: session.uploaded_by_type ? 
          (session.uploaded_by_type.charAt(0).toUpperCase() + session.uploaded_by_type.slice(1)) : 
          'Unknown',
        isReviewed: session.is_reviewed || false,
        reviewedBy: session.reviewed_by,
        reviewedAt: session.reviewed_at,
        images: session.images.map((img, imgIndex) => ({
          id: img.image_url,
          imageUrl: img.image_url,
          imageIndex: imgIndex,
          sessionId: session.session_id || session.id // Handle both session_id and id
        }))
      })),
    // Also provide flattened images for backward compatibility
    images: sessions.flatMap(session => 
      session.images.map((img, imgIndex) => ({
        id: img.image_url,
        date: new Date(session.session_date).toLocaleDateString('en-IN'),
        imageUrl: img.image_url,
        notes: session.notes || `${session.body_part} - ${session.session_label}`,
        bodyPart: session.body_part,
        isBaseline: session.is_baseline,
        sessionId: session.session_id || session.id, // Handle both session_id and id
        sessionLabel: session.session_label,
        imageIndex: imgIndex
      }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date))
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Patient Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Camera className="w-7 h-7 text-blue-600" />
                Patient Image Gallery
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and compare patient dermatology images over time
              </p>
            </div>
          </div>

          {/* Patient Search */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search & Select Patient
            </label>
            
            {loadingPatients ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading patients...
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>

                {/* Search Results as Cards */}
                {searchTerm && (
                  <div className="mt-3 max-h-96 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No patients found matching "{searchTerm}"</p>
                      </div>
                    ) : (
                      filteredPatients.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setSearchTerm(''); // Clear search after selection
                          }}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            selectedPatientId === p.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
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
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
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
          {patient && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {patient.patient_name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {patient.patient_name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>Age: {patient.age || 'N/A'}</span>
                    <span>•</span>
                    <span>ID: {patient.patient_code || patient.id?.slice(0, 8)}</span>
                    <span>•</span>
                    <span>Phone: {patient.contact_info || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading patient images...</p>
            </div>
          </div>
        ) : !selectedPatientId ? (
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Patient Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please select a patient from the dropdown above to view their image gallery
                </p>
              </CardContent>
            </Card>
          </div>
        ) : !transformedPatient || transformedPatient.images.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Images Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {patient?.patient_name} has no images uploaded yet
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-6">
            <DermImageComparison patient={transformedPatient} canManage={true} />
          </div>
        )}
      </div>
    </div>
  );
}
