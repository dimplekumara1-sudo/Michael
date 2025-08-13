import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface MultiImageSliderProps {
  images: string[];
  thumbnails?: string[];
  title: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  onImageChange?: (index: number) => void;
  isModal?: boolean; // New prop to indicate if it's in a modal
}

const MultiImageSlider: React.FC<MultiImageSliderProps> = ({
  images,
  thumbnails,
  title,
  autoSlide = true,
  autoSlideInterval = 4000,
  showDots = true,
  showArrows = true,
  className = '',
  onImageChange,
  isModal = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoSlide);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Only show slider if there are multiple images
  const shouldShowSlider = images && images.length > 1;

  const nextSlide = useCallback(() => {
    if (!shouldShowSlider) return;
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % images.length;
      onImageChange?.(newIndex);
      return newIndex;
    });
  }, [images.length, shouldShowSlider, onImageChange]);

  const prevSlide = useCallback(() => {
    if (!shouldShowSlider) return;
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? images.length - 1 : prevIndex - 1;
      onImageChange?.(newIndex);
      return newIndex;
    });
  }, [images.length, shouldShowSlider, onImageChange]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    onImageChange?.(index);
  }, [onImageChange]);

  // Auto-slide functionality
  useEffect(() => {
    if (isPlaying && shouldShowSlider && autoSlide) {
      intervalRef.current = setInterval(nextSlide, autoSlideInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, shouldShowSlider, autoSlide, autoSlideInterval, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shouldShowSlider) return;
      
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldShowSlider, prevSlide, nextSlide, isPlaying]);

  // Pause auto-slide on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && shouldShowSlider && autoSlide) {
      intervalRef.current = setInterval(nextSlide, autoSlideInterval);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`relative h-64 bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  // Single image - no slider needed
  if (!shouldShowSlider) {
    return (
      <div className={`relative h-64 ${className}`}>
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className.includes('h-') ? '' : 'h-64'} group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={sliderRef}
    >
      {/* Main Image Container */}
      <div 
        className="relative w-full h-full overflow-hidden rounded-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img
                src={image}
                alt={`${title} - Image ${index + 1}`}
                className={`w-full h-full ${isModal ? 'object-contain' : 'object-cover'}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Play/Pause Button */}
        {autoSlide && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        )}

        {/* Image Counter */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Dot Navigation */}
      {showDots && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoSlide && isPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoSlideInterval) / autoSlideInterval) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MultiImageSlider;