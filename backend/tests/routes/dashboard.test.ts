import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';

describe('Dashboard Routes', () => {
  const testUser = createTestUser();
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dashboard/stats', () => {
    it('should get dashboard statistics successfully', async () => {
      const mockStats = {
        totalCustomers: 50,
        totalLeads: 25,
        totalTasks: 100,
        totalUsers: 10,
        tasksDueToday: 5,
        overdueTasks: 3,
        completedTasks: 75,
        activeLeads: 20,
        recentCustomers: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: new Date()
          }
        ],
        recentTasks: [
          {
            id: 1,
            title: 'Follow up call',
            dueDate: new Date(),
            completed: false,
            customer: {
              name: 'John Doe'
            }
          }
        ],
        leadPipeline: [
          {
            stage: 'Qualified',
            count: 10
          },
          {
            stage: 'Proposal',
            count: 5
          }
        ]
      };

      // Mock all the Prisma calls
      mockedPrisma.customer.count.mockResolvedValue(mockStats.totalCustomers);
      mockedPrisma.lead.count.mockResolvedValue(mockStats.totalLeads);
      mockedPrisma.task.count.mockResolvedValue(mockStats.totalTasks);
      mockedPrisma.user.count.mockResolvedValue(mockStats.totalUsers);
      
      // Mock task counts with different where clauses
      mockedPrisma.task.count
        .mockResolvedValueOnce(mockStats.tasksDueToday) // tasksDueToday
        .mockResolvedValueOnce(mockStats.overdueTasks) // overdueTasks
        .mockResolvedValueOnce(mockStats.completedTasks); // completedTasks

      mockedPrisma.lead.count.mockResolvedValue(mockStats.activeLeads);
      mockedPrisma.customer.findMany.mockResolvedValue(mockStats.recentCustomers as any);
      mockedPrisma.task.findMany.mockResolvedValue(mockStats.recentTasks as any);
      
      const mockLeadPipeline = [
        { stageId: 1, _count: { id: 10 } },
        { stageId: 2, _count: { id: 5 } }
      ];
      mockedPrisma.lead.groupBy.mockResolvedValue(mockLeadPipeline as any);
      
      const mockStages = [
        { id: 1, name: 'Qualified' },
        { id: 2, name: 'Proposal' }
      ];
      mockedPrisma.leadStage.findMany.mockResolvedValue(mockStages as any);

      const response = await request(app)
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);

      // Verify Prisma calls
      expect(mockedPrisma.customer.count).toHaveBeenCalled();
      expect(mockedPrisma.lead.count).toHaveBeenCalled();
      expect(mockedPrisma.task.count).toHaveBeenCalled();
      expect(mockedPrisma.user.count).toHaveBeenCalled();
      expect(mockedPrisma.lead.groupBy).toHaveBeenCalledWith({
        by: ['stageId'],
        _count: {
          id: true,
        },
      });
      expect(mockedPrisma.leadStage.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/dashboard/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.customer.count.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch dashboard statistics');
    });
  });

  describe('GET /dashboard/activity', () => {
    it('should get recent activity successfully', async () => {
      const mockRecentCustomers = [
        {
          id: 1,
          name: 'John Doe',
          createdAt: new Date('2024-01-15')
        }
      ];

      const mockRecentLeads = [
        {
          id: 1,
          customer: {
            name: 'Jane Smith'
          },
          stage: {
            name: 'Qualified'
          },
          createdAt: new Date('2024-01-14')
        }
      ];

      const mockRecentTasks = [
        {
          id: 1,
          title: 'Follow up call',
          completed: false,
          createdAt: new Date('2024-01-13')
        }
      ];

      const expectedActivities = [
        {
          type: 'customer',
          id: 1,
          title: 'New customer: John Doe',
          date: new Date('2024-01-15')
        },
        {
          type: 'lead',
          id: 1,
          title: 'New lead: Jane Smith (Qualified)',
          date: new Date('2024-01-14')
        },
        {
          type: 'task',
          id: 1,
          title: 'New task: Follow up call',
          date: new Date('2024-01-13')
        }
      ];

      mockedPrisma.customer.findMany.mockResolvedValue(mockRecentCustomers as any);
      mockedPrisma.lead.findMany.mockResolvedValue(mockRecentLeads as any);
      mockedPrisma.task.findMany.mockResolvedValue(mockRecentTasks as any);

      const response = await request(app)
        .get('/dashboard/activity')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      // Check that activities are sorted by date (newest first)
      expect(response.body.data[0].type).toBe('customer');
      expect(response.body.data[1].type).toBe('lead');
      expect(response.body.data[2].type).toBe('task');

      // Verify Prisma calls
      expect(mockedPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: testUser.id,
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
      });

      expect(mockedPrisma.lead.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: testUser.id,
        },
        select: {
          id: true,
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
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

      expect(mockedPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: testUser.id,
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
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/dashboard/activity')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.customer.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/dashboard/activity')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch recent activity');
    });

    it('should limit activities to 10 items', async () => {
      // Create more than 10 activities to test the limit
      const mockRecentCustomers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Customer ${i + 1}`,
        createdAt: new Date(`2024-01-${15 - i}`)
      }));

      const mockRecentLeads = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        customer: { name: `Customer ${i + 1}` },
        stage: { name: 'Qualified' },
        createdAt: new Date(`2024-01-${14 - i}`)
      }));

      const mockRecentTasks = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        completed: false,
        createdAt: new Date(`2024-01-${13 - i}`)
      }));

      mockedPrisma.customer.findMany.mockResolvedValue(mockRecentCustomers as any);
      mockedPrisma.lead.findMany.mockResolvedValue(mockRecentLeads as any);
      mockedPrisma.task.findMany.mockResolvedValue(mockRecentTasks as any);

      const response = await request(app)
        .get('/dashboard/activity')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10); // Should be limited to 10
    });
  });
}); 