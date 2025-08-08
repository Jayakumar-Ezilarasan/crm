import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { validationResult } from 'express-validator';
import { hashPassword } from '../../src/utils/password';

// Mock express-validator and password utilities
jest.mock('express-validator');
jest.mock('../../src/utils/password');

const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('Admin Routes', () => {
  const testUser = createTestUser('admin');
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/users', () => {
    it('should get all users successfully', async () => {
      const users = [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
          createdAt: new Date(),
        },
      ];

      mockedPrisma.user.findMany.mockResolvedValue(users as any);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(users);

      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/admin/users').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const regularUser = createTestUser('user');
      const regularToken = createTestToken(regularUser);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should get user by ID successfully', async () => {
      const userId = 1;
      const user = {
        id: userId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);

      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(user);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 999;

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /admin/users', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 3,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue(hashedPassword);
      mockedPrisma.user.create.mockResolvedValue(createdUser as any);

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${testToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdUser);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockedHashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should return 409 for existing email', async () => {
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user',
      };

      const existingUser = {
        id: 1,
        name: 'Existing User',
        email: userData.email,
        role: 'user',
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${testToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should return 400 for validation errors', async () => {
      const userData = {
        name: '',
        email: 'invalid-email',
        password: '123',
        role: 'invalid-role',
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
          { field: 'role', message: 'Invalid role' },
        ],
      } as any);

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${testToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveLength(4);
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should update user successfully', async () => {
      const userId = 1;
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
        role: 'admin',
      };

      const existingUser = {
        id: userId,
        name: 'Original User',
        email: 'original@example.com',
        role: 'user',
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);

      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser as any) // First call for existing user check
        .mockResolvedValueOnce(null); // Second call for email uniqueness check

      mockedPrisma.user.update.mockResolvedValue(updatedUser as any);

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedUser);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 999;
      const updateData = { name: 'Updated User' };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 409 for duplicate email', async () => {
      const userId = 1;
      const updateData = {
        name: 'Updated User',
        email: 'existing@example.com',
      };

      const existingUser = {
        id: userId,
        name: 'Original User',
        email: 'original@example.com',
        role: 'user',
      };

      const emailExistsUser = {
        id: 2,
        name: 'Other User',
        email: 'existing@example.com',
        role: 'user',
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);

      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser as any) // First call for existing user check
        .mockResolvedValueOnce(emailExistsUser as any); // Second call for email uniqueness check

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete user successfully', async () => {
      const userId = 2; // Different from current user
      const existingUser = {
        id: userId,
        name: 'User to Delete',
        email: 'delete@example.com',
        role: 'user',
      };

      mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);
      mockedPrisma.$transaction.mockResolvedValue([]);

      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedPrisma.$transaction).toHaveBeenCalledWith([
        mockedPrisma.customer.deleteMany({ where: { ownerId: userId } }),
        mockedPrisma.task.deleteMany({ where: { userId } }),
        mockedPrisma.contact.deleteMany({ where: { userId } }),
        mockedPrisma.user.delete({ where: { id: userId } }),
      ]);
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 999;

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      const userId = testUser.id; // Same as current user
      const existingUser = {
        id: userId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const response = await request(app)
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete your own account');
    });
  });

  describe('GET /admin/stats', () => {
    it('should get admin statistics successfully', async () => {
      const mockStats = {
        totalUsers: 10,
        totalCustomers: 50,
        totalLeads: 25,
        totalTasks: 100,
        activeUsers: 8,
      };

      mockedPrisma.user.count
        .mockResolvedValueOnce(mockStats.totalUsers)
        .mockResolvedValueOnce(mockStats.activeUsers);
      mockedPrisma.customer.count.mockResolvedValue(mockStats.totalCustomers);
      mockedPrisma.lead.count.mockResolvedValue(mockStats.totalLeads);
      mockedPrisma.task.count.mockResolvedValue(mockStats.totalTasks);

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);

      expect(mockedPrisma.user.count).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.customer.count).toHaveBeenCalled();
      expect(mockedPrisma.lead.count).toHaveBeenCalled();
      expect(mockedPrisma.task.count).toHaveBeenCalled();
    });
  });

  describe('GET /admin/reports', () => {
    it('should get user activity report successfully', async () => {
      const reportType = 'user-activity';
      const period = 'month';
      const mockReportData = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          role: 'user',
          _count: {
            customers: 5,
            tasks: 10,
          },
        },
      ];

      mockedPrisma.user.findMany.mockResolvedValue(mockReportData as any);

      const response = await request(app)
        .get(`/api/admin/reports?type=${reportType}&period=${period}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReportData);

      expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
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
    });

    it('should get lead pipeline report successfully', async () => {
      const reportType = 'lead-pipeline';
      const period = 'week';
      const mockReportData = [
        { stageId: 1, _count: { id: 10 } },
        { stageId: 2, _count: { id: 5 } },
      ];

      mockedPrisma.lead.groupBy.mockResolvedValue(mockReportData as any);

      const response = await request(app)
        .get(`/api/admin/reports?type=${reportType}&period=${period}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReportData);

      expect(mockedPrisma.lead.groupBy).toHaveBeenCalledWith({
        by: ['stageId'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });
    });

    it('should get task completion report successfully', async () => {
      const reportType = 'task-completion';
      const period = 'quarter';
      const mockReportData = [
        { completed: true, _count: { id: 75 } },
        { completed: false, _count: { id: 25 } },
      ];

      mockedPrisma.task.groupBy.mockResolvedValue(mockReportData as any);

      const response = await request(app)
        .get(`/api/admin/reports?type=${reportType}&period=${period}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReportData);

      expect(mockedPrisma.task.groupBy).toHaveBeenCalledWith({
        by: ['completed'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });
    });

    it('should return 400 for invalid report type', async () => {
      const reportType = 'invalid-type';

      const response = await request(app)
        .get(`/api/admin/reports?type=${reportType}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid report type');
    });
  });
});
