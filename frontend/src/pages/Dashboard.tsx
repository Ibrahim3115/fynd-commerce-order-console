import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, Box, Truck, XCircle, Package,
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
      <p className="text-2xl font-bold text-slate-100 mt-0.5 font-mono">{value}</p>
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
    { label: 'Packed Orders', value: stats.packed, icon: <Box className="w-5 h-5 text-amber-400" />, color: 'bg-amber-500/10' },
    { label: 'Shipped Orders', value: stats.shipped, icon: <Truck className="w-5 h-5 text-green-400" />, color: 'bg-green-500/10' },
    { label: 'Cancelled Orders', value: stats.cancelled, icon: <XCircle className="w-5 h-5 text-red-400" />, color: 'bg-red-500/10' },
    { label: 'Inventory Units', value: stats.total_inventory, icon: <Package className="w-5 h-5 text-emerald-400" />, color: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-panel/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
              <h2 className="text-slate-200 font-semibold text-sm">Recent Orders</h2>
            </div>
            <Link to="/orders" className="text-brand-orange text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {stats.recent_orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders will appear here once placed." />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-brand-border bg-brand-panel/20">
                  <th className="text-left px-5 py-3 font-semibold">Order Ref</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Items</th>
                  <th className="text-right px-5 py-3 font-semibold">Total</th>
                  <th className="text-center px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {stats.recent_orders.map((order) => {
                  const itemCount = order.items && Array.isArray(order.items)
                    ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                    : 0;

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-brand-orange font-semibold align-middle">{order.order_reference}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs align-middle">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right text-slate-200 font-mono font-bold align-middle">{itemCount}</td>
                      <td className="px-5 py-3.5 text-right text-slate-100 font-mono font-medium align-middle">₹{order.total_amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-center align-middle"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-right align-middle">
                        <Link to="/orders" className="text-xs px-2.5 py-1 rounded bg-brand-panel border border-brand-border text-slate-300 hover:text-brand-orange hover:border-brand-orange transition-colors">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border bg-brand-panel/30">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-slate-200 font-semibold text-sm">Low Stock Alerts (&lt;5 units)</h2>
          </div>
          {stats.low_stock_products.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">All products well stocked ✓</div>
          ) : (
            <div className="divide-y divide-brand-border/40">
              {stats.low_stock_products.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-slate-200 text-sm font-semibold">{p.name}</p>
                    <p className="text-slate-500 text-xs font-mono">{p.sku}</p>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                      p.stock_quantity === 0
                        ? 'bg-red-950/80 text-red-400 border border-red-800'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {p.stock_quantity === 0 ? 'OUT OF STOCK' : `${p.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border bg-brand-panel/30">
          <Activity className="w-4 h-4 text-brand-orange" />
          <h2 className="text-slate-200 font-semibold text-sm">Recent Fulfilment Activity</h2>
        </div>
        {stats.recent_activity.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No activity recorded yet.</div>
        ) : (
          <div className="divide-y divide-brand-border/40">
            {stats.recent_activity.map((entry: any) => (
              <div key={entry.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-orange flex-shrink-0" />
                <span className="text-slate-400 text-xs flex-1">
                  {entry.order_reference ? (
                    <span className="text-brand-orange font-mono font-semibold mr-1.5">{entry.order_reference}</span>
                  ) : entry.order_id ? (
                    <span className="text-brand-orange font-mono font-semibold mr-1.5">Order #{entry.order_id}</span>
                  ) : null}
                  {entry.from_status ? (
                    <span className="text-slate-400">{entry.from_status} → </span>
                  ) : null}
                  <span className="text-slate-200 font-semibold">{entry.to_status}</span>
                  {entry.notes && <span className="ml-2 text-slate-500 italic">({entry.notes})</span>}
                </span>
                <span className="text-slate-500 font-mono text-xs">{new Date(entry.changed_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
