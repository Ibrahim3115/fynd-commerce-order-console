import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Boxes,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null, end: true },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', badge: null, end: false },
  { to: '/create-order', icon: PlusCircle, label: 'Create Order', badge: null, end: false },
  { to: '/inventory', icon: Boxes, label: 'Inventory', badge: null, end: false },
  { to: '/settings', icon: Sliders, label: 'Settings', badge: null, end: false },
];

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-brand-surface border-r border-brand-border flex flex-col z-30 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-brand-border justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-surface-raised border border-brand-border flex items-center justify-center flex-shrink-0 text-brand-accent">
            <Layers className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="text-brand-text font-semibold text-[15px] tracking-tight">FYND OPS</span>
              </div>
              <p className="text-[12px] text-brand-secondary font-normal truncate">
                Commerce Console
              </p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-brand-muted hover:text-brand-text p-1.5 rounded-md hover:bg-brand-surface-raised transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 pt-1 pb-2 text-[11px] font-medium text-brand-muted">
            Operations
          </p>
        )}

        <nav className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-surface-raised text-brand-text border border-brand-border'
                    : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface-raised/50 border border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-secondary'
                    }`}
                  />
                  {!isCollapsed ? (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded font-normal bg-brand-surface-raised text-brand-muted border border-brand-border">
                          {badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Floating tooltip in collapsed mode */
                    <div className="absolute left-full ml-3 px-2 py-1 bg-brand-surface border border-brand-border rounded-md text-[12px] font-medium text-brand-text whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-brand-border bg-brand-surface">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="text-brand-muted hover:text-brand-text p-1.5 rounded-md hover:bg-brand-surface-raised transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-brand-secondary" />
            </button>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Operational" />
          </div>
        ) : (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-[12px] text-brand-secondary">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                System
              </span>
              <span className="text-emerald-400 font-medium text-[11px]">Operational</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-border/60">
              <span>FYND OPS Console</span>
              <span>v2.1</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};