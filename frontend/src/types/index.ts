export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface StatusHistory {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
}

export interface Order {
  id: number;
  order_reference: string;
  status: 'PLACED' | 'PACKED' | 'SHIPPED' | 'CANCELLED';
  total_amount: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  items: OrderItem[];
  status_history: StatusHistory[];
}

export interface DashboardStats {
  total_orders: number;
  placed: number;
  packed: number;
  shipped: number;
  cancelled: number;
  total_inventory: number;
  low_stock_products: Product[];
  recent_orders: Order[];
  recent_activity: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  id: number;
  order_id: number;
  order_reference?: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
