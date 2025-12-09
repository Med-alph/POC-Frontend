import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageViewer({ isOpen, onClose, session, initialImageIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || !session || !session.images.length) return null;

  const currentImage = session.images[currentIndex];
  const totalImages = session.images.length;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
    setZoom(1);
    setRotation(0);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
    setZoom(1);
    setRotation(0);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-semibold">{session.session_label}</h2>
            <p className="text-sm text-gray-300">
              {session.body_part} • {new Date(session.session_date).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {currentIndex + 1} of {totalImages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {totalImages > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 p-3"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 p-3"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          disabled={zoom <= 0.5}
          className="text-white hover:bg-white/20"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
          disabled={zoom >= 3}
          className="text-white hover:bg-white/20"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-white/30 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={rotate}
          className="text-white hover:bg-white/20"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-20">
        <img
          src={currentImage.image_url}
          alt={`${session.session_label} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {totalImages > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 max-w-[90vw] overflow-x-auto">
          {session.images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setRotation(0);
              }}
              className={`w-12 h-12 rounded border-2 overflow-hidden transition-all flex-shrink-0 ${
                index === currentIndex
                  ? 'border-white'
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <img
                src={image.image_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
