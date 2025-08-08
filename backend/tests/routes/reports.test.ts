import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';

describe('Reports Routes', () => {
  const testUser = createTestUser('admin');
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /reports/customer-acquisition', () => {
    it('should get customer acquisition report successfully for admin', async () => {
      const mockData = [
        {
          month: '2024-01-01T00:00:00.000Z',
          count: 15
        },
        {
          month: '2023-12-01T00:00:00.000Z',
          count: 12
        }
      ];

      mockedPrisma.$queryRawUnsafe.mockResolvedValue(mockData as any);

      const response = await request(app)
        .get('/reports/customer-acquisition')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);

      expect(mockedPrisma.$queryRawUnsafe).toHaveBeenCalledWith(`
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
    FROM customers
    WHERE deleted_at IS NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
    });

    it('should get customer acquisition report successfully for manager', async () => {
      const managerUser = createTestUser('manager');
      const managerToken = createTestToken(managerUser);

      const mockData = [
        {
          month: '2024-01-01T00:00:00.000Z',
          count: 10
        }
      ];

      mockedPrisma.$queryRawUnsafe.mockResolvedValue(mockData as any);

      const response = await request(app)
        .get('/reports/customer-acquisition')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/reports/customer-acquisition')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for regular user', async () => {
      const regularUser = createTestUser('user');
      const regularToken = createTestToken(regularUser);

      const response = await request(app)
        .get('/reports/customer-acquisition')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/customer-acquisition')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /reports/sales-conversion', () => {
    it('should get sales conversion report successfully for admin', async () => {
      const mockData = [
        {
          stage: 'Qualified',
          count: 25
        },
        {
          stage: 'Proposal',
          count: 15
        },
        {
          stage: 'Closed Won',
          count: 8
        }
      ];

      mockedPrisma.$queryRawUnsafe.mockResolvedValue(mockData as any);

      const response = await request(app)
        .get('/reports/sales-conversion')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);

      expect(mockedPrisma.$queryRawUnsafe).toHaveBeenCalledWith(`
    SELECT stage, COUNT(*) AS count
    FROM leads
    WHERE deleted_at IS NULL
    GROUP BY stage
    ORDER BY count DESC
  `);
    });

    it('should get sales conversion report successfully for manager', async () => {
      const managerUser = createTestUser('manager');
      const managerToken = createTestToken(managerUser);

      const mockData = [
        {
          stage: 'Qualified',
          count: 20
        },
        {
          stage: 'Proposal',
          count: 10
        }
      ];

      mockedPrisma.$queryRawUnsafe.mockResolvedValue(mockData as any);

      const response = await request(app)
        .get('/reports/sales-conversion')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/reports/sales-conversion')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for regular user', async () => {
      const regularUser = createTestUser('user');
      const regularToken = createTestToken(regularUser);

      const response = await request(app)
        .get('/reports/sales-conversion')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/reports/sales-conversion')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
}); 