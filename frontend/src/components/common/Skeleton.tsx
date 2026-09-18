import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse rounded-lg bg-slate-200/80',
          className
        )
      )}
    />
  );
};
