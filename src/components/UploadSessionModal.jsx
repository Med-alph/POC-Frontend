import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import imagesAPI from '../api/imagesapi';

const BODY_PARTS = [
  'Face',
  'Left Arm',
  'Right Arm',
  'Left Leg',
  'Right Leg',
  'Chest',
  'Back',
  'Abdomen',
  'Neck',
  'Hands',
  'Feet',
  'Other',
];

export default function UploadSessionModal({ isOpen, onClose, patientId, uploadedBy, onSuccess }) {
  const [bodyPart, setBodyPart] = useState('Face');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maximum 5 images allowed per session');
      return;
    }

    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB per image.`);
        return false;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/heic'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image format.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (!bodyPart) {
      toast.error('Please select body part');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('body_part', bodyPart);
      formData.append('notes', notes);
      formData.append('uploaded_by_id', uploadedBy.id);
      formData.append('uploaded_by_type', uploadedBy.type);

      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const result = await imagesAPI.uploadSession(patientId, formData);
      
      toast.success(`Session uploaded successfully with ${result.image_urls.length} images`);
      
      // Reset form
      const uploadDetails = {
        body_part: bodyPart,
        notes: notes,
        image_urls: result.image_urls,
        session_id: result.session_id
      };
      
      setBodyPart('Face');
      setNotes('');
      setSelectedFiles([]);
      setPreviews([]);
      
      onSuccess(uploadDetails);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload session: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Upload Images
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Body Part Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Body Part *
            </label>
            <select
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={uploading}
            >
              {BODY_PARTS.map(part => (
                <option key={part} value={part}>{part}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Images * (1-5 images, max 10MB each)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading || selectedFiles.length >= 5}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  uploading || selectedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG, HEIC (max 10MB per image)
                </span>
              </label>
            </div>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    Image {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Add any observations or notes..."
              disabled={uploading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || selectedFiles.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}