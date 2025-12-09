import React, { useState, useEffect } from 'react';

/**
 * CLEAN IMPLEMENTATION - Simple SVG overlay for displaying annotations
 * Uses normalized coordinates (0-1) for perfect positioning at any size
 */
const AnnotationOverlay = ({ annotations, imageRef }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  console.log('🎨 AnnotationOverlay received:', { annotations, hasImageRef: !!imageRef?.current });
  
  // Wait for image to load
  useEffect(() => {
    if (!imageRef?.current) {
      setImageLoaded(false);
      return;
    }

    const img = imageRef.current;
    
    const handleLoad = () => {
      console.log('✅ Image loaded in overlay');
      setImageLoaded(true);
    };

    if (img.complete && img.naturalWidth > 0) {
      // Image already loaded
      setImageLoaded(true);
    } else {
      // Wait for image to load
      img.addEventListener('load', handleLoad);
      return () => img.removeEventListener('load', handleLoad);
    }
  }, [imageRef]);
  
  if (!imageRef?.current || !imageLoaded) {
    console.log('⚠️ No image ref or not loaded yet');
    return null;
  }

  // Handle different annotation formats
  let annotationArray = [];
  
  if (Array.isArray(annotations)) {
    // Direct array format
    annotationArray = annotations;
  } else if (annotations && Array.isArray(annotations.shapes)) {
    // New SVG format: { version: '6.0', shapes: [...] }
    annotationArray = annotations.shapes;
  } else if (annotations && Array.isArray(annotations.annotations)) {
    // Wrapped format: { annotations: [...] }
    annotationArray = annotations.annotations;
  } else if (annotations && Array.isArray(annotations.objects)) {
    // Old Fabric.js format: { objects: [...] }
    console.log('⚠️ Old annotation format detected. Please re-annotate this image.');
    return null;
  }

  console.log('📊 Annotation array:', annotationArray);

  if (annotationArray.length === 0) {
    console.log('⚠️ No annotations to display');
    return null;
  }

  const img = imageRef.current;
  const width = img.clientWidth;
  const height = img.clientHeight;
  
  console.log('✅ Rendering', annotationArray.length, 'annotations at size:', width, 'x', height);

  // Render a single annotation shape
  const renderShape = (shape, index) => {
    // Convert normalized coords (0-1) to pixels
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
          stroke={shape.color || '#FF0000'}
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
          stroke={shape.color || '#FF0000'}
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
          stroke={shape.color || '#FF0000'}
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
          stroke={shape.color || '#FF0000'}
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
          fill={shape.color || '#FF0000'}
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

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: width,
        height: height
      }}
    >
      {annotationArray.map((shape, index) => renderShape(shape, index))}
    </svg>
  );
};

export default AnnotationOverlay;
