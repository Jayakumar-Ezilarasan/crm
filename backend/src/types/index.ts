export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  owner_id: number;
  category_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Interaction {
  id: number;
  customer_id: number;
  user_id: number;
  type: string;
  summary?: string;
  interaction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Lead {
  id: number;
  customer_id: number;
  category_id?: number;
  stage: string;
  value?: number;
  source?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Task {
  id: number;
  user_id: number;
  customer_id: number;
  lead_id?: number;
  category_id?: number;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 