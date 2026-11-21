import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Calendar,
  Clock,
  Radio,
  PanelLeftOpen,
  User,
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import type { DashboardStats } from '../types';
import { useSidebar } from '../context/SidebarContext';

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Operations Dashboard',
    subtitle: 'Real-time telemetry, fulfilment metrics & stock warnings',
  },
  '/orders': {
    title: 'Order Management',
    subtitle: 'Search, track, inspect and transition customer orders',
  },
  '/create-order': {
    title: 'Create Order Workstation',
    subtitle: 'Pick catalogue items, build manifests & commit transactions',
  },
  '/inventory': {
    title: 'Warehouse Inventory',
    subtitle: 'Product catalogue ledger, SKU pricing & stock availability',
  },
  '/settings': {
    title: 'System Settings & Architecture',
    subtitle: 'FastAPI gateway status, ACID contracts & telemetry nodes',
  },
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const activePage = pageConfig[location.pathname] || {
    title: 'FYND OPS Console',
    subtitle: 'Commerce Operations Command Center',
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getDashboardStats().then(setStats).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const tInterval = setInterval(updateTime, 1000);
    return () => clearInterval(tInterval);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-brand-surface/95 backdrop-blur-md border-b border-brand-border flex items-center px-6 z-20 gap-4 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'left-[72px]' : 'left-[240px]'
      }`}
    >
      {/* Left: Collapse toggle + Page Context */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-brand-muted hover:text-brand-accent p-1.5 rounded-lg hover:bg-brand-surface-2 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 text-brand-accent" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-brand-text font-bold text-base tracking-tight truncate">
              {activePage.title}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-brand-surface-2 border border-brand-border text-brand-muted">
              Live Node
            </span>
          </div>
          <p className="text-xs text-brand-muted truncate hidden sm:block">
            {activePage.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Live Telemetry Badges */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* System Online Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface-2 border border-brand-border text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-slate-300">
            ENGINE <span className="text-emerald-400 font-bold">ONLINE</span>
          </span>
        </div>

        {/* Live Counters from Backend Data */}
        {stats && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 shadow-inner">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-brand-accent text-xs font-mono font-bold">
                {stats.total_orders}{' '}
                <span className="text-[10px] font-sans font-normal opacity-80">orders</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface-2 border border-brand-border">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 text-xs font-mono font-semibold">
                {stats.total_inventory}{' '}
                <span className="text-[10px] font-sans font-normal text-brand-muted">units</span>
              </span>
            </div>
          </div>
        )}

        {/* Live Clock & Date */}
        <div className="hidden md:flex flex-col items-end text-xs font-mono border-l border-brand-border/60 pl-3">
          <div className="flex items-center gap-1.5 text-brand-text font-bold tracking-wider">
            <Clock className="w-3 h-3 text-brand-accent" />
            <span>{timeStr || '--:--:--'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-brand-muted">
            <Calendar className="w-2.5 h-2.5" />
            <span>{today}</span>
          </div>
        </div>

        {/* Operator Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-brand-border/60">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-surface-2 to-slate-800 border border-brand-border flex items-center justify-center text-brand-text text-xs font-mono font-bold shadow-inner">
            <User className="w-4 h-4 text-brand-accent" />
          </div>
        </div>
      </div>
    </header>
  );
};
