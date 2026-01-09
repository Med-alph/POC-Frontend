import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, AlertCircle, CheckCircle, Clock } from "lucide-react";
import toast from 'react-hot-toast';

export default function ConsentTextEditor({
  initialText = '',
  onTextChange,
  onSave,
  saving = false
}) {
  const [text, setText] = useState(initialText);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationError, setValidationError] = useState('');

  const MIN_LENGTH = 50;
  const MAX_LENGTH = 5000;

  // Update local state when initialText changes
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // Validation
  const validateText = useCallback((textToValidate) => {
    if (!textToValidate || textToValidate.trim().length === 0) {
      return "Consent text cannot be empty.";
    }

    if (textToValidate.trim().length < MIN_LENGTH) {
      return `Consent text must be at least ${MIN_LENGTH} characters long.`;
    }

    if (textToValidate.length > MAX_LENGTH) {
      return `Consent text cannot exceed ${MAX_LENGTH} characters.`;
    }

    return '';
  }, []);

  // Handle text changes with validation
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    // Validate
    const error = validateText(newText);
    setValidationError(error);

    // Notify parent component
    if (onTextChange) {
      onTextChange(newText);
    }
  };


  // Manual save
  const handleManualSave = async () => {
    const error = validateText(text);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      await onSave(text);
      setLastSaved(new Date());
    } catch (error) {
      // Error handling is done in parent component
    }
  };



  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isValid = !validationError && text.trim().length >= MIN_LENGTH;
  const hasChanges = text.trim() !== initialText.trim();

  return (
    <div className="space-y-4">
      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Text Editor */}
      <div className="space-y-2">
        <label htmlFor="consent-text" className="block text-sm font-medium text-gray-700">
          Consent Text
        </label>
        <textarea
          id="consent-text"
          value={text}
          onChange={handleTextChange}
          placeholder="Enter the consent text that patients will see during registration..."
          className={`w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
            }`}
          disabled={saving}
        />
      </div>

      {/* Statistics and Status */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Characters: {characterCount.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
          </span>
          <span>Words: {wordCount.toLocaleString()}</span>
          {characterCount >= MIN_LENGTH && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Valid length
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-500">
          {hasChanges ? (
            <span className="text-orange-600">You have unsaved changes</span>
          ) : (
            <span>No changes to save</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleManualSave}
            disabled={!isValid || saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Writing Guidelines:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be clear and concise about what data you collect and why</li>
          <li>• Explain patient rights including access, correction, and withdrawal</li>
          <li>• Include information about data sharing with healthcare providers</li>
          <li>• Mention security measures and confidentiality protections</li>
          <li>• Use plain language that patients can easily understand</li>
        </ul>
      </div>
    </div>
  );
}