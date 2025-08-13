import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  className = '',
  text = 'Loading...'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <img
          src="https://res.cloudinary.com/drbyg8daj/image/upload/v1754757930/Untitled_8_jxl4s7.png"
          alt="Loading..."
          className="animate-spin"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }}
        />
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// Pre-built spinner variants for common use cases
export const FullPageSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
    <LoadingSpinner size={60} text={text} />
  </div>
);

export const InlineSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <LoadingSpinner size={size} className="inline-flex" text="" />
);

export const CenteredSpinner: React.FC<{ text?: string; size?: number }> = ({ 
  text = 'Loading...', 
  size = 40 
}) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size={size} text={text} />
  </div>
);

export default LoadingSpinner;