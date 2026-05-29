'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, ...props }, ref) => {
    const Component = hoverEffect ? motion.div : 'div';
    const motionProps = hoverEffect ? {
      whileHover: { y: -5, transition: { duration: 0.2 } },
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    } : {};

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={cn(
          'rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-black/40',
          hoverEffect && 'hover:shadow-indigo-500/10 hover:border-white/20 transition-colors',
          className
        )}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(motionProps as any)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
