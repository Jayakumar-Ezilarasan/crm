export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  type: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  ownerId: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Interaction {
  id: number;
  customer_id: number;
  user_id: number;
  type: string;
  summary?: string;
  interaction_date: string;
}

export interface Lead {
  id: number;
  customerId: number;
  stageId: number;
  value?: number;
  source?: string;
  notes?: string;
  createdAt: string;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  stage?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Task {
  id: number;
  userId: number;
  customerId: number;
  leadId?: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  lead?: {
    id: number;
    stage?: {
      name: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 