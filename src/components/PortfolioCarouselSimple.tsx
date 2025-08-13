import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSliderMedia } from '../hooks/useSliderMedia';

interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  category: string;
}

const PortfolioCarouselSimple: React.FC = () => {
  const { getSliderPostsWithFallback, migratePortfolioItems, isLoading } = useSliderMedia();
  const portfolioItems = getSliderPostsWithFallback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-migrate portfolio items on first load if needed
  useEffect(() => {
    const initializeSliderContent = async () => {
      try {
        await migratePortfolioItems();
      } catch (error) {
        console.error('Failed to initialize slider content:', error);
      }
    };

    initializeSliderContent();
  }, [migratePortfolioItems]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || portfolioItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex >= portfolioItems.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, portfolioItems.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? portfolioItems.length - 1 : currentIndex - 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex >= portfolioItems.length - 1 ? 0 : currentIndex + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const getVisibleSlides = () => {
    if (portfolioItems.length === 0) return [];
    const slides = [];
    for (let i = 0; i < Math.min(3, portfolioItems.length); i++) {
      const index = (currentIndex + i) % portfolioItems.length;
      slides.push(portfolioItems[index]);
    }
    return slides;
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See My Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Loading portfolio content...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (portfolioItems.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See My Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Portfolio content is being prepared...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See My Work
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our diverse portfolio showcasing moments of beauty, emotion, and artistry
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Desktop: 3 slides visible */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {getVisibleSlides().map((item, index) => (
              <div key={`${item.id}-${index}`} className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Image Container */}
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Hover Content */}
                  <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-sm font-medium uppercase tracking-wider">
                      View Portfolio
                    </p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                    {item.subtitle}
                  </p>
                  
                  {/* Decorative Line */}
                  <div className="mt-4 mx-auto w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: 1 slide visible */}
          <div className="md:hidden">
            {portfolioItems[currentIndex] && (
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-500">
                {/* Image Container */}
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={portfolioItems[currentIndex].image}
                    alt={portfolioItems[currentIndex].title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Hover Content */}
                  <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-sm font-medium uppercase tracking-wider">
                      View Portfolio
                    </p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {portfolioItems[currentIndex].title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                    {portfolioItems[currentIndex].subtitle}
                  </p>
                  
                  {/* Decorative Line */}
                  <div className="mt-4 mx-auto w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-110 group"
          >
            <ChevronLeft className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-110 group"
          >
            <ChevronRight className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-12 space-x-3">
            {portfolioItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentIndex
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioCarouselSimple;