import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'soft' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/90 shadow-sm',
    elevated: 'bg-white border border-slate-200 shadow-md shadow-emerald-950/5',
    soft: 'bg-emerald-50/50 border border-emerald-200/60',
    bordered: 'bg-transparent border border-slate-200',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl transition-all duration-200',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
