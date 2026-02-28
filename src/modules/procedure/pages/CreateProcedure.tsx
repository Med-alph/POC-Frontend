// Create Procedure Page

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ProcedureForm } from '../components/ProcedureForm';
import { procedureAPI } from '../services/procedure.api';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UI_MODULES } from '../../../constants/Constant';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreateProcedurePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || undefined;
  const permissions = useProcedurePermissions();

  if (!permissions.canCreateProcedure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-gray-600">You don't have permission to create procedures.</p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    try {
      await procedureAPI.createProcedure(data);
      toast.success('Procedure created successfully');
      if (patientId) {
        navigate(`/doctor-patient-record/${patientId}?tab=Procedures`);
      } else {
        navigate('/procedures');
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Create Procedure</h1>
        </div>

        <ProcedureForm
          patientId={patientId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default function CreateProcedure() {
  return (
    <ProtectedRoute module={UI_MODULES.PROCEDURES}>
      <CreateProcedurePage />
    </ProtectedRoute>
  );
}

