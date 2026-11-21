import React from 'react';

type OrderStatus = 'PLACED' | 'PACKED' | 'SHIPPED' | 'CANCELLED';

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  PLACED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'Placed',
  },
  PACKED: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Packed',
  },
  SHIPPED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Shipped',
  },
  CANCELLED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Cancelled',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const normalized = (status || '').toUpperCase();
  const cfg = statusConfig[normalized] || {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
};