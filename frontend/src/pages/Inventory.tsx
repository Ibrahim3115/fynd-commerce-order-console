import React, { useEffect, useState, useMemo } from 'react';
import {
  Package, Search, AlertTriangle, AlertCircle, CheckCircle2,
  RefreshCw, ArrowUpDown, X, Layers, Boxes, ShieldAlert
} from 'lucide-react';
import { getProducts } from '../api/products';
import type { Product } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useNotification } from '../components/Notification';

export const Inventory: React.FC = () => {
  const { notify } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'stock' | 'price' | 'name'>('stock');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      notify('Failed to load inventory catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const query = search.toLowerCase();
        const matchSearch =
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query);
        const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'stock') comparison = a.stock_quantity - b.stock_quantity;
        else if (sortBy === 'price') comparison = a.price - b.price;
        else comparison = a.name.localeCompare(b.name);
        return sortAsc ? comparison : -comparison;
      });
  }, [products, search, categoryFilter, sortBy, sortAsc]);

  // Inventory statistics
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity < 5).length;
  const healthyStockCount = products.filter((p) => p.stock_quantity >= 5).length;

  // Maximum stock unit across products for relative progress bar scaling
  const maxStock = useMemo(() => {
    return Math.max(...products.map((p) => p.stock_quantity), 25);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h2 className="text-[26px] font-semibold text-brand-text tracking-tight flex items-center gap-2.5">
            <Package className="w-5 h-5 text-brand-accent" />
            Product Inventory
          </h2>
          <p className="text-[13px] text-brand-secondary mt-0.5">
            Real-time warehouse catalogue tracking and physical stock availability
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface hover:bg-brand-surface-raised border border-brand-border rounded-lg text-[13px] font-medium text-brand-secondary hover:text-brand-text transition-colors shadow-subtle"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stock
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-brand-secondary">
              Catalogue SKUs
            </span>
            <Boxes className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-[28px] font-semibold font-mono text-brand-text mt-2 tabular-nums leading-none">
            {products.length}
          </p>
          <p className="text-[12px] text-brand-muted mt-2">
            {totalStockUnits} units total
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-brand-secondary">
              In Stock (≥ 5)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[28px] font-semibold font-mono text-emerald-400 mt-2 tabular-nums leading-none">
            {healthyStockCount}
          </p>
          <p className="text-[12px] text-brand-muted mt-2">
            Healthy inventory buffer
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-brand-secondary">
              Low Stock (&lt; 5)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[28px] font-semibold font-mono text-amber-400 mt-2 tabular-nums leading-none">
            {lowStockCount}
          </p>
          <p className="text-[12px] text-brand-muted mt-2">
            Reorder threshold reached
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-brand-secondary">
              Out of Stock (0)
            </span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-[28px] font-semibold font-mono text-red-400 mt-2 tabular-nums leading-none">
            {outOfStockCount}
          </p>
          <p className="text-[12px] text-brand-muted mt-2">
            Order placement blocked
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {categories.map((c) => {
            const isActive = categoryFilter === c;
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-surface-raised text-brand-text border border-brand-border shadow-subtle'
                    : 'text-brand-secondary hover:text-brand-text hover:bg-brand-surface-raised/50 border border-transparent'
                }`}
              >
                {c === 'ALL' ? 'All' : c}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-[13px] text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
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

          <div className="flex items-center gap-1.5 bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[12px] text-brand-secondary focus:outline-none cursor-pointer"
            >
              <option value="stock" className="bg-brand-surface text-brand-text">Sort by Stock</option>
              <option value="price" className="bg-brand-surface text-brand-text">Sort by Price</option>
              <option value="name" className="bg-brand-surface text-brand-text">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-brand-surface-raised border border-brand-border text-brand-secondary hover:text-brand-text transition-colors"
            >
              {sortAsc ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="py-24 flex justify-center bg-brand-surface border border-brand-border rounded-xl">
          <LoadingSpinner size="lg" label="Loading catalogue..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products match the filter"
          description="Try adjusting your search criteria or switching category filters."
        />
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-raised/40 text-[11px] font-medium text-brand-muted">
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Available Stock</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-[13px]">
                {filtered.map((product) => {
                  const isOutOfStock = product.stock_quantity === 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
                  const stockPercent = Math.min(100, Math.round((product.stock_quantity / maxStock) * 100));

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-brand-surface-raised/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-[12px] text-brand-accent font-medium align-middle">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <p className="font-medium text-brand-text">
                          {product.name}
                        </p>
                        <p className="text-[12px] text-brand-secondary line-clamp-1 mt-0.5 max-w-sm">
                          {product.description}
                        </p>
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <span className="px-2 py-0.5 rounded text-[11px] font-normal text-brand-muted bg-brand-surface-raised border border-brand-border">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[13px] text-brand-text font-medium tabular-nums align-middle">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <div className="font-mono font-medium text-[13px] tabular-nums">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-red-400'
                                  : isLowStock
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }
                            >
                              {product.stock_quantity}
                            </span>
                            <span className="text-[11px] text-brand-muted ml-1 font-sans font-normal">units</span>
                          </div>
                          {/* Minimal stock progress bar */}
                          <div className="w-20 h-1 rounded-full bg-brand-bg overflow-hidden border border-brand-border/60">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${
                                isOutOfStock
                                  ? 'bg-red-500 w-0'
                                  : isLowStock
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.max(4, stockPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center align-middle">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-red-500/10 border border-red-500/20 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-2.5 bg-brand-surface border-t border-brand-border flex items-center justify-between text-[12px] text-brand-secondary">
            <span>Showing {filtered.length} of {products.length} products</span>
            <span className="flex items-center gap-1.5 text-brand-muted text-[11px]">
              <Layers className="w-3.5 h-3.5 text-brand-accent" />
              Total inventory: <strong className="text-brand-text font-medium">{totalStockUnits} units</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};