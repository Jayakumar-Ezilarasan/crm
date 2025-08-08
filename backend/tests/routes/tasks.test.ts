import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator');
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Tasks Routes', () => {
  const testUser = createTestUser();
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    it('should get all tasks successfully', async () => {
      const tasks = [
        {
          id: 1,
          userId: testUser.id,
          customerId: 1,
          leadId: 1,
          title: 'Follow up call',
          description: 'Call customer about proposal',
          dueDate: new Date('2024-01-15'),
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email
          },
          customer: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
          },
          lead: {
            id: 1,
            stage: {
              name: 'Qualified'
            }
          }
        }
      ];

      mockedPrisma.task.findMany.mockResolvedValue(tasks as any);

      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(tasks);

      expect(mockedPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
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
    });

    it('should filter tasks by user_id', async () => {
      const userId = 2;
      const tasks = [];

      mockedPrisma.task.findMany.mockResolvedValue(tasks as any);

      const response = await request(app)
        .get(`/tasks?user_id=${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(tasks);

      expect(mockedPrisma.task.findMany).toHaveBeenCalledWith({
        where: { userId },
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
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get task by ID successfully', async () => {
      const taskId = 1;
      const task = {
        id: taskId,
        userId: testUser.id,
        customerId: 1,
        leadId: 1,
        title: 'Follow up call',
        description: 'Call customer about proposal',
        dueDate: new Date('2024-01-15'),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        },
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        lead: {
          id: 1,
          stage: {
            name: 'Qualified'
          }
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.findUnique.mockResolvedValue(task as any);

      const response = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(task);

      expect(mockedPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
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
    });

    it('should return 404 for non-existent task', async () => {
      const taskId = 999;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /tasks', () => {
    it('should create task successfully', async () => {
      const taskData = {
        userId: testUser.id,
        customerId: 1,
        leadId: 1,
        title: 'New task',
        description: 'Task description',
        dueDate: '2024-01-15T10:00:00Z'
      };

      const createdTask = {
        id: 2,
        ...taskData,
        dueDate: new Date(taskData.dueDate),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        },
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        lead: {
          id: 1,
          stage: {
            name: 'Qualified'
          }
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.create.mockResolvedValue(createdTask as any);

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdTask);

      expect(mockedPrisma.task.create).toHaveBeenCalledWith({
        data: {
          userId: taskData.userId,
          customerId: taskData.customerId,
          leadId: taskData.leadId,
          title: taskData.title,
          description: taskData.description,
          dueDate: new Date(taskData.dueDate),
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
    });

    it('should create task without optional fields', async () => {
      const taskData = {
        userId: testUser.id,
        customerId: 1,
        title: 'New task',
        dueDate: '2024-01-15T10:00:00Z'
      };

      const createdTask = {
        id: 2,
        ...taskData,
        leadId: null,
        description: null,
        dueDate: new Date(taskData.dueDate),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        },
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        lead: null
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.create.mockResolvedValue(createdTask as any);

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${testToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdTask);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update task successfully', async () => {
      const taskId = 1;
      const updateData = {
        title: 'Updated task',
        description: 'Updated description',
        dueDate: '2024-01-20T10:00:00Z',
        completed: true
      };

      const updatedTask = {
        id: taskId,
        userId: testUser.id,
        customerId: 1,
        leadId: 1,
        ...updateData,
        dueDate: new Date(updateData.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        },
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        lead: {
          id: 1,
          stage: {
            name: 'Qualified'
          }
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.update.mockResolvedValue(updatedTask as any);

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedTask);

      expect(mockedPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: {
          title: updateData.title,
          description: updateData.description,
          dueDate: new Date(updateData.dueDate),
          completed: updateData.completed,
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
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should toggle task completion successfully', async () => {
      const taskId = 1;
      const patchData = {
        completed: true
      };

      const updatedTask = {
        id: taskId,
        userId: testUser.id,
        customerId: 1,
        leadId: 1,
        title: 'Follow up call',
        description: 'Call customer about proposal',
        dueDate: new Date('2024-01-15'),
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        },
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        lead: {
          id: 1,
          stage: {
            name: 'Qualified'
          }
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.update.mockResolvedValue(updatedTask as any);

      const response = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedTask);

      expect(mockedPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { completed: patchData.completed },
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
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task successfully', async () => {
      const taskId = 1;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.task.delete.mockResolvedValue({ id: taskId } as any);

      const response = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      expect(mockedPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });
  });
}); 