import React, { useEffect, useState } from 'react';
import {
  Package, Search, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw, Filter, ArrowUpDown
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
      notify('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
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

  // Inventory statistics
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity < 5).length;
  const inStockCount = products.filter((p) => p.stock_quantity >= 5).length;

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-orange" />
            Warehouse Product Inventory
          </h2>
          <p className="text-sm text-slate-400">
            Real-time stock management and warehouse catalogue ledger
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-3 py-2 bg-brand-panel hover:bg-brand-card border border-brand-border rounded-lg text-xs font-medium text-slate-300 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stock
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <p className="text-xs uppercase text-slate-400 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{products.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{totalStock} total physical units</p>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <p className="text-xs uppercase text-emerald-400 font-medium">Healthy Stock (≥5)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{inStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sufficient inventory</p>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <p className="text-xs uppercase text-amber-400 font-medium">Low Stock (&lt;5)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{lowStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Reorder recommended</p>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
          <p className="text-xs uppercase text-red-400 font-medium">Out of Stock (0)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{outOfStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Orders blocked by system</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, product name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-brand-card border border-brand-border rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-brand-panel text-slate-200">
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-brand-card border border-brand-border rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              <option value="stock" className="bg-brand-panel text-slate-200">Sort by Stock</option>
              <option value="price" className="bg-brand-panel text-slate-200">Sort by Price</option>
              <option value="name" className="bg-brand-panel text-slate-200">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
            >
              {sortAsc ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products match the filter"
          description="Try adjusting your search criteria or clearing filters."
        />
      ) : (
        <div className="bg-brand-panel border border-brand-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card/50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {filtered.map((product) => {
                  const isOutOfStock = product.stock_quantity === 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-brand-card/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                        {product.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-100">{product.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">
                          {product.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`text-sm ${
                            isOutOfStock
                              ? 'text-red-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {product.stock_quantity}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">units</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/80 border border-red-800 text-red-300">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            IN STOCK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
