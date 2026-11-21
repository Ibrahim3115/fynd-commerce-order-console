import { api } from './client';
import type { Order } from '../types';

export interface OrdersQuery {
  search?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
}

export const getOrders = async (query?: OrdersQuery): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/api/orders', { params: query });
  return data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const { data } = await api.get<Order>(`/api/orders/${id}`);
  return data;
};

export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const { data } = await api.post<Order>('/api/orders', payload);
  return data;
};

export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const { data } = await api.patch<Order>(`/api/orders/${id}/status`, { status });
  return data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
  const { data } = await api.post<Order>(`/api/orders/${id}/cancel`);
  return data;
};
