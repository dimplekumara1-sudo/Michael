import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Types for homepage grid/slider items
type HomepageGridImage = {
  id: string;
  image_url: string;
  title: string | null;
  section: 'grid' | 'slider';
  sort_order: number;
};

const GridGallery = () => {
  const [gridImages, setGridImages] = useState<HomepageGridImage[]>([]);
  const [sliderImages, setSliderImages] = useState<HomepageGridImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Common Tailwind classes for all image containers
  const imageContainerClass = "relative overflow-hidden rounded-lg shadow-lg cursor-pointer group";
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Fetch images from Supabase
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setError(null);
        setLoading(true);

        const { data, error } = await (supabase as any)
          .from('homepage_grid_images')
          .select('*')
          .order('section', { ascending: true })
          .order('sort_order', { ascending: true });

        if (error) throw error;
        const items = (data || []) as HomepageGridImage[];
        setGridImages(items.filter(i => i.section === 'grid'));
        setSliderImages(items.filter(i => i.section === 'slider'));
      } catch (err: any) {
        console.error('Failed to load homepage images', err);
        setError('Failed to load images.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || isHovering) return;

    const isMobile = window.innerWidth <= 768;
    const baseSpeed = 0.5;
    const speed = isMobile ? baseSpeed * 1.5 : baseSpeed;

    let animationFrameId: number;
    const scroll = () => {
      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
        slider.scrollLeft = 0;
      } else {
        slider.scrollLeft += speed;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovering]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 font-inter py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 font-inter py-16 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Grid rows layout derived from the original static structure
  const gridRows: { cols: string; images: HomepageGridImage[] }[] = [
    { cols: 'md:grid-cols-2', images: gridImages.slice(0, 2) },
    { cols: 'md:grid-cols-3', images: gridImages.slice(2, 5) },
    { cols: 'md:grid-cols-3', images: gridImages.slice(5, 8) }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-inter py-16">
      <style>
        {`
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto px-4">
        {/* Contact Us Section */}
        <div className="flex flex-col items-center mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">Get in touch with Us</h3>
          <a
            href="/contact/"
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-300 transform hover:scale-105"
          >
            Contact Us
          </a>
        </div>
        {/* Gallery Section */}
        <div className="space-y-6">
          {/* First grid row: 2 columns */}
          {gridRows[0] && (
            <div className={`grid grid-cols-1 ${gridRows[0].cols} gap-6`}>
              {gridRows[0].images.map((img, idx) => (
                <div key={img.id} className={imageContainerClass}>
                  <img
                    src={img.image_url}
                    alt={img.title || `Gallery image 0-${idx}`}
                    className="w-full h-full object-cover rounded-lg transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1"
                  />
                  <div className="absolute inset-0 rounded-lg transition-all duration-300 group-hover:shadow-[0_0_20px_10px_rgba(0,0,0,0.1)]"></div>
                </div>
              ))}
            </div>
          )}

          {/* Slider row */}
          {sliderImages.length > 0 && (
            <div
              ref={sliderRef}
              className="overflow-x-auto whitespace-nowrap py-4 -my-4 hide-scrollbar"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="flex space-x-6">
                {sliderImages.concat(sliderImages).map((img, idx) => (
                  <div key={`${img.id}-${idx}`} className={`${imageContainerClass} inline-block w-72 h-96 flex-shrink-0`}>
                    <img
                      src={img.image_url}
                      alt={img.title || `Slider image ${idx}`}
                      className="w-full h-full object-cover rounded-lg transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1"
                    />
                    <div className="absolute inset-0 rounded-lg transition-all duration-300 group-hover:shadow-[0_0_20px_10px_rgba(0,0,0,0.1)]"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining grid rows: 3 columns each */}
          {gridRows.slice(1).map((row, rowIndex) => (
            <div key={`row-${rowIndex + 1}`} className={`grid grid-cols-1 ${row.cols} gap-6`}>
              {row.images.map((img, idx) => (
                <div key={img.id} className={imageContainerClass}>
                  <img
                    src={img.image_url}
                    alt={img.title || `Gallery image ${rowIndex + 1}-${idx}`}
                    className="w-full h-full object-cover rounded-lg transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1"
                  />
                  <div className="absolute inset-0 rounded-lg transition-all duration-300 group-hover:shadow-[0_0_20px_10px_rgba(0,0,0,0.1)]"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridGallery;