import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, RefreshCw, X, ChevronRight } from 'lucide-react';
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

  const advance = async () => {
    const next = STATUS_TRANSITIONS[currentOrder.status];
    if (!next) return;
    setLoading(true);
    try {
      const updated = await updateOrderStatus(currentOrder.id, next);
      setCurrentOrder(updated);
      notify(`Order ${currentOrder.order_reference} moved to ${next}`, 'success');
      onMutation();
    } catch (e: any) {
      notify(e.response?.data?.detail || 'Status update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const doCancel = async () => {
    setLoading(true);
    try {
      const cancelled = await cancelOrder(currentOrder.id);
      setCurrentOrder(cancelled);
      notify(`Order ${currentOrder.order_reference} cancelled`, 'success');
      setConfirmCancel(false);
      onMutation();
    } catch (e: any) {
      notify(e.response?.data?.detail || 'Cancel failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-brand-panel border-l border-brand-border h-full overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border sticky top-0 bg-brand-panel z-10">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Order Reference</p>
              <p className="font-mono text-brand-orange font-bold text-lg">{currentOrder.order_reference}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={currentOrder.status} />
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
                <p className="text-slate-500 text-xs mb-1">Created</p>
                <p className="text-slate-200">{new Date(currentOrder.created_at).toLocaleString()}</p>
              </div>
              <div className="bg-brand-card rounded-lg p-3 border border-brand-border">
                <p className="text-slate-500 text-xs mb-1">Updated</p>
                <p className="text-slate-200">{new Date(currentOrder.updated_at).toLocaleString()}</p>
              </div>
              {currentOrder.cancelled_at && (
                <div className="bg-red-900/20 rounded-lg p-3 border border-red-800/40">
                  <p className="text-red-400 text-xs mb-1">Cancelled At</p>
                  <p className="text-red-300">{new Date(currentOrder.cancelled_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-300 font-semibold text-sm">Order Items</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {(currentOrder.items || []).filter((item) => item && (item.product_name || item.product_name_snapshot || item.quantity > 0)).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} total units
                </span>
              </div>
              <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase border-b border-brand-border bg-brand-panel/40">
                      <th className="text-left px-4 py-3 font-semibold">Product</th>
                      <th className="text-right px-4 py-3 font-semibold w-20">Qty</th>
                      <th className="text-right px-4 py-3 font-semibold w-28">Unit Price</th>
                      <th className="text-right px-4 py-3 font-semibold w-32">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {(() => {
                      const validItems = (currentOrder.items || []).filter(
                        (item) => item && (item.product_name || item.product_name_snapshot || (item.product_id && item.quantity > 0))
                      );
                      if (validItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                              No items found for this order
                            </td>
                          </tr>
                        );
                      }
                      return validItems.map((item) => (
                        <tr key={item.id || item.product_id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3.5 text-left align-middle text-slate-200">
                            <p className="font-semibold text-slate-100">{item.product_name || item.product_name_snapshot}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: #{item.product_id}</p>
                          </td>
                          <td className="px-4 py-3.5 text-right align-middle font-mono font-bold text-slate-200">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right align-middle font-mono text-slate-300">
                            ₹{item.unit_price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3.5 text-right align-middle font-mono font-bold text-slate-100">
                            ₹{item.line_total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brand-panel/90 border-t-2 border-brand-border">
                      <td colSpan={3} className="px-4 py-3.5 text-right text-xs uppercase tracking-wider text-slate-400 font-semibold align-middle">
                        Grand Total
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-brand-orange font-bold text-base align-middle">
                        ₹{currentOrder.total_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status History */}
            {currentOrder.status_history && currentOrder.status_history.length > 0 && (
              <div>
                <h3 className="text-slate-300 font-semibold text-sm mb-3">Status History</h3>
                <div className="space-y-2">
                  {currentOrder.status_history.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? 'bg-brand-orange' : 'bg-brand-border'}`} />
                        {i < currentOrder.status_history.length - 1 && (
                          <div className="w-px flex-1 bg-brand-border mt-1 h-6" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm text-slate-200">
                          {h.from_status ? (
                            <span>{h.from_status} <ChevronRight className="w-3 h-3 inline" /> </span>
                          ) : null}
                          <span className="font-semibold">{h.to_status}</span>
                        </p>
                        <p className="text-xs text-slate-500">{new Date(h.changed_at).toLocaleString()}</p>
                        {h.notes && <p className="text-xs text-slate-400 mt-0.5">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {STATUS_TRANSITIONS[currentOrder.status] && (
                <button
                  onClick={advance}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : NEXT_LABEL[currentOrder.status]}
                </button>
              )}
              {(currentOrder.status === 'PLACED' || currentOrder.status === 'PACKED') && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-semibold rounded-lg border border-red-700/40 transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${currentOrder.order_reference}? Stock will be restored.`}
        confirmLabel="Yes, Cancel"
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
      notify('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAdvance = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = STATUS_TRANSITIONS[order.status];
    if (!next) return;
    setActionLoading(order.id);
    try {
      await updateOrderStatus(order.id, next);
      notify(`${order.order_reference} → ${next}`, 'success');
      fetchOrders();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMutation = () => {
    setSelectedOrder(null);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by order reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-orange appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 bg-brand-card border border-brand-border rounded-lg text-slate-400 hover:text-brand-orange transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-slate-500 text-sm">{orders.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders found" description="Try adjusting your filters." />
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-brand-border bg-brand-panel/30">
                <th className="text-left px-5 py-3">Order Ref</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Items</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {orders.map((order) => {
                const itemCount = order.items && Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                  : 0;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-brand-orange font-semibold align-middle">{order.order_reference}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs align-middle">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right text-slate-200 font-mono font-bold align-middle">{itemCount}</td>
                    <td className="px-5 py-3.5 text-right text-slate-100 font-mono font-medium align-middle">₹{order.total_amount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-center align-middle"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3.5 text-right align-middle">
                      <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-xs px-3 py-1 rounded bg-brand-panel border border-brand-border text-slate-300 hover:border-brand-orange hover:text-brand-orange transition-colors"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                        {STATUS_TRANSITIONS[order.status] && (
                          <button
                            disabled={actionLoading === order.id}
                            onClick={(e) => handleAdvance(order, e)}
                            className="text-xs px-3 py-1 rounded bg-brand-orange/10 border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/20 transition-colors disabled:opacity-50 font-medium"
                          >
                            {actionLoading === order.id ? '...' : NEXT_LABEL[order.status]}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
