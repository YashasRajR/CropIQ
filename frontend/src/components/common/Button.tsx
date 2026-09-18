import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-emerald-600 text-white font-medium hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-950/50 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none border border-emerald-500/30',
    secondary:
      'bg-slate-800 text-slate-200 hover:bg-slate-750 active:bg-slate-850 border border-slate-700 disabled:bg-slate-900 disabled:text-slate-600',
    outline:
      'bg-transparent text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10 active:bg-emerald-500/20 disabled:border-slate-800 disabled:text-slate-600',
    danger:
      'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 active:bg-rose-600/40 disabled:bg-slate-900 disabled:text-slate-600',
    ghost:
      'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 disabled:text-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
