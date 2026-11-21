import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, Package, Calendar } from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import type { DashboardStats } from '../types';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/create-order': 'Create Order',
  '/inventory': 'Inventory',
  '/settings': 'Settings',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'FYND OPS';
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getDashboardStats().then(setStats).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-brand-panel border-b border-brand-border flex items-center px-6 z-20 gap-4">
      <h1 className="text-slate-100 font-semibold text-base flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        {stats && (
          <>
            <div className="flex items-center gap-1.5 bg-brand-orange/10 border border-brand-orange/30 px-3 py-1 rounded-full">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-brand-orange text-xs font-semibold">{stats.total_orders} orders</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 border border-brand-border px-3 py-1 rounded-full">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-xs font-medium">{stats.total_inventory} items</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          {today}
        </div>
      </div>
    </header>
  );
};
