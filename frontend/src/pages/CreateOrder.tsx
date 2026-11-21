import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Minus, Trash2, ShoppingCart, CheckCircle, AlertCircle,
  PackageCheck, AlertTriangle, ArrowRight, ShieldCheck,
  Search, X
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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      notify('Failed to load catalogue inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      notify(`'${product.name}' is out of stock`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          notify(`Cannot exceed available inventory of ${product.stock_quantity} units`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
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
  const totalUnitsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('Cannot create an empty order. Please select products.', 'error');
      return;
    }

    // Client-side validation
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
      notify(`Order ${res.order_reference} created successfully`, 'success');
      clearCart();
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create order';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" label="Loading product catalogue..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-brand-border">
        <div>
          <h2 className="text-[26px] font-semibold text-brand-text tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-brand-accent" />
            Create Order
          </h2>
          <p className="text-[13px] text-brand-secondary mt-0.5">
            Select catalogued products, configure line quantities and submit orders
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {createdOrderRef && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-emerald-400">
                Order Created Successfully
              </p>
              <p className="text-[13px] font-mono text-brand-text mt-0.5">
                Reference: <span className="text-brand-accent font-semibold">{createdOrderRef}</span>
              </p>
              <p className="text-[12px] text-brand-secondary mt-0.5">
                Stock has been reserved. Order status initialized to Placed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreatedOrderRef(null)}
              className="px-3 py-1.5 text-[13px] text-brand-secondary hover:text-brand-text transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>View in orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Two-panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Product Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-subtle">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === c
                        ? 'bg-brand-surface-raised text-brand-text border border-brand-border shadow-subtle'
                        : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface-raised/40 border border-transparent'
                    }`}
                  >
                    {c === 'ALL' ? 'All' : c}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter catalogue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-[13px] text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity === 0;
                const isLowStock = p.stock_quantity > 0 && p.stock_quantity < 5;
                const inCart = cart.find((i) => i.product.id === p.id);
                const cartQty = inCart ? inCart.quantity : 0;
                const isMaxedOut = cartQty >= p.stock_quantity;

                return (
                  <div
                    key={p.id}
                    className={`bg-brand-bg border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
                      isOutOfStock
                        ? 'border-brand-border/60 opacity-60'
                        : cartQty > 0
                        ? 'border-brand-accent/40 bg-brand-surface-raised/20'
                        : 'border-brand-border hover:border-brand-border/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-medium text-brand-accent">
                          {p.sku}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-brand-surface-raised text-brand-muted border border-brand-border font-normal">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-medium text-[14px] text-brand-text leading-snug">{p.name}</h4>
                      <p className="text-[12px] text-brand-secondary line-clamp-2 mt-1">{p.description}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-brand-border">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[14px] font-medium font-mono text-brand-text tabular-nums">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Low: {p.stock_quantity} left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Stock: {p.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock || isMaxedOut}
                        className={`w-full py-1.5 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          isOutOfStock
                            ? 'bg-brand-surface-raised text-brand-muted cursor-not-allowed border border-brand-border'
                            : isMaxedOut
                            ? 'bg-brand-surface-raised text-brand-muted cursor-not-allowed border border-brand-border'
                            : 'bg-brand-accent hover:bg-brand-accent-hover text-brand-bg'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isOutOfStock
                          ? 'Out of Stock'
                          : isMaxedOut
                          ? `Max in cart (${cartQty})`
                          : cartQty > 0
                          ? `Add another (${cartQty})`
                          : 'Add to order'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sticky Order Manifest Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 sticky top-20 shadow-subtle">
            <div className="flex items-center justify-between pb-3.5 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-accent" />
                <h3 className="font-medium text-[14px] text-brand-text">
                  Order Manifest
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[12px] text-brand-muted hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-10 h-10 rounded-lg bg-brand-surface-raised border border-brand-border flex items-center justify-center mx-auto mb-2.5 text-brand-muted">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <p className="text-[14px] font-medium text-brand-text">
                  Manifest is empty
                </p>
                <p className="text-[12px] text-brand-secondary mt-1 max-w-xs mx-auto">
                  Select products from the catalogue on the left to prepare an order.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60 max-h-[360px] overflow-y-auto my-2 pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-brand-text truncate">{product.name}</p>
                      <p className="text-[12px] font-mono text-brand-secondary mt-0.5">
                        ₹{product.price.toLocaleString('en-IN')} × {quantity}
                      </p>
                      <p className="text-[11px] text-emerald-400 mt-0.5">
                        Available: {product.stock_quantity} units
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-brand-border rounded-md bg-brand-bg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1 text-brand-muted hover:text-brand-text transition-colors"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-[12px] font-mono font-medium text-brand-text tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock_quantity}
                          className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-30 transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[13px] font-mono font-medium text-brand-text w-16 text-right tabular-nums">
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 text-brand-muted hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations & Order Actions */}
            <div className="pt-3.5 border-t border-brand-border space-y-2.5">
              <div className="flex justify-between text-[12px] text-brand-secondary">
                <span>Items Selected</span>
                <span className="font-mono text-brand-text font-medium tabular-nums">
                  {totalUnitsInCart} units ({cart.length} SKUs)
                </span>
              </div>

              <div className="flex justify-between items-center text-[14px] text-brand-text pt-2 border-t border-brand-border">
                <span className="font-medium">Total Amount</span>
                <span className="text-[16px] text-brand-accent font-mono font-semibold tabular-nums">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || submitting}
                className="w-full mt-3 py-2.5 bg-brand-accent hover:bg-brand-accent-hover disabled:bg-brand-surface-raised disabled:text-brand-muted disabled:cursor-not-allowed text-brand-bg font-medium text-[13px] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Committing order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit & Place Order</span>
                  </>
                )}
              </button>

              <div className="p-2 rounded-md bg-brand-bg border border-brand-border flex items-center gap-2 text-[11px] text-brand-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  ACID guaranteed. Inventory deducted atomically upon confirmation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};