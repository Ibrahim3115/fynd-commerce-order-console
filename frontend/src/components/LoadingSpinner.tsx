import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-2' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', label }) => (
  <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
    <div
      className={`${sizes[size]} border-brand-border border-t-brand-accent rounded-full animate-spin`}
    />
    {label && <p className="text-[13px] font-normal text-brand-secondary">{label}</p>}
  </div>
);