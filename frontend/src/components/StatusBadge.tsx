import React from 'react';

type OrderStatus = 'PLACED' | 'PACKED' | 'SHIPPED' | 'CANCELLED';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PLACED: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Placed' },
  PACKED: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Packed' },
  SHIPPED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Shipped' },
  CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = statusConfig[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400', label: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
};
