import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            // Base styles
            "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
            // Variants
            {
              "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm": variant === 'primary',
              "bg-accent text-accent-foreground hover:bg-border": variant === 'secondary',
              "border border-border bg-transparent hover:bg-accent text-foreground": variant === 'outline',
              "bg-transparent hover:bg-accent hover:text-accent-foreground text-muted-foreground": variant === 'ghost',
              "bg-danger text-danger-foreground hover:bg-red-600 shadow-sm": variant === 'danger',
              "bg-success text-success-foreground hover:bg-emerald-600 shadow-sm": variant === 'success',
            },
            // Sizes
            {
              "px-3 py-1.5 text-xs": size === 'sm',
              "px-4 py-2 text-sm": size === 'md',
              "px-5 py-2.5 text-base": size === 'lg',
            },
            className
          )
        )}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {/* Left Icon */}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        
        {/* Children */}
        <span>{children}</span>
        
        {/* Right Icon */}
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
