// Procedure Photo Upload Component

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { procedureAPI } from '../services/procedure.api';
import { useProcedurePermissions } from '../hooks/useProcedurePermissions';
import toast from 'react-hot-toast';
import type { ProcedurePhoto } from '../types/procedure.types';

interface ProcedurePhotoUploadProps {
  procedureId: string;
  sessionNumber: number;
  onUploadComplete?: () => void;
}

export const ProcedurePhotoUpload: React.FC<ProcedurePhotoUploadProps> = ({
  procedureId,
  sessionNumber,
  onUploadComplete,
}) => {
  const { canUploadPhoto } = useProcedurePermissions();
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER' | 'DURING'>('BEFORE');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!canUploadPhoto) {
    return null; // Hide component if no permission
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      await procedureAPI.uploadPhoto(procedureId, selectedFile, photoType, sessionNumber, notes || undefined);
      toast.success('Photo uploaded successfully');
      setSelectedFile(null);
      setNotes('');
      setPhotoType('BEFORE');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Photo Type</label>
          <Select value={photoType} onValueChange={(value: any) => setPhotoType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEFORE">Before</SelectItem>
              <SelectItem value="AFTER">After</SelectItem>
              <SelectItem value="DURING">During</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Select Image</label>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this photo..."
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};


