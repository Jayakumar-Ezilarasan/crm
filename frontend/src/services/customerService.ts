import api from '../lib/api';
import { Customer, ApiResponse } from '../types/models';

export class CustomerService {
  private static cache: Customer[] | null = null;

  static async list(forceRefresh = false): Promise<Customer[]> {
    if (!forceRefresh && this.cache) return this.cache;
    const res = await api.get<ApiResponse<Customer[]>>('/api/customers');
    this.cache = res.data.data || [];
    return this.cache;
  }

  static async get(id: number): Promise<Customer> {
    const res = await api.get<ApiResponse<Customer>>(`/api/customers/${id}`);
    return res.data.data!;
  }

  static async create(data: Omit<Customer, 'id'>): Promise<Customer> {
    const res = await api.post<ApiResponse<Customer>>('/api/customers', data);
    this.cache = null; // Invalidate cache
    return res.data.data!;
  }

  static async update(id: number, data: Partial<Customer>): Promise<Customer> {
    const res = await api.put<ApiResponse<Customer>>(`/api/customers/${id}`, data);
    this.cache = null;
    return res.data.data!;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`/api/customers/${id}`);
    this.cache = null;
  }

  static invalidateCache() {
    this.cache = null;
  }
} 