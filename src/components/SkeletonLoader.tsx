import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
      default:
        return 'rounded-lg';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const PostSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
    <SkeletonLoader height="16rem" className="w-full" />
    <div className="p-6">
      <SkeletonLoader height="1.5rem" className="mb-2" />
      <SkeletonLoader variant="text" lines={2} className="mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SkeletonLoader width="4rem" height="1.25rem" />
          <SkeletonLoader width="5rem" height="1.25rem" />
          <SkeletonLoader width="4rem" height="1.25rem" />
        </div>
        <SkeletonLoader width="6rem" height="1rem" />
      </div>
    </div>
  </div>
);

export const CommentSkeleton: React.FC = () => (
  <div className="flex space-x-3">
    <SkeletonLoader variant="circular" width="2rem" height="2rem" />
    <div className="flex-1">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <SkeletonLoader width="4rem" height="0.875rem" />
          <SkeletonLoader width="3rem" height="0.75rem" />
        </div>
        <SkeletonLoader variant="text" lines={2} />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;