import React from 'react';

type OrderStatus = 'PLACED' | 'PACKED' | 'SHIPPED' | 'CANCELLED';

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  PLACED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    label: 'Placed',
  },
  PACKED: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Packed',
  },
  SHIPPED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Shipped',
  },
  CANCELLED: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const normalized = (status || '').toUpperCase();
  const cfg = statusConfig[normalized] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
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