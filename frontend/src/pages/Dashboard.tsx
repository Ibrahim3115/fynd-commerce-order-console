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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon, color }) => (
  <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-subtle hover:border-brand-border/80 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[13px] font-medium text-brand-secondary">{label}</span>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-[28px] font-semibold text-brand-text font-mono tracking-tight tabular-nums leading-none">
        {value.toLocaleString()}
      </p>
      <p className="text-[12px] text-brand-muted mt-2 font-normal">
        {subtext}
      </p>
    </div>
  </div>
);

// Custom Minimal Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-surface-raised border border-brand-border p-2.5 rounded-lg shadow-lg text-[12px]">
        <p className="text-brand-text font-medium mb-1">{label || payload[0].name}</p>
        <p className="text-brand-accent font-mono font-medium">
          Stock: {payload[0].value.toLocaleString()} units
        </p>
        {payload[0].payload?.sku && (
          <p className="text-brand-muted text-[11px] font-mono mt-0.5">SKU: {payload[0].payload.sku}</p>
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
        <LoadingSpinner size="lg" label="Loading dashboard metrics..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="Unable to connect to service"
        description="Could not establish connection with FastAPI backend server."
        action={
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand-accent text-brand-bg rounded-lg text-[13px] font-medium"
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
      icon: <ShoppingBag className="w-4 h-4 text-brand-accent" />,
      color: 'bg-brand-accent/10',
    },
    {
      label: 'Awaiting Packing',
      value: stats.placed,
      subtext: 'Requires warehouse pick',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      color: 'bg-blue-500/10',
    },
    {
      label: 'Packed Orders',
      value: stats.packed,
      subtext: 'Ready for dispatch',
      icon: <Box className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-500/10',
    },
    {
      label: 'Shipped Orders',
      value: stats.shipped,
      subtext: 'Dispatched to customer',
      icon: <Truck className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
    {
      label: 'Cancelled Orders',
      value: stats.cancelled,
      subtext: 'Restored to catalogue',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      color: 'bg-red-500/10',
    },
    {
      label: 'Inventory Units',
      value: stats.total_inventory,
      subtext: 'Physical units in stock',
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
  ];

  // Inventory bar chart data
  const inventoryChartData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 13) + '..' : p.name,
    units: p.stock_quantity,
    sku: p.sku,
  }));

  // Status breakdown pie data
  const statusPieData = [
    { name: 'Placed', value: stats.placed, color: '#3B82F6' },
    { name: 'Packed', value: stats.packed, color: '#E9A23B' },
    { name: 'Shipped', value: stats.shipped, color: '#22C55E' },
    { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h2 className="text-[26px] font-semibold text-brand-text tracking-tight">
            Operations Overview
          </h2>
          <p className="text-[13px] text-brand-secondary mt-0.5">
            Real-time status across inventory levels, order commitments and fulfilment stages
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface hover:bg-brand-surface-raised border border-brand-border rounded-lg text-[13px] font-medium text-brand-secondary hover:text-brand-text transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-accent' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/create-order"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-bg rounded-lg text-[13px] font-medium transition-colors"
          >
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {/* 6 Metric KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Inventory Capacity by Product */}
        <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-brand-accent/10 text-brand-accent">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-brand-text">
                  Inventory Capacity by Product
                </h3>
                <p className="text-[12px] text-brand-secondary">
                  Available physical units across catalogue SKUs
                </p>
              </div>
            </div>
            <Link
              to="/inventory"
              className="text-[12px] text-brand-accent hover:underline font-medium flex items-center gap-1"
            >
              <span>View inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  stroke="#737D8C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#252D37' }}
                />
                <YAxis
                  stroke="#737D8C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#252D37' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#191F27', opacity: 0.5 }} />
                <Bar dataKey="units" radius={[3, 3, 0, 0]}>
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
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-brand-border text-[12px]">
            <span className="flex items-center gap-1.5 text-brand-secondary">
              <span className="w-2 h-2 rounded-sm bg-brand-accent" /> In Stock (≥5)
            </span>
            <span className="flex items-center gap-1.5 text-brand-secondary">
              <span className="w-2 h-2 rounded-sm bg-amber-500" /> Low Stock (&lt;5)
            </span>
            <span className="flex items-center gap-1.5 text-brand-secondary">
              <span className="w-2 h-2 rounded-sm bg-red-500" /> Out of Stock (0)
            </span>
          </div>
        </div>

        {/* Chart 2: Order Fulfilment State Distribution */}
        <div className="lg:col-span-4 bg-brand-surface border border-brand-border rounded-xl p-5 shadow-subtle flex flex-col justify-between">
          <div className="pb-3 border-b border-brand-border">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-brand-text">
                  Fulfilment Pipeline
                </h3>
                <p className="text-[12px] text-brand-secondary">
                  Distribution across {stats.total_orders} total orders
                </p>
              </div>
            </div>
          </div>

          <div className="py-3">
            {stats.total_orders === 0 ? (
              <div className="py-12 text-center text-[13px] text-brand-muted">
                No orders recorded
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
                        innerRadius={40}
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
                    <span className="text-[20px] font-semibold font-mono text-brand-text leading-none tabular-nums">
                      {stats.total_orders}
                    </span>
                    <span className="text-[11px] text-brand-muted mt-0.5">
                      Orders
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-brand-border text-[12px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-brand-secondary">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Placed
              </span>
              <span className="font-mono font-medium text-brand-text tabular-nums">{stats.placed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-brand-secondary">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Packed
              </span>
              <span className="font-mono font-medium text-brand-text tabular-nums">{stats.packed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-brand-secondary">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Shipped
              </span>
              <span className="font-mono font-medium text-brand-text tabular-nums">{stats.shipped}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-brand-secondary">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Cancelled
              </span>
              <span className="font-mono font-medium text-brand-text tabular-nums">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Row: Recent Orders + Low Stock & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-subtle">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-surface">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-accent" />
              <h3 className="text-[14px] font-medium text-brand-text">Recent Orders</h3>
            </div>
            <Link
              to="/orders"
              className="text-brand-accent text-[12px] font-medium hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recent_orders.length === 0 ? (
            <EmptyState
              title="No recent orders"
              description="Orders created via the order workstation will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-medium text-brand-muted border-b border-brand-border bg-brand-surface-raised/40">
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="text-right px-4 py-2.5">Units</th>
                    <th className="text-right px-4 py-2.5">Total</th>
                    <th className="text-center px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60 text-[13px]">
                  {stats.recent_orders.map((order) => {
                    const itemCount =
                      order.items && Array.isArray(order.items)
                        ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                        : 0;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-brand-surface-raised/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[12px] text-brand-accent font-medium align-middle">
                          {order.order_reference}
                        </td>
                        <td className="px-4 py-3 text-brand-secondary text-[12px] align-middle">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-brand-text font-mono tabular-nums text-[12px] align-middle">
                          {itemCount}
                        </td>
                        <td className="px-4 py-3 text-right text-brand-text font-mono tabular-nums text-[12px] font-medium align-middle">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <Link
                            to="/orders"
                            className="text-[12px] font-medium px-2.5 py-1 rounded bg-brand-surface-raised border border-brand-border text-brand-secondary hover:text-brand-text transition-colors"
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

        {/* Right Column: Low Stock Alerts + Activity Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Low Stock Alerts */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-subtle">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-[14px] font-medium text-brand-text">Low Stock Alerts</h3>
              </div>
              <span className="text-[11px] text-brand-muted">Threshold: &lt;5 units</span>
            </div>

            {stats.low_stock_products.length === 0 ? (
              <div className="p-6 text-center text-brand-secondary text-[13px]">
                All catalogue products have healthy stock levels (≥ 5 units).
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {stats.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-brand-surface-raised/40 transition-colors"
                  >
                    <div>
                      <p className="text-brand-text text-[13px] font-medium">{p.name}</p>
                      <p className="text-brand-muted text-[11px] font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <span
                      className={`text-[12px] font-mono px-2 py-0.5 rounded border ${
                        p.stock_quantity === 0
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-subtle">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-accent" />
                <h3 className="text-[14px] font-medium text-brand-text">Fulfilment Audit Log</h3>
              </div>
              <span className="text-[11px] text-brand-muted">Recent events</span>
            </div>

            {stats.recent_activity.length === 0 ? (
              <div className="p-6 text-center text-brand-muted text-[13px]">
                No recent activity recorded.
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60 max-h-60 overflow-y-auto">
                {stats.recent_activity.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="px-5 py-2.5 flex items-start gap-3 hover:bg-brand-surface-raised/30 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-brand-secondary leading-tight">
                        {entry.order_reference ? (
                          <span className="text-brand-accent font-mono font-medium mr-1.5">
                            {entry.order_reference}
                          </span>
                        ) : entry.order_id ? (
                          <span className="text-brand-accent font-mono font-medium mr-1.5">
                            ORD #{entry.order_id}
                          </span>
                        ) : null}
                        {entry.from_status ? `${entry.from_status} → ` : ''}
                        <span className="text-brand-text font-medium">{entry.to_status}</span>
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-brand-muted mt-0.5 truncate">{entry.notes}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-brand-muted whitespace-nowrap">
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