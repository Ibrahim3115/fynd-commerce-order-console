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
  description = 'No matching operational telemetry for the active query.',
  icon,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
    <div className="w-12 h-12 rounded-xl bg-brand-surface-2 border border-brand-border flex items-center justify-center text-brand-muted mb-3.5 shadow-inner">
      {icon || <PackageOpen className="w-6 h-6 text-brand-dim" />}
    </div>
    <p className="text-brand-text font-bold text-sm tracking-wide">{title}</p>
    <p className="text-brand-muted text-xs mt-1 max-w-sm leading-relaxed">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
