import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ComparisonNotesModal = ({ isOpen, onClose, onSave, existingNotes = '', leftImages, rightImages }) => {
  const [notes, setNotes] = useState(existingNotes);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);



  const runAiAnalysis = async () => {
    if (!leftImages.length || !rightImages.length) {
      toast.error("Need at least one old and one new image");
      return;
    }

    setAiLoading(true);

    try {
      const GROK_KEY = import.meta.env.VITE_GROK_API_KEY;

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROK_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "grok-4-latest",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content: `
  You are a dermatology clinical assistant.
  Compare OLD vs NEW skin images.
  DO NOT diagnose.
  Provide observational comparison only.
  Return text suitable for clinical notes.
  `
            },
            {
              role: "user",
              content: [
                { type: "text", text: "OLD (baseline) images" },
                ...leftImages.map(img => ({
                  type: "image_url",
                  image_url: { url: img.imageUrl }
                })),
                { type: "text", text: "NEW (follow-up) images" },
                ...rightImages.map(img => ({
                  type: "image_url",
                  image_url: { url: img.imageUrl }
                })),
                {
                  type: "text",
                  text: `
  Summarize:
  • Size change
  • Color change
  • Texture/border change
  • Risk flag (yes/no)
  `
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const aiText = data.choices[0].message.content;

      // Append to notes (doctor editable)
      setNotes(prev => `
  AI Image Comparison (Testing Only)
  
  ${aiText}
  
  -------------------------------
  ${prev}
  `);

      toast.success("AI analysis added to notes");

    } catch (err) {
      console.error(err);
      toast.error("AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };



  useEffect(() => {
    setNotes(existingNotes);
  }, [existingNotes]);

  const handleSave = async () => {
    if (!notes.trim()) {
      toast.error('Please enter some notes');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
          >
            {aiLoading ? "Analyzing..." : "AI Analysis"}
          </Button>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your clinical observations here...&#10;&#10;Examples:&#10;• Lesion size reduced from 5mm to 3mm&#10;• 20% improvement in redness&#10;• Recommend continuing current treatment&#10;• Patient reports reduced itching"
            className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            {notes.length} characters • These notes will be saved to the patient's medical record
          </p>
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
