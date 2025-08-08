import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';

describe('Users Routes', () => {
  const testUser = createTestUser('admin');
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should get all users successfully for admin', async () => {
      const users = [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        {
          id: 2,
          name: 'Manager User',
          email: 'manager@example.com',
          role: 'manager'
        },
        {
          id: 3,
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user'
        }
      ];

      mockedPrisma.user.findMany.mockResolvedValue(users as any);

      const response = await request(app)
        .get('/users')
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
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should get all users successfully for manager', async () => {
      const managerUser = createTestUser('manager');
      const managerToken = createTestToken(managerUser);

      const users = [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        {
          id: 2,
          name: 'Manager User',
          email: 'manager@example.com',
          role: 'manager'
        }
      ];

      mockedPrisma.user.findMany.mockResolvedValue(users as any);

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(users);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for regular user', async () => {
      const regularUser = createTestUser('user');
      const regularToken = createTestToken(regularUser);

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch users');
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by ID successfully for admin', async () => {
      const userId = 1;
      const user = {
        id: userId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);

      const response = await request(app)
        .get(`/users/${userId}`)
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
        },
      });
    });

    it('should get user by ID successfully for manager', async () => {
      const managerUser = createTestUser('manager');
      const managerToken = createTestToken(managerUser);
      const userId = 1;
      const user = {
        id: userId,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user'
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(user);
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 999;

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 401 without authentication', async () => {
      const userId = 1;

      const response = await request(app)
        .get(`/users/${userId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for regular user', async () => {
      const regularUser = createTestUser('user');
      const regularToken = createTestToken(regularUser);
      const userId = 1;

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      const userId = 1;

      mockedPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch user');
    });
  });
}); 