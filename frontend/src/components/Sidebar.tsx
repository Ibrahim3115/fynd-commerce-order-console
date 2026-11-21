import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Plus,
  Package,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', end: false },
  { to: '/create-order', icon: Plus, label: 'Create Order', end: false },
  { to: '/inventory', icon: Package, label: 'Inventory', end: false },
  { to: '/settings', icon: Settings, label: 'Settings', end: false },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-brand-panel border-r border-brand-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-brand-border">
        <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-brand-orange font-bold text-lg leading-none">FYND</span>
          <span className="text-slate-300 font-bold text-lg leading-none"> OPS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-brand-orange/10 text-brand-orange border-l-2 border-brand-orange pl-[10px]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-brand-border">
        <p className="text-xs text-slate-600">FYND OPS v1.0.0</p>
        <p className="text-xs text-slate-700">Hackathon Build</p>
      </div>
    </aside>
  );
};
