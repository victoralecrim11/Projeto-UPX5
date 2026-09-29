import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-slate-800/80 rounded w-1/4"></div>
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
