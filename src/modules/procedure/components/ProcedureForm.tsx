// Procedure Form Component
// Respects RBAC - only shows fields user is allowed to edit

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { procedureAPI } from '../services/procedure.api';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import { ProcedurePackageSelector } from './ProcedurePackageSelector';
import type { Procedure, ProcedureTemplate } from '../types/procedure.types';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { baseUrl } from '../../../constants/Constant';
import { getAuthToken } from '../../../utils/auth';

interface ProcedureFormProps {
  procedure?: Procedure;
  patientId?: string;
  onSubmit: (data: Partial<Procedure>) => Promise<void>;
  onCancel?: () => void;
}

export const ProcedureForm: React.FC<ProcedureFormProps> = ({
  procedure,
  patientId,
  onSubmit,
  onCancel,
}) => {
  const permissions = useProcedurePermissions();
  const reduxUser = useSelector((state: any) => state.auth.user);
  const userRole = reduxUser?.role || reduxUser?.designation_group || '';

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<Procedure>>({
    patientId: patientId || procedure?.patientId || '',
    procedureTypeId: procedure?.procedureTypeId || '',
    doctorId: procedure?.doctorId || reduxUser?.id || '',
    status: procedure?.status || 'SCHEDULED',
    scheduledDate: procedure?.scheduledDate || new Date().toISOString().split('T')[0],
    sessionNumber: procedure?.sessionNumber || 1,
    totalSessions: procedure?.totalSessions || 1,
    diagnosis: procedure?.diagnosis || '',
    notes: procedure?.notes || '',
    price: procedure?.price || undefined,
  });

  useEffect(() => {
    loadTemplates();
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        totalSessions: selectedPackage.totalSessions,
        price: selectedPackage.price,
        procedureTypeId: selectedPackage.procedureTypeIds[0] || prev.procedureTypeId,
      }));
    }
  }, [selectedPackage]);

  const loadTemplates = async () => {
    try {
      const data = await procedureAPI.getTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      // Load doctors from staff API - adjust endpoint as needed
      const token = getAuthToken();
      
      const response = await fetch(`${baseUrl}/staff?role=Doctor`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.staff || data || []);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save procedure');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageChange = (packageId: string | null, pkg?: any) => {
    setSelectedPackageId(packageId);
    setSelectedPackage(pkg);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{procedure ? 'Edit Procedure' : 'Create Procedure'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Procedure Type */}
          <div>
            <Label htmlFor="procedureTypeId">Procedure Type *</Label>
            <Select
              value={formData.procedureTypeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, procedureTypeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select procedure type" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Package Selector */}
          {!procedure && (
            <div>
              <Label>Package (Optional)</Label>
              <ProcedurePackageSelector
                value={selectedPackageId || undefined}
                onChange={handlePackageChange}
              />
            </div>
          )}

          {/* Doctor */}
          <div>
            <Label htmlFor="doctorId">Doctor *</Label>
            <Select
              value={formData.doctorId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.staff_name || doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div>
            <Label htmlFor="scheduledDate">Scheduled Date *</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              required
            />
          </div>

          {/* Sessions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionNumber">Current Session</Label>
              <Input
                id="sessionNumber"
                type="number"
                min="1"
                value={formData.sessionNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionNumber: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="totalSessions">Total Sessions</Label>
              <Input
                id="totalSessions"
                type="number"
                min="1"
                value={formData.totalSessions}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          {/* Status - Only show if user can edit */}
          {permissions.canEditProcedure && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="POSTPONED">Postponed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price - Hide for STAFF role */}
          {(userRole === 'Admin' || userRole === 'HOSPITAL_ADMIN' || userRole === 'Doctor') && (
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))}
              />
            </div>
          )}

          {/* Diagnosis - Only for DOCTOR and ADMIN */}
          {(userRole === 'Doctor' || userRole === 'Admin' || userRole === 'HOSPITAL_ADMIN') && (
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Enter diagnosis..."
                rows={3}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            procedure ? 'Update Procedure' : 'Create Procedure'
          )}
        </Button>
      </div>
    </form>
  );
};

