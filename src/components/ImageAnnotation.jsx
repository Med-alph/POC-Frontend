import React, { useState, useRef, useEffect } from 'react';
import { Circle, Square, X, Save, Trash2, Undo, Minus, Pencil, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

/**
 * CLEAN IMPLEMENTATION - SVG-based annotations with normalized coordinates
 * Simple, reliable, and works perfectly across all display sizes
 */
const ImageAnnotation = ({ 
  imageUrl, 
  existingAnnotations = null,
  onSave,
  onClose,
  imageLabel = "Image"
}) => {
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState('circle');
  const [color, setColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pathPoints, setPathPoints] = useState([]);
  const [editingText, setEditingText] = useState(null);
  const [textInput, setTextInput] = useState('');
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Load existing annotations when component mounts or existingAnnotations changes
  useEffect(() => {
    if (!existingAnnotations) {
      setAnnotations([]);
      return;
    }
    
    let loadedAnnotations = [];
    if (Array.isArray(existingAnnotations)) {
      loadedAnnotations = existingAnnotations;
    } else if (existingAnnotations.shapes) {
      loadedAnnotations = existingAnnotations.shapes;
    } else if (existingAnnotations.annotations) {
      loadedAnnotations = existingAnnotations.annotations;
    }
    
    console.log('📥 Loading existing annotations:', loadedAnnotations);
    setAnnotations(loadedAnnotations);
  }, [existingAnnotations]);

  // Get normalized coordinates (0-1) from mouse event
  const getNormalizedCoords = (e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleImageClick = (e) => {
    if (activeTool === 'text') {
      const coords = getNormalizedCoords(e);
      setEditingText({
        startX: coords.x,
        startY: coords.y,
        color: color
      });
      setTextInput('');
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && editingText) {
      setAnnotations([...annotations, {
        type: 'text',
        text: textInput,
        startX: editingText.startX,
        startY: editingText.startY,
        color: editingText.color
      }]);
      setEditingText(null);
      setTextInput('');
    }
  };

  const handleTextCancel = () => {
    setEditingText(null);
    setTextInput('');
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'text') return;
    
    const coords = getNormalizedCoords(e);
    setIsDrawing(true);
    
    if (activeTool === 'pen') {
      setPathPoints([coords]);
      setCurrentShape({
        type: 'pen',
        points: [coords],
        color: color
      });
    } else {
      setCurrentShape({
        type: activeTool,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        color: color
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentShape) return;
    
    const coords = getNormalizedCoords(e);
    
    if (activeTool === 'pen') {
      const newPoints = [...pathPoints, coords];
      setPathPoints(newPoints);
      setCurrentShape({
        ...currentShape,
        points: newPoints
      });
    } else {
      setCurrentShape({
        ...currentShape,
        endX: coords.x,
        endY: coords.y
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    
    if (activeTool === 'pen') {
      // Add pen path if it has enough points
      if (pathPoints.length > 2) {
        setAnnotations([...annotations, currentShape]);
      }
      setPathPoints([]);
    } else {
      // Only add if shape has some size
      const width = Math.abs(currentShape.endX - currentShape.startX);
      const height = Math.abs(currentShape.endY - currentShape.startY);
      
      if (width > 0.01 || height > 0.01) {
        setAnnotations([...annotations, currentShape]);
      }
    }
    
    setIsDrawing(false);
    setCurrentShape(null);
  };



  const handleUndo = () => {
    if (annotations.length > 0) {
      setAnnotations(annotations.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Wrap annotations array in an object for backend compatibility
      await onSave({
        annotations: {
          version: '6.0',
          format: 'svg-normalized',
          shapes: annotations
        },
        imageUrl: imageUrl,
        annotationCount: annotations.length
      });
      toast.success(`${annotations.length} annotation(s) saved`);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  // Render a single annotation shape
  const renderShape = (shape, index) => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Convert normalized coords to pixels
    const x1 = shape.startX * width;
    const y1 = shape.startY * height;
    const x2 = shape.endX * width;
    const y2 = shape.endY * height;

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    if (shape.type === 'circle') {
      const radius = Math.sqrt(w * w + h * h) / 2;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      
      return (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={shape.color}
          strokeWidth="3"
        />
      );
    } else if (shape.type === 'rectangle') {
      return (
        <rect
          key={index}
          x={left}
          y={top}
          width={w}
          height={h}
          fill="none"
          stroke={shape.color}
          strokeWidth="3"
        />
      );
    } else if (shape.type === 'line') {
      return (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={shape.color}
          strokeWidth="3"
        />
      );
    } else if (shape.type === 'pen') {
      if (!shape.points || shape.points.length < 2) return null;
      const pathData = shape.points.map((point, i) => {
        const px = point.x * width;
        const py = point.y * height;
        return i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`;
      }).join(' ');
      
      return (
        <path
          key={index}
          d={pathData}
          fill="none"
          stroke={shape.color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    } else if (shape.type === 'text') {
      const tx = shape.startX * width;
      const ty = shape.startY * height;
      
      return (
        <text
          key={index}
          x={tx}
          y={ty}
          fill={shape.color}
          fontSize="18"
          fontFamily="Arial"
          textAnchor="middle"
        >
          {shape.text}
        </text>
      );
    }
    
    return null;
  };

  const colors = [
    { name: 'Red', value: '#FF0000' },
    { name: 'Green', value: '#00FF00' },
    { name: 'Blue', value: '#0066FF' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Annotate Image</h2>
            <p className="text-sm text-gray-600">{imageLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b bg-gray-50 flex-wrap">
          <div className="flex items-center gap-2 border-r pr-3">
            <Button 
              size="sm" 
              variant={activeTool === 'circle' ? 'default' : 'outline'} 
              onClick={() => setActiveTool('circle')}
            >
              <Circle className="w-4 h-4 mr-1" /> Circle
            </Button>
            <Button 
              size="sm" 
              variant={activeTool === 'rectangle' ? 'default' : 'outline'} 
              onClick={() => setActiveTool('rectangle')}
            >
              <Square className="w-4 h-4 mr-1" /> Box
            </Button>
            <Button 
              size="sm" 
              variant={activeTool === 'line' ? 'default' : 'outline'} 
              onClick={() => setActiveTool('line')}
            >
              <Minus className="w-4 h-4 mr-1" /> Line
            </Button>
            <Button 
              size="sm" 
              variant={activeTool === 'pen' ? 'default' : 'outline'} 
              onClick={() => setActiveTool('pen')}
            >
              <Pencil className="w-4 h-4 mr-1" /> Pen
            </Button>
            <Button 
              size="sm" 
              variant={activeTool === 'text' ? 'default' : 'outline'} 
              onClick={() => setActiveTool('text')}
            >
              <Type className="w-4 h-4 mr-1" /> Text
            </Button>
          </div>

          <div className="flex items-center gap-2 border-r pr-3">
            <span className="text-xs font-medium text-gray-600">Color:</span>
            {colors.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c.value ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-r pr-3">
            <Button size="sm" variant="outline" onClick={handleUndo} disabled={annotations.length === 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear} disabled={annotations.length === 0}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving || annotations.length === 0} 
            className="bg-green-600 hover:bg-green-700 ml-auto"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save ({annotations.length})</>}
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
          <div 
            ref={containerRef}
            className="relative inline-block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleImageClick}
            style={{ cursor: activeTool === 'text' ? 'text' : 'crosshair' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Annotation target"
              className="max-w-full max-h-[70vh] block"
              draggable={false}
            />
            
            {/* SVG Overlay */}
            {imageRef.current && (
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: imageRef.current.clientWidth,
                  height: imageRef.current.clientHeight
                }}
              >
                {/* Existing annotations */}
                {annotations.map((shape, index) => renderShape(shape, index))}
                
                {/* Current drawing shape */}
                {currentShape && renderShape(currentShape, 'current')}
                
                {/* Text being edited */}
                {editingText && (
                  <text
                    x={editingText.startX * imageRef.current.clientWidth}
                    y={editingText.startY * imageRef.current.clientHeight}
                    fill={editingText.color}
                    fontSize="18"
                    fontFamily="Arial"
                    textAnchor="middle"
                  >
                    {textInput || '|'}
                  </text>
                )}
              </svg>
            )}
          </div>

          {/* Text Input Box */}
          {editingText && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-xl">
                <h3 className="font-semibold mb-2">Enter Note Text</h3>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                  className="border rounded px-3 py-2 w-64 mb-3"
                  placeholder="Type your note..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleTextCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 border-t text-sm text-blue-900">
          <strong>💡 Tip:</strong> Click and drag to draw shapes. Annotations use normalized coordinates for perfect accuracy.
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotation;
