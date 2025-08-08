import { Router, Request, Response } from 'express';
import prisma from '../db';
import { body, validationResult } from 'express-validator';
import { apiLimiter } from '../middlewares/security';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { hashPassword } from '../utils/password';

const router = Router();

// Apply admin authorization to all routes
router.use(authenticateJWT, authorizeRoles('admin'));

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
          const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

// Create new user
router.post(
  '/users',
  apiLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array(),
        });
      }

      const { name, email, password, role } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
      });
    }
  }
);

// Update user
router.put(
  '/users/:id',
  apiLimiter,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, email, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email already registered',
          });
        }
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          name,
          email,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
      });
    }
  }
);

// Delete user
router.delete('/users/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    const currentUserId = (req as any).user.id;
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    // Delete user and all associated data
    await prisma.$transaction([
      // Delete user's customers
      prisma.customer.deleteMany({
        where: { ownerId: userId },
      }),
      // Delete user's tasks
      prisma.task.deleteMany({
        where: { userId },
      }),
      // Delete user's contacts
      prisma.contact.deleteMany({
        where: { userId },
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

// Get admin statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalLeads,
      totalTasks,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.task.count(),
      prisma.user.count({
        where: {
          // Consider users active if they have any activity in the last 30 days
          OR: [
            {
              customers: {
                some: {
                  updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
            {
              tasks: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          ],
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalLeads,
        totalTasks,
        activeUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics',
    });
  }
});

// Get detailed reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { type, period } = req.query;

    let startDate: Date;
    const endDate = new Date();

    // Set start date based on period
    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to month
    }

    let reportData: any = {};

    switch (type) {
      case 'user-activity':
        reportData = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            _count: {
              select: {
                customers: true,
                tasks: true,
              },
            },
          },
          orderBy: {
            customers: {
              _count: 'desc',
            },
          },
        });
        break;

      case 'lead-pipeline':
        reportData = await prisma.lead.groupBy({
          by: ['stageId'],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        break;

      case 'task-completion':
        reportData = await prisma.task.groupBy({
          by: ['completed'],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type',
        });
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
});

export default router; 