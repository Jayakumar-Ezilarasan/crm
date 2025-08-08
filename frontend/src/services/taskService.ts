import api from '../lib/api';
import { Task, ApiResponse } from '../types/models';

export class TaskService {
  private static cache: Task[] | null = null;

  static async list(forceRefresh = false): Promise<Task[]> {
    if (!forceRefresh && this.cache) return this.cache;
    const res = await api.get<ApiResponse<Task[]>>('/api/tasks');
    this.cache = res.data.data || [];
    return this.cache;
  }

  static async get(id: number): Promise<Task> {
    const res = await api.get<ApiResponse<Task>>(`/api/tasks/${id}`);
    return res.data.data!;
  }

  static async create(data: Omit<Task, 'id'>): Promise<Task> {
    const res = await api.post<ApiResponse<Task>>('/api/tasks', data);
    this.cache = null; // Invalidate cache
    return res.data.data!;
  }

  static async update(id: number, data: Partial<Task>): Promise<Task> {
    const res = await api.put<ApiResponse<Task>>(`/api/tasks/${id}`, data);
    this.cache = null;
    return res.data.data!;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
    this.cache = null;
  }

  static async toggleComplete(id: number, completed: boolean): Promise<Task> {
    const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${id}`, { completed });
    this.cache = null;
    return res.data.data!;
  }

  static async getByUser(userId: number): Promise<Task[]> {
    const res = await api.get<ApiResponse<Task[]>>(`/api/tasks?user_id=${userId}`);
    return res.data.data || [];
  }

  static async getOverdue(): Promise<Task[]> {
    const res = await api.get<ApiResponse<Task[]>>('/api/tasks?overdue=true');
    return res.data.data || [];
  }

  static invalidateCache() {
    this.cache = null;
  }
} 