import React from 'react';

export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ lines = 3, className = '' }) => (
  <div role="status" aria-busy="true" className={`animate-pulse space-y-2 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded w-full" />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
); 