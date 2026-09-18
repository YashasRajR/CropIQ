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
      'bg-emerald-700 text-white font-semibold hover:bg-emerald-800 active:bg-emerald-900 shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none border border-emerald-800/40',
    secondary:
      'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/80 disabled:bg-slate-100 disabled:text-slate-400',
    outline:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 disabled:border-slate-200 disabled:text-slate-300 shadow-sm',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200 disabled:bg-slate-100 disabled:text-slate-400',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 disabled:text-slate-300',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 min-h-[48px] rounded-xl gap-2.5',
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
