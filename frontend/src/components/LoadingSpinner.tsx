import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', label }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    <div
      className={`${sizes[size]} border-brand-border border-t-brand-accent rounded-full animate-spin`}
    />
    {label && <p className="text-xs font-mono text-brand-muted tracking-wider">{label}</p>}
  </div>
);
