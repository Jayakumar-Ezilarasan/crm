import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator');
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Leads Routes', () => {
  const testUser = createTestUser();
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /leads', () => {
    it('should get all leads successfully', async () => {
      const leads = [
        {
          id: 1,
          customerId: 1,
          stageId: 1,
          value: 10000,
          source: 'Website',
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
          },
          stage: {
            id: 1,
            name: 'Qualified'
          }
        }
      ];

      mockedPrisma.lead.findMany.mockResolvedValue(leads as any);

      const response = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(leads);

      expect(mockedPrisma.lead.findMany).toHaveBeenCalledWith({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/leads')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.lead.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch leads');
    });
  });

  describe('GET /leads/:id', () => {
    it('should get lead by ID successfully', async () => {
      const leadId = 1;
      const lead = {
        id: leadId,
        customerId: 1,
        stageId: 1,
        value: 10000,
        source: 'Website',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        stage: {
          id: 1,
          name: 'Qualified'
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.findUnique.mockResolvedValue(lead as any);

      const response = await request(app)
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(lead);

      expect(mockedPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { id: leadId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should return 404 for non-existent lead', async () => {
      const leadId = 999;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Lead not found');
    });

    it('should return 400 for invalid ID parameter', async () => {
      const leadId = 'invalid';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .get(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /leads', () => {
    it('should create lead successfully', async () => {
      const leadData = {
        customerId: 1,
        stageId: 1,
        value: 15000,
        source: 'Referral'
      };

      const createdLead = {
        id: 2,
        ...leadData,
        value: parseFloat(leadData.value.toString()),
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        stage: {
          id: 1,
          name: 'Qualified'
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.create.mockResolvedValue(createdLead as any);

      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${testToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdLead);

      expect(mockedPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          customerId: leadData.customerId,
          stageId: leadData.stageId,
          value: parseFloat(leadData.value.toString()),
          source: leadData.source
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should create lead without optional fields', async () => {
      const leadData = {
        customerId: 1,
        stageId: 1
      };

      const createdLead = {
        id: 2,
        ...leadData,
        value: null,
        source: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        stage: {
          id: 1,
          name: 'Qualified'
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.create.mockResolvedValue(createdLead as any);

      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${testToken}`)
        .send(leadData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdLead);
    });

    it('should return 400 for validation errors', async () => {
      const leadData = {
        customerId: 'invalid',
        stageId: 'invalid'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { field: 'customerId', message: 'Invalid customer ID' },
          { field: 'stageId', message: 'Invalid stage ID' }
        ]
      } as any);

      const response = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${testToken}`)
        .send(leadData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveLength(2);
    });
  });

  describe('PUT /leads/:id', () => {
    it('should update lead successfully', async () => {
      const leadId = 1;
      const updateData = {
        stageId: 2,
        value: 20000,
        source: 'Cold Call'
      };

      const updatedLead = {
        id: leadId,
        customerId: 1,
        ...updateData,
        value: parseFloat(updateData.value.toString()),
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        stage: {
          id: 2,
          name: 'Proposal'
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.update.mockResolvedValue(updatedLead as any);

      const response = await request(app)
        .put(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedLead);

      expect(mockedPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          stageId: updateData.stageId,
          value: parseFloat(updateData.value.toString()),
          source: updateData.source
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const leadId = 'invalid';
      const updateData = { stageId: 2 };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .put(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should delete lead successfully', async () => {
      const leadId = 1;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.lead.delete.mockResolvedValue({ id: leadId } as any);

      const response = await request(app)
        .delete(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Lead deleted successfully');

      expect(mockedPrisma.lead.delete).toHaveBeenCalledWith({
        where: { id: leadId },
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const leadId = 'invalid';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .delete(`/leads/${leadId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 