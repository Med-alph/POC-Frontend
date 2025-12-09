import { useState } from 'react';
import { Calendar, User, Camera, Trash2, Star, Edit3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import imagesAPI from '../api/imagesapi';

function SessionCard({ session, onSetBaseline, onUpdateNotes, onDelete, onViewImages, canManage = false }) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(session.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await imagesAPI.updateNotes(session.id, notes);
      toast.success('Notes updated successfully');
      setIsEditingNotes(false);
      onUpdateNotes(session.id, notes);
    } catch (error) {
      toast.error('Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async () => {
    setLoading(true);
    try {
      await imagesAPI.setBaseline(session.id);
      toast.success('Baseline set successfully');
      onSetBaseline(session.id);
    } catch (error) {
      toast.error('Failed to set baseline');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    setLoading(true);
    try {
      await imagesAPI.deleteSession(session.id);
      toast.success('Session deleted successfully');
      onDelete(session.id);
    } catch (error) {
      toast.error('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 transition-all hover:shadow-md ${
      session.is_baseline ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {session.is_baseline && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {session.session_label}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            session.uploaded_by_type === 'doctor' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {session.uploaded_by_type === 'doctor' ? 'Doctor' : 'Patient'}
          </span>
          {session.is_reviewed && (
            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Reviewed
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {canManage && !session.is_baseline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetBaseline}
              disabled={loading}
              className="text-xs"
            >
              <Star className="w-3 h-3 mr-1" />
              Set Baseline
            </Button>
          )}
          {/* Delete button only for doctors/staff with canManage permission */}
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-xs text-red-600 hover:text-red-700"
              title="Delete session (Doctor/Staff only)"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(session.session_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Body Part: <span className="font-medium">{session.body_part}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          {session.images.length} image{session.images.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Images Preview */}
      <div className="mt-3">
        <div className="flex gap-2 mb-2">
          {session.images.slice(0, 3).map((image, idx) => (
            <img
              key={image.id}
              src={image.image_url}
              alt={`Session image ${idx + 1}`}
              className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80"
              onClick={() => onViewImages(session)}
            />
          ))}
          {session.images.length > 3 && (
            <div 
              className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => onViewImages(session)}
            >
              <span className="text-xs text-gray-600 dark:text-gray-400">+{session.images.length - 3}</span>
            </div>
          )}
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewImages(session)}
          className="w-full text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          View All Images
        </Button>
      </div>

      {/* Notes */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="text-xs p-1 h-auto"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Add notes..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} disabled={loading} className="text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {session.notes || 'No notes added'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SessionTimeline({ sessions, onSetBaseline, onUpdateNotes, onDelete, onViewImages, canManage = false }) {
  // Group sessions by month
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.session_date);
    const monthKey = date.toLocaleString('en-IN', { 
      year: 'numeric', 
      month: 'long',
      timeZone: 'Asia/Kolkata'
    });
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(session);
    return groups;
  }, {});

  // Sort months in descending order (newest first)
  const sortedMonths = Object.keys(groupedSessions).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Images Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">Upload your first session to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedMonths.map(month => (
        <div key={month}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {month}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedSessions[month]
              .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
              .map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onSetBaseline={onSetBaseline}
                  onUpdateNotes={onUpdateNotes}
                  onDelete={onDelete}
                  onViewImages={onViewImages}
                  canManage={canManage}
                />
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}
