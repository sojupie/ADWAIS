// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-container rounded-md ${className}`}
      {...props}
    />
  );
}

Skeleton.Card = function SkeletonCard({ className = '', ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={`bg-surface-container-high/70 rounded-xl ${className}`}
      {...props}
    />
  );
};
