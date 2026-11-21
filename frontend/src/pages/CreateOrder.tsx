import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Minus, Trash2, ShoppingCart, CheckCircle, AlertCircle, PackageCheck, AlertTriangle
} from 'lucide-react';
import { getProducts } from '../api/products';
import { createOrder } from '../api/orders';
import type { Product, CartItem } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNotification } from '../components/Notification';

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createdOrderRef, setCreatedOrderRef] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      notify('Failed to load catalogue products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      notify(`'${product.name}' is out of stock`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          notify(`Cannot exceed available stock of ${product.stock_quantity} units`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, newQty: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.product.stock_quantity) {
      notify(`Cannot exceed available stock of ${item.product.stock_quantity} units`, 'error');
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('Cannot place an empty order. Please add products.', 'error');
      return;
    }

    // Client-side verification
    for (const item of cart) {
      if (item.quantity <= 0) {
        notify(`Invalid quantity for ${item.product.name}`, 'error');
        return;
      }
      if (item.quantity > item.product.stock_quantity) {
        notify(
          `Requested ${item.quantity} units of '${item.product.name}' exceeds available ${item.product.stock_quantity}`,
          'error'
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await createOrder(payload);
      setCreatedOrderRef(res.order_reference);
      notify(`Order ${res.order_reference} placed successfully!`, 'success');
      clearCart();
      // Refresh product stock
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to place order';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Create New Order</h2>
          <p className="text-sm text-slate-400">
            Select inventory items and quantities to initiate an operational order
          </p>
        </div>
      </div>

      {/* Success notification if order created */}
      {createdOrderRef && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-200">
                Order Created Successfully: <span className="font-mono">{createdOrderRef}</span>
              </p>
              <p className="text-xs text-green-400/80">
                Stock has been reserved and deducted atomically. Status set to PLACED.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition"
          >
            View in Orders
          </button>
        </div>
      )}

      {/* Two-panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-brand-panel border border-brand-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-brand-orange" />
                Available Warehouse Catalogue
              </h3>
              <span className="text-xs text-slate-500">{products.length} products total</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => {
                const isOutOfStock = p.stock_quantity === 0;
                const isLowStock = p.stock_quantity > 0 && p.stock_quantity < 5;
                const inCart = cart.find((i) => i.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    className={`bg-brand-card border rounded-lg p-4 flex flex-col justify-between transition-all ${
                      isOutOfStock
                        ? 'border-red-900/40 opacity-70'
                        : 'border-brand-border hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-slate-100">{p.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {p.sku}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{p.description}</p>
                    </div>

                    <div className="pt-3 border-t border-brand-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold text-slate-100">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Low: {p.stock_quantity} left
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-medium">
                              Stock: {p.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock || (inCart ? inCart.quantity >= p.stock_quantity : false)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          isOutOfStock
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : inCart && inCart.quantity >= p.stock_quantity
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-brand-orange hover:bg-orange-600 text-white shadow-sm'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isOutOfStock
                          ? 'Out of Stock'
                          : inCart && inCart.quantity >= p.stock_quantity
                          ? 'Max Stock in Cart'
                          : inCart
                          ? `Add Another (Cart: ${inCart.quantity})`
                          : 'Add to Order'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Cart / Manifest Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-brand-panel border border-brand-border rounded-xl p-5 sticky top-20">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-orange" />
                <h3 className="font-semibold text-slate-100">Order Manifest</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-red-400 transition"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-14 text-center">
                <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">Manifest is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Select products from the warehouse catalogue on the left to build an order.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60 max-h-[380px] overflow-y-auto my-3 pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-100 truncate">{product.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ₹{product.price.toLocaleString('en-IN')} × {quantity}
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        Available in stock: {product.stock_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-brand-border rounded-lg bg-brand-card">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1 hover:text-brand-orange text-slate-300 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-100 font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock_quantity}
                          className="p-1 hover:text-brand-orange text-slate-300 disabled:opacity-40 disabled:hover:text-slate-300 transition"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-200 w-16 text-right">
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations & Submit */}
            <div className="pt-4 border-t border-brand-border space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Items Selected</span>
                <span className="font-semibold text-slate-200">
                  {cart.reduce((s, i) => s + i.quantity, 0)} units ({cart.length} SKUs)
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-100 pt-1 border-t border-brand-border/40">
                <span>Total Amount</span>
                <span className="text-base text-brand-orange font-mono">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || submitting}
                className="w-full mt-4 py-3 bg-brand-orange hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Committing Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Dispatch Order to Fulfilment</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                Submitting executes an atomic stock reservation in a single ACID transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
