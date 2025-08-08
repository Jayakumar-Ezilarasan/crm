import api from '../lib/api';
import { User, ApiResponse } from '../types/models';

export class UserService {
  private static cache: User[] | null = null;

  static async list(): Promise<User[]> {
    if (this.cache) return this.cache;
    
    const res = await api.get<ApiResponse<User[]>>('/api/users');
    this.cache = res.data.data!;
    return this.cache;
  }

  static async get(id: number): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/api/users/${id}`);
    return res.data.data!;
  }

  static async getByRole(role: string): Promise<User[]> {
    const users = await this.list();
    return users.filter(user => user.role === role);
  }

  static invalidateCache(): void {
    this.cache = null;
  }
} 