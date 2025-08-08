import api from '../lib/api';
import { Lead, ApiResponse } from '../types/models';

export class LeadService {
  private static cache: Lead[] | null = null;

  static async list(forceRefresh = false): Promise<Lead[]> {
    if (!forceRefresh && this.cache) return this.cache;
    const res = await api.get<ApiResponse<Lead[]>>('/api/leads');
    this.cache = res.data.data || [];
    return this.cache;
  }

  static async get(id: number): Promise<Lead> {
    const res = await api.get<ApiResponse<Lead>>(`/api/leads/${id}`);
    return res.data.data!;
  }

  static async create(data: Omit<Lead, 'id'>): Promise<Lead> {
    const res = await api.post<ApiResponse<Lead>>('/api/leads', data);
    this.cache = null; // Invalidate cache
    return res.data.data!;
  }

  static async update(id: number, data: Partial<Lead>): Promise<Lead> {
    const res = await api.put<ApiResponse<Lead>>(`/api/leads/${id}`, data);
    this.cache = null;
    return res.data.data!;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`/api/leads/${id}`);
    this.cache = null;
  }

  static async getByStage(stage: string): Promise<Lead[]> {
    const res = await api.get<ApiResponse<Lead[]>>(`/api/leads?stage=${encodeURIComponent(stage)}`);
    return res.data.data || [];
  }

  static invalidateCache() {
    this.cache = null;
  }
} 