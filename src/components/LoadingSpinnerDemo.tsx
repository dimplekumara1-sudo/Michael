import React, { useState } from 'react';
import LoadingSpinner, { FullPageSpinner, InlineSpinner, CenteredSpinner } from './LoadingSpinner';

const LoadingSpinnerDemo: React.FC = () => {
  const [showFullPageSpinner, setShowFullPageSpinner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const showFullPageLoader = () => {
    setShowFullPageSpinner(true);
    setTimeout(() => {
      setShowFullPageSpinner(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading Spinner Demo</h1>
        <p className="text-gray-600">Showcasing the custom loading spinner with your brand icon</p>
      </div>

      {/* Basic Spinner Examples */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Spinners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Small (20px)</h3>
            <LoadingSpinner size={20} text="Loading..." />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Default (40px)</h3>
            <LoadingSpinner text="Loading..." />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Large (60px)</h3>
            <LoadingSpinner size={60} text="Loading..." />
          </div>
        </div>
      </div>

      {/* Pre-built Variants */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pre-built Variants</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Inline Spinner</h3>
            <p className="text-gray-600">
              Processing your request <InlineSpinner size={16} /> please wait...
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Centered Spinner</h3>
            <div className="border border-gray-200 rounded-lg">
              <CenteredSpinner text="Loading content..." />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Interactive Examples</h2>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={simulateLoading}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <InlineSpinner size={16} /> Loading...
                </>
              ) : (
                'Simulate Loading'
              )}
            </button>
          </div>

          <div>
            <button
              onClick={showFullPageLoader}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Show Full Page Loader
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <CenteredSpinner text="Processing your request..." size={50} />
          </div>
        )}
      </div>

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Basic Usage:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import LoadingSpinner from './components/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Custom size and text
<LoadingSpinner size={50} text="Loading photos..." />

// No text
<LoadingSpinner text="" />`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Pre-built Variants:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { FullPageSpinner, InlineSpinner, CenteredSpinner } from './components/LoadingSpinner';

// Full page overlay
<FullPageSpinner text="Loading application..." />

// Inline with text
<p>Processing <InlineSpinner size={16} /> please wait...</p>

// Centered in container
<CenteredSpinner text="Loading gallery..." size={45} />`}
            </pre>
          </div>
        </div>
      </div>

      {/* Full Page Spinner */}
      {showFullPageSpinner && (
        <FullPageSpinner text="Loading full page demo..." />
      )}
    </div>
  );
};

export default LoadingSpinnerDemo;