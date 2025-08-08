import api from '../lib/api';
import { User, ApiResponse } from '../types/models';

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalLeads: number;
  totalTasks: number;
  activeUsers: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
}

export class AdminService {
  static async getUsers(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/api/admin/users');
    return res.data.data || [];
  }

  static async getUser(id: number): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/api/admin/users/${id}`);
    return res.data.data!;
  }

  static async createUser(data: CreateUserData): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/api/admin/users', data);
    return res.data.data!;
  }

  static async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const res = await api.put<ApiResponse<User>>(`/api/admin/users/${id}`, data);
    return res.data.data!;
  }

  static async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  }

  static async getStats(): Promise<AdminStats> {
    const res = await api.get<ApiResponse<AdminStats>>('/api/admin/stats');
    return res.data.data!;
  }

  static async getReport(type: string, period: string = 'month'): Promise<any> {
    const res = await api.get<ApiResponse<any>>(`/api/admin/reports?type=${type}&period=${period}`);
    return res.data.data || [];
  }
} 