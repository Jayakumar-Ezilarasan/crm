import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalCustomers,
      totalLeads,
      totalTasks,
      totalUsers,
      tasksDueToday,
      overdueTasks,
      completedTasks,
      activeLeads,
      recentCustomers,
      recentTasks,
      leadPipeline,
    ] = await Promise.all([
      // Total counts
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.task.count(),
      prisma.user.count(),
      
      // Tasks due today
      prisma.task.count({
        where: {
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
          completed: false,
        },
      }),
      
      // Overdue tasks
      prisma.task.count({
        where: {
          dueDate: {
            lt: today,
          },
          completed: false,
        },
      }),
      
      // Completed tasks
      prisma.task.count({
        where: {
          completed: true,
        },
      }),
      
      // Active leads (leads with recent activity)
      prisma.lead.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      
      // Recent customers (last 5)
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      
      // Recent tasks (last 5)
      prisma.task.findMany({
        select: {
          id: true,
          title: true,
          dueDate: true,
          completed: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      
      // Lead pipeline by stage
      prisma.lead.groupBy({
        by: ['stageId'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Get stage names for lead pipeline
    const stageIds = leadPipeline.map(item => item.stageId);
    const stages = await prisma.leadStage.findMany({
      where: {
        id: {
          in: stageIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const leadPipelineWithNames = leadPipeline.map(item => {
      const stage = stages.find(s => s.id === item.stageId);
      return {
        stage: stage?.name || 'Unknown',
        count: item._count.id,
      };
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalLeads,
        totalTasks,
        totalUsers,
        tasksDueToday,
        overdueTasks,
        completedTasks,
        activeLeads,
        recentCustomers,
        recentTasks,
        leadPipeline: leadPipelineWithNames,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
});

// Get recent activity
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get recent activities from different tables
    const [recentCustomers, recentLeads, recentTasks] = await Promise.all([
      prisma.customer.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),
      
      prisma.lead.findMany({
        where: {
          customer: {
            ownerId: userId,
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          stage: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),
      
      prisma.task.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          title: true,
          completed: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),
    ]);

    // Combine and sort activities
    const activities = [
      ...recentCustomers.map(c => ({
        type: 'customer',
        id: c.id,
        title: `New customer: ${c.name}`,
        date: c.createdAt,
      })),
      ...recentLeads.map(l => ({
        type: 'lead',
        id: l.id,
        title: `New lead: ${l.customer.name} (${l.stage.name})`,
        date: l.createdAt,
      })),
      ...recentTasks.map(t => ({
        type: 'task',
        id: t.id,
        title: `New task: ${t.title}`,
        date: t.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
    });
  }
});

export default router; 