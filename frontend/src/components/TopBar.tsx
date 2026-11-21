import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Calendar,
  Clock,
  PanelLeftOpen,
  User,
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import type { DashboardStats } from '../types';
import { useSidebar } from '../context/SidebarContext';

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Operations Dashboard',
    subtitle: 'Real-time telemetry, fulfilment metrics and stock warnings',
  },
  '/orders': {
    title: 'Order Management',
    subtitle: 'Search, track, inspect and transition customer orders',
  },
  '/create-order': {
    title: 'Create Order',
    subtitle: 'Select catalogue items, configure quantities and place orders',
  },
  '/inventory': {
    title: 'Inventory Catalogue',
    subtitle: 'Warehouse product catalogue, SKU pricing and stock levels',
  },
  '/settings': {
    title: 'Settings & Architecture',
    subtitle: 'API gateway status, ACID contracts and system specifications',
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
      className={`fixed top-0 right-0 h-16 bg-brand-surface border-b border-brand-border flex items-center px-6 z-20 gap-4 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'left-[72px]' : 'left-[240px]'
      }`}
    >
      {/* Left: Collapse toggle + Page Context */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-brand-muted hover:text-brand-text p-1.5 rounded-md hover:bg-brand-surface-raised transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-brand-secondary" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-brand-text font-semibold text-[15px] truncate">
            {activePage.title}
          </h1>
          <p className="text-[12px] text-brand-secondary truncate hidden sm:block">
            {activePage.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Telemetry Badges */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Live Counters from Backend Data */}
        {stats && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-surface-raised border border-brand-border">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-brand-text text-[12px] font-medium font-mono tabular-nums">
                {stats.total_orders}{' '}
                <span className="font-sans text-[11px] font-normal text-brand-secondary">orders</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-surface-raised border border-brand-border">
              <Package className="w-3.5 h-3.5 text-brand-secondary" />
              <span className="text-brand-text text-[12px] font-medium font-mono tabular-nums">
                {stats.total_inventory}{' '}
                <span className="font-sans text-[11px] font-normal text-brand-secondary">units</span>
              </span>
            </div>
          </div>
        )}

        {/* Live Clock & Date */}
        <div className="hidden md:flex flex-col items-end text-[12px] border-l border-brand-border pl-3">
          <div className="flex items-center gap-1.5 text-brand-text font-medium font-mono tabular-nums">
            <Clock className="w-3 h-3 text-brand-muted" />
            <span>{timeStr || '--:--:--'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            <Calendar className="w-2.5 h-2.5" />
            <span>{today}</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
          <div className="w-7 h-7 rounded-full bg-brand-surface-raised border border-brand-border flex items-center justify-center text-brand-secondary">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};