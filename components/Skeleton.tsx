import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
  );
};

export const DayCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="w-20 h-4 mb-2" />
            <Skeleton className="w-32 h-3" />
          </div>
        </div>
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      
      {/* Topic */}
      <Skeleton className="w-3/4 h-5 mb-3" />
      
      {/* Content lines */}
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
        <Skeleton className="w-4/6 h-3" />
      </div>
      
      {/* Footer */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
        <Skeleton className="w-24 h-8 rounded-lg" />
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
    </div>
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="w-16 h-6 mb-1" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
};

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Yükleniyor...' }) => {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      {/* Header Skeleton */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="w-48 h-6 mb-2" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-24 h-9 rounded-lg" />
            <Skeleton className="w-24 h-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Days Skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <DayCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Loading message */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">{message}</span>
        </div>
      </div>
    </div>
  );
};