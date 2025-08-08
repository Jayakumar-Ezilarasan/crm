import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateJWT } from '../middlewares/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// List tasks (optionally by user)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const where: any = {};
    if (user_id) where.userId = Number(user_id);
    
    const tasks = await prisma.task.findMany({
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
      orderBy: { dueDate: 'asc' },
      take: 100,
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
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
    });
    
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

// Create task
router.post(
  '/',
  authenticateJWT,
  body('userId').isInt(),
  body('customerId').isInt(),
  body('title').notEmpty(),
  body('dueDate').isISO8601(),
  body('leadId').optional().isInt(),
  body('description').optional().isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
      
      const { userId, customerId, leadId, title, description, dueDate } = req.body;
      const task = await prisma.task.create({
        data: { 
          userId, 
          customerId, 
          leadId, 
          title, 
          description, 
          dueDate: new Date(dueDate),
          completed: false,
        },
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
      });
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
    }
  }
);

// Update task
router.put(
  '/:id',
  authenticateJWT,
  param('id').isInt(),
  body('title').optional().notEmpty(),
  body('dueDate').optional().isISO8601(),
  body('completed').optional().isBoolean(),
  body('description').optional().isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
      
      const taskId = Number(req.params.id);
      const userId = (req as any).user['id'];
      const userRole = (req as any).user['role'];
      
      // Check if task exists and get current task
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { user: true }
      });
      
      if (!existingTask) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
      
      // Authorization: User can edit their own tasks, managers/admins can edit any task
      const canEditOwn = existingTask.userId === userId;
      const canEditAll = userRole === 'manager' || userRole === 'admin';
      
      if (!canEditOwn && !canEditAll) {
        return res.status(403).json({ success: false, error: 'You do not have permission to modify this task' });
      }
      
      const { title, dueDate, completed, description } = req.body;
      const updateData: any = { title, completed, description };
      if (dueDate) updateData.dueDate = new Date(dueDate);
      
      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
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
      });
      res.json({ success: true, data: task });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, error: 'Failed to update task' });
    }
  }
);

// Toggle task completion
router.patch(
  '/:id',
  authenticateJWT,
  param('id').isInt(),
  body('completed').isBoolean(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
      
      const { completed } = req.body;
      const taskId = Number(req.params.id);
      const userId = (req as any).user['id'];
      const userRole = (req as any).user['role'];
      
      // Check if task exists and get current task
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { user: true }
      });
      
      if (!existingTask) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
      
      // Authorization: User can toggle their own tasks, managers/admins can toggle any task
      const canEditOwn = existingTask.userId === userId;
      const canEditAll = userRole === 'manager' || userRole === 'admin';
      
      if (!canEditOwn && !canEditAll) {
        return res.status(403).json({ success: false, error: 'You do not have permission to modify this task' });
      }
      
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { completed },
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
      });
      res.json({ success: true, data: task });
    } catch (error) {
      console.error('Error updating task completion:', error);
      res.status(500).json({ success: false, error: 'Failed to update task completion' });
    }
  }
);

// Delete task
router.delete('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    
    const taskId = Number(req.params.id);
    const userId = (req as any).user['id'];
    const userRole = (req as any).user['role'];
    
    // Check if task exists and get current task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true }
    });
    
    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Authorization: User can delete their own tasks, managers/admins can delete any task
    const canDeleteOwn = existingTask.userId === userId;
    const canDeleteAll = userRole === 'manager' || userRole === 'admin';
    
    if (!canDeleteOwn && !canDeleteAll) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this task' });
    }
    
    await prisma.task.delete({
      where: { id: taskId },
    });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

export default router; 