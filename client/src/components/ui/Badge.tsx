import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ className, variant = 'secondary', children, ...props }: BadgeProps) => {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-sans transition-colors duration-200",
          {
            "bg-primary/10 text-primary border border-primary/20": variant === 'primary',
            "bg-accent text-accent-foreground border border-border": variant === 'secondary',
            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20": variant === 'success',
            "bg-amber-500/10 text-amber-400 border border-amber-500/20": variant === 'warning',
            "bg-rose-500/10 text-rose-400 border border-rose-500/20": variant === 'danger',
            "bg-blue-500/10 text-blue-400 border border-blue-500/20": variant === 'info',
          },
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
