import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Box,
  Truck,
  XCircle,
  Package,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { getDashboardStats } from '../api/dashboard';
import { getProducts } from '../api/products';
import type { DashboardStats, Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

interface StatCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  color,
  borderColor,
}) => (
  <div className={`bg-brand-surface border ${borderColor} rounded-xl p-5 shadow-panel flex flex-col justify-between hover:border-brand-accent/40 transition-all duration-200 group`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-mono uppercase tracking-wider text-brand-muted font-semibold">
        {label}
      </span>
      <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-105`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-3xl font-extrabold text-brand-text font-mono tracking-tight tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-brand-dim mt-1.5 font-medium flex items-center gap-1">
        <span>{subtext}</span>
      </p>
    </div>
  </div>
);

// Custom Dark Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-surface-2 border border-brand-border p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-brand-text font-bold mb-1">{label || payload[0].name}</p>
        <p className="text-brand-accent font-semibold">
          Units: {payload[0].value.toLocaleString()}
        </p>
        {payload[0].payload?.sku && (
          <p className="text-brand-dim text-[10px] mt-0.5">SKU: {payload[0].payload.sku}</p>
        )}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [sData, pData] = await Promise.all([getDashboardStats(), getProducts()]);
      setStats(sData);
      setProducts(pData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" label="INITIALIZING REAL-TIME TELEMETRY..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="Telemetry Node Unreachable"
        description="Could not establish connection with FastAPI backend on port 8000."
        action={
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand-accent text-brand-bg rounded-lg text-xs font-bold"
          >
            Retry Connection
          </button>
        }
      />
    );
  }

  const statCards: StatCardProps[] = [
    {
      label: 'Total Orders',
      value: stats.total_orders,
      subtext: 'Cumulative processed orders',
      icon: <ShoppingBag className="w-5 h-5 text-brand-accent" />,
      color: 'bg-brand-accent/10',
      borderColor: 'border-brand-border',
    },
    {
      label: 'Awaiting Packing',
      value: stats.placed,
      subtext: 'Requires warehouse pick',
      icon: <Clock className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-500/10',
      borderColor: 'border-brand-border',
    },
    {
      label: 'Packed Orders',
      value: stats.packed,
      subtext: 'Ready for courier dispatch',
      icon: <Box className="w-5 h-5 text-amber-400" />,
      color: 'bg-amber-500/10',
      borderColor: 'border-brand-border',
    },
    {
      label: 'Shipped Orders',
      value: stats.shipped,
      subtext: 'Dispatched to customer',
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10',
      borderColor: 'border-brand-border',
    },
    {
      label: 'Cancelled Orders',
      value: stats.cancelled,
      subtext: 'Stock restored to catalogue',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      color: 'bg-red-500/10',
      borderColor: 'border-brand-border',
    },
    {
      label: 'Inventory Units',
      value: stats.total_inventory,
      subtext: 'Physical units in warehouse',
      icon: <Package className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10',
      borderColor: 'border-brand-border',
    },
  ];

  // Real inventory bar chart data from backend products
  const inventoryChartData = products.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + '..' : p.name,
    units: p.stock_quantity,
    sku: p.sku,
  }));

  // Real order status distribution data from backend stats
  const statusPieData = [
    { name: 'Placed', value: stats.placed, color: '#3B82F6' },
    { name: 'Packed', value: stats.packed, color: '#E9A23B' },
    { name: 'Shipped', value: stats.shipped, color: '#10B981' },
    { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-brand-text tracking-tight">
              Operational Command Overview
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
              Active Telemetry
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1">
            Real-time synchronization across warehouse inventory, ACID order commitments, and state transitions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface hover:bg-brand-surface-2 border border-brand-border rounded-lg text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-accent' : ''}`} />
            <span>Sync Node</span>
          </button>
          <Link
            to="/create-order"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-bg rounded-lg text-xs font-bold transition-colors shadow-glow-accent"
          >
            <span>+ Dispatch Order</span>
          </Link>
        </div>
      </div>

      {/* 6 Metric KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Operations Data Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Inventory Units by Product (8 cols) */}
        <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-panel">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/20">
                <BarChart3 className="w-4 h-4 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  Warehouse Inventory Capacity by Product
                </h3>
                <p className="text-[11px] text-brand-muted">
                  Physical unit availability across active SKU catalogue
                </p>
              </div>
            </div>
            <Link
              to="/inventory"
              className="text-[11px] text-brand-accent hover:underline font-semibold flex items-center gap-1"
            >
              <span>Catalogue Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  stroke="#5A6472"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#252D37' }}
                />
                <YAxis
                  stroke="#5A6472"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#252D37' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#191F27', opacity: 0.5 }} />
                <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                  {inventoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.units === 0 ? '#EF4444' : entry.units < 5 ? '#F59E0B' : '#E9A23B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-brand-border/40 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-accent" /> Healthy Stock (≥5)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Low Stock (&lt;5)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Depleted (0)
            </span>
          </div>
        </div>

        {/* Chart 2: Order Fulfilment State Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-panel flex flex-col justify-between">
          <div className="pb-3 border-b border-brand-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <PieChartIcon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  Fulfilment State Pipeline
                </h3>
                <p className="text-[11px] text-brand-muted">
                  Distribution of {stats.total_orders} total commitments
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            {stats.total_orders === 0 ? (
              <div className="py-12 text-center text-xs text-brand-muted">
                No orders processed yet
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-36 h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={3}
                        stroke="#11151B"
                        strokeWidth={2}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold font-mono text-brand-text leading-none">
                      {stats.total_orders}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-brand-muted mt-0.5">
                      Orders
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-brand-border/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Placed
              </span>
              <span className="font-mono font-bold text-slate-100">{stats.placed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Packed
              </span>
              <span className="font-mono font-bold text-slate-100">{stats.packed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Shipped
              </span>
              <span className="font-mono font-bold text-slate-100">{stats.shipped}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Cancelled
              </span>
              <span className="font-mono font-bold text-slate-100">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Row: Recent Orders (7 cols) + Low Stock & Activity (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-panel">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-2/40">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-brand-accent" />
              <h2 className="text-sm font-bold text-brand-text">Recent Orders Ledger</h2>
            </div>
            <Link
              to="/orders"
              className="text-brand-accent text-xs font-bold hover:underline flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recent_orders.length === 0 ? (
            <EmptyState
              title="No orders committed yet"
              description="New orders created via the workstation will be streamed here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-brand-muted uppercase tracking-wider border-b border-brand-border bg-brand-surface-2/20 font-semibold">
                    <th className="text-left px-5 py-3">Order Ref</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-right px-5 py-3">Units</th>
                    <th className="text-right px-5 py-3">Amount</th>
                    <th className="text-center px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 text-xs">
                  {stats.recent_orders.map((order) => {
                    const itemCount =
                      order.items && Array.isArray(order.items)
                        ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                        : 0;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-brand-surface-2/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-brand-accent font-bold align-middle">
                          {order.order_reference}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs align-middle">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-right text-brand-text font-mono font-bold align-middle">
                          {itemCount}
                        </td>
                        <td className="px-5 py-3.5 text-right text-brand-text font-mono font-medium align-middle">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center align-middle">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right align-middle">
                          <Link
                            to="/orders"
                            className="text-xs px-2.5 py-1 rounded bg-brand-surface-2 border border-brand-border text-slate-300 hover:text-brand-accent hover:border-brand-accent transition-colors font-medium"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Critical Alerts + Fulfilment Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-2/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-brand-text">Low Stock Critical Alerts</h2>
              </div>
              <span className="text-[10px] font-mono text-brand-dim uppercase">Threshold: &lt;5</span>
            </div>

            {stats.low_stock_products.length === 0 ? (
              <div className="p-8 text-center text-brand-muted text-xs">
                All inventory items healthy (&gt;= 5 units) ✓
              </div>
            ) : (
              <div className="divide-y divide-brand-border/40">
                {stats.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-brand-surface-2/50 transition-colors"
                  >
                    <div>
                      <p className="text-brand-text text-xs font-bold">{p.name}</p>
                      <p className="text-brand-dim text-[10px] font-mono mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                        p.stock_quantity === 0
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {p.stock_quantity === 0 ? 'DEPLETED (0)' : `${p.stock_quantity} units left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Fulfilment Activity */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-2/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-accent" />
                <h2 className="text-sm font-bold text-brand-text">Fulfilment Audit Log</h2>
              </div>
              <span className="text-[10px] font-mono text-brand-dim uppercase">Live Feed</span>
            </div>

            {stats.recent_activity.length === 0 ? (
              <div className="p-8 text-center text-brand-muted text-xs">No status changes recorded.</div>
            ) : (
              <div className="divide-y divide-brand-border/40 max-h-64 overflow-y-auto">
                {stats.recent_activity.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-brand-surface-2/40 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-muted leading-tight">
                        {entry.order_reference ? (
                          <span className="text-brand-accent font-mono font-bold mr-1.5">
                            {entry.order_reference}
                          </span>
                        ) : entry.order_id ? (
                          <span className="text-brand-accent font-mono font-bold mr-1.5">
                            ORD #{entry.order_id}
                          </span>
                        ) : null}
                        {entry.from_status ? `${entry.from_status} → ` : ''}
                        <span className="text-brand-text font-bold">{entry.to_status}</span>
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-brand-dim mt-0.5 truncate">{entry.notes}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-brand-dim whitespace-nowrap">
                      {new Date(entry.changed_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
