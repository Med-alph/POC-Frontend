import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientsAPI } from '@/api/patientsapi';
import imagesAPI from '@/api/imagesapi';
import authAPI from '@/api/authapi';
import UploadSessionModal from '@/components/UploadSessionModal';
import SessionTimeline from '@/components/SessionTimeline';
import ImageViewer from '@/components/ImageViewer';
import toast from 'react-hot-toast';

export default function PatientImagesPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPatient();
    fetchSessions();
  }, [patientId]);

  const fetchCurrentUser = async () => {
    try {
      const profile = await authAPI.getProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchPatient = async () => {
    try {
      const data = await patientsAPI.getById(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      toast.error('Failed to load patient details');
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await imagesAPI.getPatientSessions(patientId);
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchSessions();
  };

  const handleViewImages = (session) => {
    setSelectedSession(session);
    setShowImageViewer(true);
  };

  const handleSetBaseline = (sessionId) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      is_baseline: s.id === sessionId
    })));
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleUpdateNotes = (sessionId, notes) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, notes } : s
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Patient Images
              </h1>
              {patient && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {patient.patient_name} • ID: {patient.patient_code || patient.id?.slice(0, 8)}
                </p>
              )}
            </div>
            
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : (
              <SessionTimeline
                sessions={sessions}
                onSetBaseline={handleSetBaseline}
                onUpdateNotes={handleUpdateNotes}
                onDelete={handleDeleteSession}
                onViewImages={handleViewImages}
                canManage={true}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <UploadSessionModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        patientId={patientId}
        uploadedBy={{ id: currentUser?.id, type: 'doctor' }}
        onSuccess={handleUploadSuccess}
      />

      {/* Image Viewer */}
      <ImageViewer
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        session={selectedSession}
      />
    </div>
  );
}
