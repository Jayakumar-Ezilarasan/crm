import api from '../lib/api';
import { Interaction, ApiResponse } from '../types/models';

export class InteractionService {
  private static cache: Interaction[] | null = null;

  static async list(forceRefresh = false): Promise<Interaction[]> {
    if (!forceRefresh && this.cache) return this.cache;
    const res = await api.get<ApiResponse<Interaction[]>>('/api/interactions');
    this.cache = res.data.data || [];
    return this.cache;
  }

  static async get(id: number): Promise<Interaction> {
    const res = await api.get<ApiResponse<Interaction>>(`/api/interactions/${id}`);
    return res.data.data!;
  }

  static async create(data: Omit<Interaction, 'id'>): Promise<Interaction> {
    const res = await api.post<ApiResponse<Interaction>>('/api/interactions', data);
    this.cache = null;
    return res.data.data!;
  }

  static async update(id: number, data: Partial<Interaction>): Promise<Interaction> {
    const res = await api.put<ApiResponse<Interaction>>(`/api/interactions/${id}`, data);
    this.cache = null;
    return res.data.data!;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`/api/interactions/${id}`);
    this.cache = null;
  }

  static invalidateCache() {
    this.cache = null;
  }
} 