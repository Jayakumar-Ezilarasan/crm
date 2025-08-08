import prisma from '../config/database';

// Query optimization utilities
export class QueryOptimizer {
  // Optimized customer queries with pagination and filtering
  static async getCustomersOptimized(
    page: number = 1,
    limit: number = 20,
    search?: string,
    ownerId?: number
  ) {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              leads: true,
              tasks: true,
              contacts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Optimized task queries with eager loading
  static async getTasksOptimized(
    page: number = 1,
    limit: number = 20,
    userId?: number,
    completed?: boolean
  ) {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (completed !== undefined) {
      where.completed = completed;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              stage: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { completed: 'asc' },
          { dueDate: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Dashboard statistics with optimized queries
  static async getDashboardStats(userId: number) {
    const [
      totalCustomers,
      totalLeads,
      totalTasks,
      completedTasks,
      overdueTasks,
      recentActivity,
    ] = await Promise.all([
      // Total customers owned by user
      prisma.customer.count({
        where: { ownerId: userId },
      }),
      
      // Total leads for user's customers
      prisma.lead.count({
        where: {
          customer: {
            ownerId: userId,
          },
        },
      }),
      
      // Total tasks assigned to user
      prisma.task.count({
        where: { userId },
      }),
      
      // Completed tasks
      prisma.task.count({
        where: {
          userId,
          completed: true,
        },
      }),
      
      // Overdue tasks
      prisma.task.count({
        where: {
          userId,
          completed: false,
          dueDate: {
            lt: new Date(),
          },
        },
      }),
      
      // Recent activity (last 7 days)
      prisma.contact.findMany({
        where: {
          userId,
          contactDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { contactDate: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalCustomers,
      totalLeads,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      recentActivity,
    };
  }

  // Lead pipeline statistics
  static async getLeadPipelineStats(userId: number) {
    const pipelineStats = await prisma.lead.groupBy({
      by: ['stageId'],
      where: {
        customer: {
          ownerId: userId,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        value: true,
      },
    });

    const stages = await prisma.leadStage.findMany({
      orderBy: { order: 'asc' },
    });

    return stages.map(stage => {
      const stats = pipelineStats.find(stat => stat.stageId === stage.id);
      return {
        stage: stage.name,
        count: stats?._count.id || 0,
        totalValue: stats?._sum.value || 0,
      };
    });
  }

  // Search optimization with full-text search
  static async searchOptimized(query: string, userId: number) {
    const searchResults = await Promise.all([
      // Search customers
      prisma.customer.findMany({
        where: {
          ownerId: userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      
      // Search tasks
      prisma.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          customer: {
            select: { name: true },
          },
        },
        take: 5,
      }),
      
      // Search leads
      prisma.lead.findMany({
        where: {
          customer: {
            ownerId: userId,
          },
          OR: [
            { source: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          customer: {
            select: { name: true },
          },
          stage: {
            select: { name: true },
          },
        },
        take: 5,
      }),
    ]);

    return {
      customers: searchResults[0],
      tasks: searchResults[1],
      leads: searchResults[2],
    };
  }
}

// Database index recommendations
export const getIndexRecommendations = () => {
  return [
    // Customer indexes
    'CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);',
    'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);',
    'CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);',
    
    // Task indexes
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);',
    
    // Lead indexes
    'CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);',
    'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);',
    
    // Contact indexes
    'CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_contacts_contact_date ON contacts(contact_date);',
    
    // User indexes
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
  ];
};

// Query performance monitoring
export const monitorQueryPerformance = async (queryName: string, queryFn: () => Promise<any>) => {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`SLOW QUERY: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`QUERY ERROR: ${queryName} failed after ${duration}ms`, error);
    throw error;
  }
};
