import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import imagesAPI from '../api/imagesapi';

const ComparisonNotesModal = ({ isOpen, onClose, onSave, existingNotes = '', leftImages, rightImages }) => {
  const [notes, setNotes] = useState(existingNotes);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({ plain: '', html: '' });
  const [showSuggestion, setShowSuggestion] = useState(false);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Convert markdown to HTML for display in overlay
  const markdownToHtml = (markdown) => {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove headers but keep content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert **bold** to <strong>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Convert *italic* to <em>
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/^- /gm, '• ') // Convert markdown bullets to bullet points
      .replace(/\n/g, '<br>') // Convert newlines to <br>
      .trim();
  };

  // Convert markdown to plain text for textarea value
  const markdownToPlainText = (markdown) => {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove headers but keep content
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown but keep text
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/^- /gm, '• ') // Convert markdown bullets to bullet points
      .replace(/\n\s*\n/g, '\n\n') // Clean up whitespace
      .trim();
  };



  const runAiAnalysis = async () => {
    if (!leftImages.length || !rightImages.length) {
      toast.error("Need at least one old and one new image");
      return;
    }

    setAiLoading(true);

    try {
      const response = await imagesAPI.analyzeImages(leftImages, rightImages);
      
      if (response.success) {
        const aiText = response.data.analysis;
        const plainText = markdownToPlainText(aiText);
        const htmlText = markdownToHtml(aiText);
        
        // Set as suggestion instead of directly inserting
        const suggestionText = `AI Image Comparison (Testing Only)\n\n${plainText}\n\n`;
        const suggestionHtml = `<strong>AI Image Comparison (Testing Only)</strong><br><br>${htmlText}<br><br>`;
        
        setAiSuggestion({ plain: suggestionText, html: suggestionHtml });
        setShowSuggestion(true);
        toast.success("AI analysis ready - Press Tab to accept");
        
        // Focus textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      } else {
        throw new Error(response.message || "AI analysis failed");
      }

    } catch (err) {
      console.error(err);
      toast.error(err.message || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };



  useEffect(() => {
    setNotes(existingNotes);
  }, [existingNotes]);

  const handleSave = async () => {
    if (!notes.trim()) {
      toast.error('Please enter some notes or run AI analysis');
      return;
    }

    setSaving(true);
    try {
      await onSave(notes);
      toast.success('Notes saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleTextareaFocus = () => {
    // Keep suggestion visible when focused
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && showSuggestion) {
      e.preventDefault();
      // Accept the AI suggestion - prepend to existing notes
      setNotes(prev => aiSuggestion.plain + (prev ? prev : ''));
      setShowSuggestion(false);
      setAiSuggestion({ plain: '', html: '' });
      toast.success("AI analysis accepted");
    } else if (e.key === 'Escape' && showSuggestion) {
      // Reject the suggestion
      setShowSuggestion(false);
      setAiSuggestion({ plain: '', html: '' });
      toast.info("AI analysis dismissed");
    }
  };

  const handleTextChange = (e) => {
    setNotes(e.target.value);
    // Hide suggestion if user starts typing
    if (showSuggestion && e.target.value !== notes) {
      setShowSuggestion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <style>{`
        .ai-suggestion-overlay strong {
          font-weight: 700 !important;
          color: rgb(75 85 99) !important;
        }
        .ai-suggestion-overlay em {
          font-style: italic !important;
          color: rgb(75 85 99) !important;
        }
        .ai-suggestion-overlay {
          color: rgb(156 163 175) !important;
        }
      `}</style>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Comparison Notes</h2>
              <p className="text-sm text-gray-500">Add clinical observations about this comparison</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comparison Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2">LEFT (Old) - {leftImages.length} image(s)</p>
              <div className="flex gap-2 overflow-x-auto">
                {leftImages.slice(0, 3).map((img, idx) => (
                  <div key={idx} className="flex-shrink-0">
                    <img src={img.imageUrl} alt="" className="w-16 h-16 object-cover rounded border-2 border-blue-500" />
                    <p className="text-[10px] text-gray-600 mt-1">{img.date}</p>
                  </div>
                ))}
                {leftImages.length > 3 && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                    +{leftImages.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-600 mb-2">RIGHT (New) - {rightImages.length} image(s)</p>
              <div className="flex gap-2 overflow-x-auto">
                {rightImages.slice(0, 3).map((img, idx) => (
                  <div key={idx} className="flex-shrink-0">
                    <img src={img.imageUrl} alt="" className="w-16 h-16 object-cover rounded border-2 border-green-500" />
                    <p className="text-[10px] text-gray-600 mt-1">{img.date}</p>
                  </div>
                ))}
                {rightImages.length > 3 && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                    +{rightImages.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes Input */}
        <div className="flex-1 p-6 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Observations
          </label>

          <Button
            variant="outline"
            onClick={runAiAnalysis}
            disabled={aiLoading}
            className="mb-4"
          >
            {aiLoading ? "Analyzing..." : "AI Analysis"}
          </Button>

          {/* Textarea Container with Overlay */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={handleTextChange}
              onFocus={handleTextareaFocus}
              onKeyDown={handleKeyDown}
              placeholder="Enter your clinical observations here...&#10;&#10;Examples:&#10;• Lesion size reduced from 5mm to 3mm&#10;• 20% improvement in redness&#10;• Recommend continuing current treatment&#10;• Patient reports reduced itching"
              className={`w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-white ${
                showSuggestion ? 'text-transparent caret-gray-900' : 'text-gray-900'
              }`}
              autoFocus
            />
            
            {/* AI Suggestion Overlay */}
            {showSuggestion && (
              <div 
                ref={overlayRef}
                className="absolute top-0 left-0 w-full h-full p-4 pointer-events-none rounded-lg overflow-hidden"
                style={{ 
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem'
                }}
              >
                {/* AI suggestion positioned first */}
                <div 
                  className="ai-suggestion-overlay"
                  style={{
                    color: 'rgb(156 163 175)',
                    opacity: 0.7
                  }}
                  dangerouslySetInnerHTML={{ __html: aiSuggestion.html }}
                />
                
                {/* Existing notes positioned after AI suggestion */}
                {notes && (
                  <>
                    <br />
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {notes}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {notes.length} characters • These notes will be saved to the patient's medical record
            </p>
            {showSuggestion && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">Tab</span>
                <span>to accept</span>
                <span className="bg-gray-100 px-2 py-1 rounded">Esc</span>
                <span>to dismiss</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            💡 Tip: Be specific about measurements, colors, and changes observed
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !notes.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonNotesModal;
