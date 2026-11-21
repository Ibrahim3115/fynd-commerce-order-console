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
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', end: false },
  { to: '/create-order', icon: PlusCircle, label: 'Create Order', end: false },
  { to: '/inventory', icon: Boxes, label: 'Inventory', end: false },
  { to: '/settings', icon: Sliders, label: 'Settings', end: false },
];

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-brand-surface border-r border-brand-border flex flex-col z-30 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-[230px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-brand-border justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-brand-accent text-white flex items-center justify-center flex-shrink-0 shadow-subtle">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <span className="text-brand-text font-semibold text-[14px] tracking-tight block leading-tight">
                FYND OPS
              </span>
              <span className="text-[11px] text-brand-secondary font-normal block leading-tight">
                Commerce Console
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-brand-muted hover:text-brand-text p-1 rounded-md hover:bg-brand-surface-subtle transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-medium text-brand-muted tracking-normal">
            Operations
          </p>
        )}

        <nav className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-accent-subtle text-brand-accent'
                    : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface-subtle'
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
                    <span className="truncate">{label}</span>
                  ) : (
                    /* Floating tooltip in collapsed mode */
                    <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-brand-surface border border-brand-border rounded-md text-[12px] font-medium text-brand-text whitespace-nowrap shadow-card opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
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
              className="text-brand-muted hover:text-brand-text p-1 rounded-md hover:bg-brand-surface-subtle transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-brand-secondary" />
            </button>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Operational" />
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 text-[12px]">
            <span className="flex items-center gap-2 text-brand-secondary font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Operational
            </span>
            <span className="text-[11px] text-brand-muted font-normal">v3.0</span>
          </div>
        )}
      </div>
    </aside>
  );
};