import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-100 rounded-md ${className}`}
      {...props}
    />
  );
}

Skeleton.Card = function SkeletonCard({ className = '', ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={`bg-slate-200/70 rounded-xl ${className}`}
      {...props}
    />
  );
};
