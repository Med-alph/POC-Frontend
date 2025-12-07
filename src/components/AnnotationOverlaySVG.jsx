import React from 'react';

/**
 * Simple SVG-based annotation overlay that scales perfectly with the image
 * Annotations are stored as percentages of image dimensions for perfect accuracy
 */
const AnnotationOverlaySVG = ({ annotations, imageRef }) => {
  if (!annotations || !annotations.objects || annotations.objects.length === 0) {
    return null;
  }

  if (!imageRef?.current) {
    return null;
  }

  const img = imageRef.current;
  const imgWidth = img.clientWidth;
  const imgHeight = img.clientHeight;

  console.log('🎨 Rendering SVG overlay, image size:', imgWidth, 'x', imgHeight);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
      viewBox={`0 0 ${imgWidth} ${imgHeight}`}
      preserveAspectRatio="none"
    >
      {annotations.objects.map((obj, index) => {
        const type = obj.type?.toLowerCase();
        const stroke = obj.stroke || '#FF0000';
        const strokeWidth = obj.strokeWidth || 3;

        // Convert percentage-based coordinates back to pixels
        const x = (obj.leftPercent / 100) * imgWidth;
        const y = (obj.topPercent / 100) * imgHeight;
        const width = (obj.widthPercent / 100) * imgWidth;
        const height = (obj.heightPercent / 100) * imgHeight;

        if (type === 'circle') {
          const radius = (obj.radiusPercent / 100) * Math.min(imgWidth, imgHeight);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={radius}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        } else if (type === 'rect') {
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        } else if (type === 'line') {
          const x2 = (obj.x2Percent / 100) * imgWidth;
          const y2 = (obj.y2Percent / 100) * imgHeight;
          return (
            <line
              key={index}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        } else if (type === 'path') {
          // For freehand paths, scale the path data
          return (
            <path
              key={index}
              d={obj.pathData}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              transform={`scale(${imgWidth / 100}, ${imgHeight / 100})`}
            />
          );
        } else if (type === 'text' || type === 'i-text' || type === 'itext') {
          const fontSize = (obj.fontSizePercent / 100) * imgHeight;
          return (
            <text
              key={index}
              x={x}
              y={y}
              fill={obj.fill || stroke}
              fontSize={fontSize}
              fontFamily={obj.fontFamily || 'Arial'}
            >
              {obj.text}
            </text>
          );
        }

        return null;
      })}
    </svg>
  );
};

export default AnnotationOverlaySVG;
