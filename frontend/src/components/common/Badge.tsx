import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'purple' | 'earth';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    rose: 'bg-rose-50 text-rose-800 border-rose-200 font-medium',
    sky: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 font-medium',
    earth: 'bg-amber-50 text-amber-900 border-amber-200 font-medium',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-normal transition-colors',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
