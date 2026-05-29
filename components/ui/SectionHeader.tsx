import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeader({ title, subtitle, badge, align = 'center', className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-4', align === 'center' ? 'items-center text-center' : 'items-start text-left', className)} {...props}>
      {badge && <div className="mb-2">{badge}</div>}
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="max-w-2xl text-lg text-slate-400">{subtitle}</p>}
    </div>
  );
}
