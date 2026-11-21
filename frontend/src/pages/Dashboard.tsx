import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, Box, Truck, XCircle,
  TrendingUp, AlertTriangle, Activity,
} from 'lucide-react';
import { getDashboardStats } from '../api/dashboard';
import type { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-brand-card border border-brand-border rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-slate-400 text-xs uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-bold text-slate-100 mt-0.5">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!stats) return <EmptyState title="Could not load dashboard" description="Check if the backend is running." />;

  const statCards = [
    { label: 'Total Orders', value: stats.total_orders, icon: <ShoppingBag className="w-5 h-5 text-brand-orange" />, color: 'bg-brand-orange/10' },
    { label: 'Awaiting Packing', value: stats.placed, icon: <Clock className="w-5 h-5 text-blue-400" />, color: 'bg-blue-500/10' },
    { label: 'Packed', value: stats.packed, icon: <Box className="w-5 h-5 text-amber-400" />, color: 'bg-amber-500/10' },
    { label: 'Shipped', value: stats.shipped, icon: <Truck className="w-5 h-5 text-green-400" />, color: 'bg-green-500/10' },
    { label: 'Cancelled', value: stats.cancelled, icon: <XCircle className="w-5 h-5 text-red-400" />, color: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="col-span-2 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
              <h2 className="text-slate-200 font-semibold text-sm">Recent Orders</h2>
            </div>
            <Link to="/orders" className="text-brand-orange text-xs hover:underline">View all →</Link>
          </div>
          {stats.recent_orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders will appear here." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-brand-border">
                  <th className="text-left px-5 py-3">Order Ref</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Items</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-brand-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-brand-orange">{order.order_reference}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono font-medium">
                      {order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0}
                    </td>
                    <td className="px-5 py-3 text-slate-200 font-medium">₹{order.total_amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3">
                      <Link to="/orders" className="text-xs text-slate-400 hover:text-brand-orange">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-slate-200 font-semibold text-sm">Low Stock Alerts</h2>
          </div>
          {stats.low_stock_products.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">All products well stocked ✓</div>
          ) : (
            <div className="divide-y divide-brand-border/50">
              {stats.low_stock_products.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5">
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{p.name}</p>
                    <p className="text-slate-500 text-xs">{p.sku}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${p.stock_quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}
                  >
                    {p.stock_quantity === 0 ? 'OUT' : p.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border">
          <Activity className="w-4 h-4 text-brand-orange" />
          <h2 className="text-slate-200 font-semibold text-sm">Recent Activity</h2>
        </div>
        {stats.recent_activity.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No activity yet.</div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {stats.recent_activity.map((entry: any) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/5">
                <div className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                <span className="text-slate-400 text-xs flex-1">
                  {entry.order_reference && (
                    <span className="text-brand-orange font-mono">{entry.order_reference} </span>
                  )}
                  {entry.from_status ? `${entry.from_status} → ` : ''}
                  <span className="text-slate-200 font-medium">{entry.to_status}</span>
                  {entry.notes && <span className="ml-2 text-slate-600">({entry.notes})</span>}
                </span>
                <span className="text-slate-600 text-xs">{new Date(entry.changed_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
