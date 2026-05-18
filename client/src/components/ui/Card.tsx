import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  glow?: 'blue' | 'green' | 'none';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, glass = false, glow = 'none', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            "bg-card text-card-foreground border border-border rounded-xl shadow-premium transition-all duration-300",
            {
              "hover-glow cursor-pointer": hoverable,
              "glass-card": glass,
              "shadow-glow-blue border-blue-500/10": glow === 'blue',
              "shadow-glow-green border-emerald-500/10": glow === 'green',
            },
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("px-6 py-4 border-b border-border flex flex-col space-y-1.5", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={twMerge("text-lg font-semibold leading-none tracking-tight font-sans text-foreground", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={twMerge("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("p-6 pt-4", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={twMerge("px-6 py-4 border-t border-border flex items-center justify-end space-x-2 bg-background/30 rounded-b-xl", className)} {...props}>
    {children}
  </div>
);
