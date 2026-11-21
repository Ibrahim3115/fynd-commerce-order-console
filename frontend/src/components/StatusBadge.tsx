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
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    label: 'PLACED',
  },
  PACKED: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'PACKED',
  },
  SHIPPED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'SHIPPED',
  },
  CANCELLED: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    label: 'CANCELLED',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const cfg = statusConfig[status] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
};
