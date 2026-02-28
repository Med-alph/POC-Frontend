// Patient Procedures Tab Component
// To be integrated into Patient Profile

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Calendar, User, Stethoscope } from 'lucide-react';
import { procedureAPI } from '../services/procedure.api';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import { ProcedureStatusBadge } from '../components/ProcedureStatusBadge';
import type { Procedure } from '../types/procedure.types';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PatientProceduresProps {
  patientId: string;
}

export const PatientProcedures: React.FC<PatientProceduresProps> = ({ patientId }) => {
  const navigate = useNavigate();
  const permissions = useProcedurePermissions();

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProcedures();
  }, [patientId]);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      const response = await procedureAPI.listProcedures({ patientId });
      setProcedures(response.procedures || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load procedures');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canViewProcedure) {
    return null; // Hide tab if no permission
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Procedures</h2>
        {permissions.canCreateProcedure && (
          <Button
            onClick={() => navigate(`/procedures/create?patientId=${patientId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Procedure
          </Button>
        )}
      </div>

      {procedures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No procedures found</p>
            {permissions.canCreateProcedure && (
              <Button
                variant="outline"
                onClick={() => navigate(`/procedures/create?patientId=${patientId}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Procedure
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedure Type</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedures.map((procedure) => (
                  <TableRow key={procedure.id}>
                    <TableCell className="font-medium">
                      {procedure.procedureTypeName || 'N/A'}
                    </TableCell>
                    <TableCell>{procedure.doctorName || 'N/A'}</TableCell>
                    <TableCell>
                      <ProcedureStatusBadge status={procedure.status} />
                    </TableCell>
                    <TableCell>
                      {procedure.sessionNumber} / {procedure.totalSessions}
                    </TableCell>
                    <TableCell>
                      {new Date(procedure.scheduledDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/procedures/${procedure.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


