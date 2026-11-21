import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No matching operational records for the current filter criteria.',
  icon,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
    <div className="w-10 h-10 rounded-lg bg-brand-surface-raised border border-brand-border flex items-center justify-center text-brand-muted mb-3">
      {icon || <PackageOpen className="w-5 h-5 text-brand-muted" />}
    </div>
    <p className="text-brand-text font-medium text-[14px]">{title}</p>
    <p className="text-brand-secondary text-[13px] mt-1 max-w-sm leading-relaxed">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);