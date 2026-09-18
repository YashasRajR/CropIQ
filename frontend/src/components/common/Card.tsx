import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'bordered';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glow = false,
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/70 border border-slate-800 backdrop-blur-sm',
    elevated: 'bg-slate-900/90 border border-slate-750 shadow-xl shadow-black/40 backdrop-blur-md',
    glass: 'bg-slate-900/40 border border-slate-800/80 backdrop-blur-lg',
    bordered: 'bg-transparent border border-slate-800',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl transition-all duration-200',
          variantStyles[variant],
          glow && 'relative before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-r before:from-emerald-500/20 before:to-sky-500/20 before:-z-10',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
