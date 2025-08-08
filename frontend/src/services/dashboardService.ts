import api from '../lib/api';
import { ApiResponse } from '../types/models';

export interface DashboardStats {
  totalCustomers: number;
  totalLeads: number;
  totalTasks: number;
  totalUsers: number;
  tasksDueToday: number;
  overdueTasks: number;
  completedTasks: number;
  activeLeads: number;
  recentCustomers: Array<{
    id: number;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentTasks: Array<{
    id: number;
    title: string;
    dueDate: string;
    completed: boolean;
    customer: {
      name: string;
    };
  }>;
  leadPipeline: Array<{
    stage: string;
    count: number;
  }>;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
    return res.data.data!;
  }

  static async getRecentActivity(): Promise<any[]> {
    const res = await api.get<ApiResponse<any[]>>('/api/dashboard/activity');
    return res.data.data || [];
  }
} 