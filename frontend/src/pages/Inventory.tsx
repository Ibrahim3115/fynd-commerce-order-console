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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-orange" />
            Warehouse Product Inventory & Stock Ledger
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time multi-SKU catalogue tracking with atomic stock reservation guarantees
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface hover:bg-brand-surface-raised border border-brand-border rounded-lg text-xs font-semibold text-brand-muted hover:text-brand-orange transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stock
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-mono tracking-wider text-brand-muted font-bold">
              Catalogue SKUs
            </p>
            <Boxes className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-2xl font-bold font-mono text-brand-text mt-2 tabular-nums">
            {products.length}
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">
            {totalStockUnits} physical units total
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
              Healthy Stock (≥ 5)
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-2 tabular-nums">
            {healthyStockCount}
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">
            Optimal fulfilment buffer
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
              Low Stock Alert (&lt; 5)
            </p>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-2 tabular-nums">
            {lowStockCount}
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">
            Reorder threshold reached
          </p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-bold">
              Depleted / Out of Stock
            </p>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-400 mt-2 tabular-nums">
            {outOfStockCount}
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">
            Order placement blocked
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((c) => {
            const isActive = categoryFilter === c;
            return (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-orange text-brand-dark font-bold shadow-sm'
                    : 'bg-brand-surface-raised/40 text-brand-muted hover:text-brand-text hover:bg-brand-surface-raised'
                }`}
              >
                {c === 'ALL' ? 'All Categories' : c}
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
              placeholder="Search SKU or name..."
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

          <div className="flex items-center gap-1.5 bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-brand-text focus:outline-none cursor-pointer"
            >
              <option value="stock" className="bg-brand-surface text-brand-text">Sort by Stock</option>
              <option value="price" className="bg-brand-surface text-brand-text">Sort by Price</option>
              <option value="name" className="bg-brand-surface text-brand-text">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-surface-raised text-brand-muted hover:text-brand-text transition-colors"
            >
              {sortAsc ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="py-24 flex justify-center bg-brand-surface border border-brand-border rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products match the filter"
          description="Try adjusting your search criteria or switching category filters."
        />
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-raised/60 text-[10px] uppercase font-mono tracking-wider text-brand-muted font-semibold">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name & Specifications</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Stock Level / Capacity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.map((product) => {
                  const isOutOfStock = product.stock_quantity === 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
                  const stockPercent = Math.min(100, Math.round((product.stock_quantity / maxStock) * 100));

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-brand-surface-raised/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-orange align-middle">
                        {product.sku}
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <p className="font-semibold text-brand-text group-hover:text-brand-orange-light transition-colors">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-brand-muted truncate max-w-sm mt-0.5">
                          {product.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-surface-raised text-brand-muted border border-brand-border">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-text tabular-nums align-middle">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <div className="font-mono font-bold text-xs tabular-nums">
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
                            <span className="text-[10px] text-brand-muted ml-1 font-normal">units</span>
                          </div>
                          {/* Stock visual progress bar */}
                          <div className="w-24 h-1.5 rounded-full bg-brand-dark overflow-hidden border border-brand-border/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOutOfStock
                                  ? 'bg-red-500 w-0'
                                  : isLowStock
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.max(5, stockPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            Depleted
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Healthy
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
          <div className="px-5 py-2.5 bg-brand-surface-raised/40 border-t border-brand-border flex items-center justify-between text-[11px] font-mono text-brand-muted">
            <span>Showing {filtered.length} of {products.length} catalogued SKUs</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              Total Units Available: <strong className="text-brand-text font-bold">{totalStockUnits}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};