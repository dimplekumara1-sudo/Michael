import React from 'react';
import MultiImageSlider from './MultiImageSlider';

const MultiImageTest: React.FC = () => {
  // Test images - you can replace these with actual URLs
  const testImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop'
  ];

  const testThumbnails = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=150&fit=crop',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=200&h=150&fit=crop'
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Multi-Image Slider Test</h1>
      
      <div className="space-y-8">
        {/* Test 1: Multiple images with auto-slide */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 1: Multiple Images with Auto-slide</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <MultiImageSlider
              images={testImages}
              thumbnails={testThumbnails}
              title="Test Multi-Image Post"
              autoSlide={true}
              autoSlideInterval={3000}
              showDots={true}
              showArrows={true}
              className="h-96"
            />
          </div>
        </div>

        {/* Test 2: Multiple images without auto-slide */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 2: Multiple Images without Auto-slide</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <MultiImageSlider
              images={testImages}
              thumbnails={testThumbnails}
              title="Test Multi-Image Post (Manual)"
              autoSlide={false}
              showDots={true}
              showArrows={true}
              className="h-96"
            />
          </div>
        </div>

        {/* Test 3: Single image (should not show slider) */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 3: Single Image (No Slider)</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <MultiImageSlider
              images={[testImages[0]]}
              thumbnails={[testThumbnails[0]]}
              title="Test Single Image Post"
              autoSlide={true}
              showDots={true}
              showArrows={true}
              className="h-96"
            />
          </div>
        </div>

        {/* Test 4: Two images */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 4: Two Images</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <MultiImageSlider
              images={testImages.slice(0, 2)}
              thumbnails={testThumbnails.slice(0, 2)}
              title="Test Two Image Post"
              autoSlide={true}
              autoSlideInterval={4000}
              showDots={true}
              showArrows={true}
              className="h-96"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Test 1 should auto-advance every 3 seconds</li>
          <li>• Test 2 should only advance manually using arrows or dots</li>
          <li>• Test 3 should show a single image without slider controls</li>
          <li>• Test 4 should show a slider with 2 images</li>
          <li>• All sliders should support keyboard navigation (arrow keys, spacebar)</li>
          <li>• All sliders should support touch/swipe on mobile devices</li>
          <li>• Hover over sliders to pause auto-advance</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiImageTest;