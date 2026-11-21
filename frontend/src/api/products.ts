import { api } from './client';
import type { Product } from '../types';

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<Product[]>('/api/products');
  return data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await api.get<Product>(`/api/products/${id}`);
  return data;
};
