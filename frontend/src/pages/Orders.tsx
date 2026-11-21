import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, RefreshCw, X, ChevronRight, Copy, Check,
  Package, Box, Truck, AlertOctagon, ArrowRight,
  Clock, ShieldCheck
} from 'lucide-react';
import { getOrders, getOrder, updateOrderStatus, cancelOrder } from '../api/orders';
import type { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { useNotification } from '../components/Notification';

const STATUS_TRANSITIONS: Record<string, string | null> = {
  PLACED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: null,
  CANCELLED: null,
};

const NEXT_LABEL: Record<string, string> = {
  PLACED: 'Pack Order',
  PACKED: 'Dispatch & Ship',
};

const NEXT_SHORT: Record<string, string> = {
  PLACED: 'Pack',
  PACKED: 'Ship',
};

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
  onMutation: () => void;
}

const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ order, onClose, onMutation }) => {
  const { notify } = useNotification();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
    getOrder(order.id)
      .then((fullOrder) => {
        if (fullOrder) {
          setCurrentOrder(fullOrder);
        }
      })
      .catch(() => {});
  }, [order.id, order]);

  const copyReference = () => {
    navigator.clipboard.writeText(currentOrder.order_reference);
    setCopied(true);
    notify(`Copied ${currentOrder.order_reference} to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const advance = async () => {
    const next = STATUS_TRANSITIONS[currentOrder.status];
    if (!next) return;
    setLoading(true);
    try {
      const updated = await updateOrderStatus(currentOrder.id, next);
      setCurrentOrder(updated);
      notify(`Order ${currentOrder.order_reference} advanced to ${next}`, 'success');
      onMutation();
    } catch (e: any) {
      notify(e.response?.data?.detail || 'Status transition failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const doCancel = async () => {
    setLoading(true);
    try {
      const cancelled = await cancelOrder(currentOrder.id);
      setCurrentOrder(cancelled);
      notify(`Order ${currentOrder.order_reference} cancelled. Stock restored.`, 'success');
      setConfirmCancel(false);
      onMutation();
    } catch (e: any) {
      notify(e.response?.data?.detail || 'Cancellation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pipeline stages calculation
  const isCancelled = currentOrder.status === 'CANCELLED';
  const steps = [
    { key: 'PLACED', label: 'Placed', icon: Package },
    { key: 'PACKED', label: 'Packed', icon: Box },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  ];

  const getStepState = (stepKey: string) => {
    if (isCancelled) return 'cancelled';
    const orderRank: Record<string, number> = { PLACED: 1, PACKED: 2, SHIPPED: 3 };
    const currentRank = orderRank[currentOrder.status] || 0;
    const targetRank = orderRank[stepKey] || 0;
    if (currentRank > targetRank) return 'completed';
    if (currentRank === targetRank) return 'current';
    return 'upcoming';
  };

  // Calculate items summary cleanly
  const validItems = (currentOrder.items || []).filter(
    (item) => item && (item.product_name || item.product_name_snapshot || (item.product_id && item.quantity > 0))
  );
  const totalUnits = validItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Slide-in Drawer */}
        <div className="relative w-full max-w-xl bg-brand-surface border-l border-brand-border h-full overflow-y-auto shadow-2xl flex flex-col z-50 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border sticky top-0 bg-brand-surface/95 backdrop-blur z-20">
            <div>
              <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-muted">
                Order Manifest Detail
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-base font-bold text-brand-orange tracking-wide">
                  {currentOrder.order_reference}
                </span>
                <button
                  onClick={copyReference}
                  title="Copy Reference"
                  className="p-1 rounded text-brand-muted hover:text-brand-text hover:bg-brand-surface-raised transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={currentOrder.status} />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-raised transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {/* Fulfilment Pipeline Stepper */}
            <div className="p-4 rounded-xl bg-brand-surface-raised/50 border border-brand-border">
              <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted mb-3">
                Fulfilment Pipeline Stage
              </p>
              {isCancelled ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-300">Order Cancelled</p>
                    <p className="text-[11px] text-red-400/80">
                      Dispatched allocations reversed. Stock automatically restored to catalogue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {steps.map((st, idx) => {
                    const state = getStepState(st.key);
                    const StepIcon = st.icon;
                    return (
                      <div
                        key={st.key}
                        className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                          state === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : state === 'current'
                            ? 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange ring-1 ring-brand-orange/20'
                            : 'bg-brand-dark/40 border-brand-border/60 text-brand-muted/50'
                        }`}
                      >
                        <StepIcon className="w-4 h-4 mb-1" />
                        <span className="text-[11px] font-semibold tracking-wide">
                          {idx + 1}. {st.label}
                        </span>
                        <span className="text-[9px] uppercase font-mono mt-0.5">
                          {state === 'completed' ? 'Completed' : state === 'current' ? 'Active State' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timestamps & Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-brand-surface-raised/40 rounded-lg border border-brand-border">
                <span className="text-[10px] text-brand-muted uppercase font-mono flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-brand-muted" /> Placed At
                </span>
                <p className="text-brand-text font-medium">
                  {new Date(currentOrder.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="p-3 bg-brand-surface-raised/40 rounded-lg border border-brand-border">
                <span className="text-[10px] text-brand-muted uppercase font-mono flex items-center gap-1 mb-1">
                  <RefreshCw className="w-3 h-3 text-brand-muted" /> Last Updated
                </span>
                <p className="text-brand-text font-medium">
                  {new Date(currentOrder.updated_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {currentOrder.cancelled_at && (
                <div className="col-span-2 p-3 bg-red-950/20 rounded-lg border border-red-800/30 text-xs">
                  <span className="text-[10px] text-red-400 uppercase font-mono mb-1 block">
                    Cancellation Timestamp
                  </span>
                  <p className="text-red-300 font-medium">
                    {new Date(currentOrder.cancelled_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider font-mono">
                  Order Line Items
                </h4>
                <span className="text-[11px] font-mono text-brand-muted">
                  {validItems.length} SKUs · {totalUnits} units total
                </span>
              </div>

              <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-dark/40">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-surface-raised/50 text-[10px] uppercase font-mono tracking-wider text-brand-muted">
                      <th className="text-left px-3.5 py-2.5 font-medium">Product / SKU</th>
                      <th className="text-right px-3.5 py-2.5 font-medium w-16">Qty</th>
                      <th className="text-right px-3.5 py-2.5 font-medium w-24">Unit Price</th>
                      <th className="text-right px-3.5 py-2.5 font-medium w-24">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {validItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-brand-muted text-xs">
                          No line items found for this order.
                        </td>
                      </tr>
                    ) : (
                      validItems.map((item) => (
                        <tr key={item.id || item.product_id} className="hover:bg-brand-surface-raised/30 transition-colors">
                          <td className="px-3.5 py-2.5 align-middle">
                            <p className="font-semibold text-brand-text">
                              {item.product_name || item.product_name_snapshot}
                            </p>
                            <p className="text-[10px] font-mono text-brand-muted mt-0.5">
                              ID: #{item.product_id}
                            </p>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-brand-text tabular-nums align-middle">
                            {item.quantity}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-brand-muted tabular-nums align-middle">
                            ₹{item.unit_price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-brand-text tabular-nums align-middle">
                            ₹{item.line_total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brand-surface-raised/70 border-t-2 border-brand-border">
                      <td colSpan={3} className="px-3.5 py-3 text-right text-[11px] uppercase font-mono tracking-wider text-brand-muted font-bold align-middle">
                        Grand Total
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-brand-orange font-bold text-sm tabular-nums align-middle">
                        ₹{currentOrder.total_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status History Audit Trail */}
            {currentOrder.status_history && currentOrder.status_history.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider font-mono mb-3">
                  Fulfilment Audit Log
                </h4>
                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-border">
                  {currentOrder.status_history.map((h, i) => (
                    <div key={h.id || i} className="relative">
                      <div
                        className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-brand-surface ${
                          i === 0 ? 'bg-brand-orange ring-2 ring-brand-orange/30' : 'bg-brand-border'
                        }`}
                      />
                      <div className="bg-brand-surface-raised/30 border border-brand-border/60 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-brand-text flex items-center gap-1">
                            {h.from_status ? (
                              <>
                                <span className="font-mono text-[10px] text-brand-muted">{h.from_status}</span>
                                <ChevronRight className="w-3 h-3 text-brand-muted" />
                              </>
                            ) : null}
                            <span className="font-mono text-[11px] text-brand-orange">{h.to_status}</span>
                          </span>
                          <span className="text-[10px] font-mono text-brand-muted">
                            {new Date(h.changed_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        {h.notes && (
                          <p className="text-[11px] text-brand-muted mt-1 font-mono">
                            {h.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 px-6 border-t border-brand-border bg-brand-surface/95 backdrop-blur sticky bottom-0 z-20 flex gap-3">
            {STATUS_TRANSITIONS[currentOrder.status] && (
              <button
                onClick={advance}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-light text-brand-dark font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>{NEXT_LABEL[currentOrder.status]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {(currentOrder.status === 'PLACED' || currentOrder.status === 'PACKED') && (
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={loading}
                className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        title="Cancel Operational Order"
        message={`Are you sure you want to cancel ${currentOrder.order_reference}? This will immediately release allocated units back to active inventory catalogue.`}
        confirmLabel="Confirm Cancellation"
        dangerous
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </>
  );
};

export const Orders: React.FC = () => {
  const { notify } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setOrders(data);
    } catch {
      notify('Failed to load orders from operations server', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAdvance = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = STATUS_TRANSITIONS[order.status];
    if (!next) return;
    setActionLoading(order.id);
    try {
      await updateOrderStatus(order.id, next);
      notify(`${order.order_reference} transitioned to ${next}`, 'success');
      fetchOrders();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Failed to update order state', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMutation = () => {
    fetchOrders();
  };

  // Status counts for filter pills
  const statusTabs = [
    { key: '', label: 'All Orders' },
    { key: 'PLACED', label: 'Placed' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Controls & Segmented Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-surface p-3 rounded-xl border border-brand-border">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-orange text-brand-dark font-bold shadow-sm'
                    : 'bg-brand-surface-raised/40 text-brand-muted hover:text-brand-text hover:bg-brand-surface-raised'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Filter by reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-brand-text placeholder-brand-muted/60 focus:outline-none focus:border-brand-orange transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={fetchOrders}
            title="Refresh Orders"
            className="p-2 bg-brand-surface-raised hover:bg-brand-border text-brand-muted hover:text-brand-orange rounded-lg border border-brand-border transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Data Grid */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-card">
        {loading ? (
          <div className="py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found matching criteria"
            description="Try modifying search keywords or switching status filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-raised/60 text-[10px] uppercase font-mono tracking-wider text-brand-muted font-semibold">
                  <th className="text-left px-5 py-3">Order Ref</th>
                  <th className="text-left px-5 py-3">Placed At</th>
                  <th className="text-right px-5 py-3">Manifest Units</th>
                  <th className="text-right px-5 py-3">Order Value</th>
                  <th className="text-center px-5 py-3">Fulfilment State</th>
                  <th className="text-right px-5 py-3">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {orders.map((order) => {
                  const validOrderItems = (order.items || []).filter(
                    (item) => item && (item.product_name || item.product_name_snapshot || (item.product_id && item.quantity > 0))
                  );
                  const itemCount = validOrderItems.reduce(
                    (sum, item) => sum + (Number(item.quantity) || 0),
                    0
                  );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-brand-surface-raised/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-orange align-middle group-hover:underline">
                        {order.order_reference}
                      </td>
                      <td className="px-5 py-3.5 text-brand-muted font-mono text-[11px] align-middle">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        <span className="text-[10px] opacity-70">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-brand-text tabular-nums align-middle">
                        {itemCount}{' '}
                        <span className="text-[10px] font-normal text-brand-muted">
                          ({validOrderItems.length} SKUs)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-brand-text tabular-nums text-xs align-middle">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-brand-surface-raised hover:bg-brand-border text-brand-muted hover:text-brand-text border border-brand-border transition-colors"
                          >
                            Inspect
                          </button>
                          {STATUS_TRANSITIONS[order.status] && (
                            <button
                              disabled={actionLoading === order.id}
                              onClick={(e) => handleAdvance(order, e)}
                              className="px-2.5 py-1 rounded text-[11px] font-bold bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange border border-brand-orange/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <span>{NEXT_SHORT[order.status]}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Ledger Bar */}
        <div className="px-5 py-2.5 bg-brand-surface-raised/40 border-t border-brand-border flex items-center justify-between text-[11px] font-mono text-brand-muted">
          <span>Displaying {orders.length} order records</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ACID Isolation Level Guaranteed
          </span>
        </div>
      </div>

      {/* Slide-out Order Detail Drawer */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMutation={handleMutation}
        />
      )}
    </div>
  );
};