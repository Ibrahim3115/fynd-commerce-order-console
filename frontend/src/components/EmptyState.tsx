import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  description = 'Nothing to show here yet.',
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-brand-border mb-4">
      {icon || <PackageOpen className="w-12 h-12" />}
    </div>
    <p className="text-slate-300 font-medium text-lg">{title}</p>
    <p className="text-slate-500 text-sm mt-1">{description}</p>
  </div>
);
