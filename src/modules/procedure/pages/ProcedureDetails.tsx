// Procedure Details Page

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Camera, FileText, DollarSign, Calendar, CheckCircle2, X } from 'lucide-react';
import { procedureAPI } from '../services/procedure.api';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import { ProcedureStatusBadge } from '../components/ProcedureStatusBadge';
import { ProcedureConsent } from '../components/ProcedureConsent';
import { ProcedurePhotoUpload } from '../components/ProcedurePhotoUpload';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UI_MODULES } from '../../../constants/Constant';
import toast from 'react-hot-toast';
import type { Procedure, ProcedurePhoto } from '../types/procedure.types';
import { Loader2 } from 'lucide-react';

const ProcedureDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = useProcedurePermissions();

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [photos, setPhotos] = useState<ProcedurePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProcedure();
      loadPhotos();
    }
  }, [id]);

  const loadProcedure = async () => {
    try {
      setLoading(true);
      const data = await procedureAPI.getProcedure(id!);
      setProcedure(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load procedure');
      navigate('/procedures');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const data = await procedureAPI.getPhotos(id!);
      setPhotos(data);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this procedure as completed?')) {
      return;
    }

    try {
      setCompleting(true);
      await procedureAPI.completeProcedure(id!);
      toast.success('Procedure marked as completed');
      loadProcedure();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete procedure');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-gray-600">Procedure not found</p>
        </Card>
      </div>
    );
  }

  const beforePhotos = photos.filter(p => p.photoType === 'BEFORE');
  const afterPhotos = photos.filter(p => p.photoType === 'AFTER');
  const duringPhotos = photos.filter(p => p.photoType === 'DURING');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{procedure.procedureTypeName || 'Procedure'}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Patient: {procedure.patientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProcedureStatusBadge status={procedure.status} />
            {permissions.canEditProcedure && (
              <Button
                variant="outline"
                onClick={() => navigate(`/procedures/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {permissions.canCompleteProcedure && procedure.status !== 'COMPLETED' && (
              <Button
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Completed
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Doctor</p>
                <p className="font-semibold">{procedure.doctorName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled Date</p>
                <p className="font-semibold">
                  {new Date(procedure.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Session</p>
                <p className="font-semibold">
                  {procedure.sessionNumber} / {procedure.totalSessions}
                </p>
              </div>
              {procedure.completedDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Date</p>
                  <p className="font-semibold">
                    {new Date(procedure.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {procedure.diagnosis && (
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diagnosis</p>
                  <p className="font-semibold">{procedure.diagnosis}</p>
                </div>
              )}
              {procedure.notes && (
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="font-semibold">{procedure.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="photos" className="w-full">
          <TabsList>
            <TabsTrigger value="photos">
              <Camera className="h-4 w-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="consent">
              <FileText className="h-4 w-4 mr-2" />
              Consent
            </TabsTrigger>
            {permissions.canViewBilling && (
              <TabsTrigger value="billing">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="photos" className="space-y-6">
            {/* Photo Upload */}
            {permissions.canUploadPhoto && (
              <ProcedurePhotoUpload
                procedureId={procedure.id}
                sessionNumber={procedure.sessionNumber}
                onUploadComplete={loadPhotos}
              />
            )}

            {/* Photo Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {beforePhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Before Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {beforePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt="Before"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(photo.imageUrl, '_blank')}
                          />
                          {photo.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {photo.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {afterPhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>After Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {afterPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt="After"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(photo.imageUrl, '_blank')}
                          />
                          {photo.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {photo.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {duringPhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>During Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {duringPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt="During"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(photo.imageUrl, '_blank')}
                          />
                          {photo.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {photo.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {photos.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Camera className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No photos uploaded yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="consent">
            <ProcedureConsent
              procedure={procedure}
              onConsentSigned={loadProcedure}
            />
          </TabsContent>

          {permissions.canViewBilling && (
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {procedure.price ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-semibold">₹{procedure.price}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No billing information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default function ProcedureDetails() {
  return (
    <ProtectedRoute module={UI_MODULES.PROCEDURES}>
      <ProcedureDetailsPage />
    </ProtectedRoute>
  );
}

