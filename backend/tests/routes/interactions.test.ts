import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator');
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Interactions Routes', () => {
  const testUser = createTestUser();
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /interactions', () => {
    it('should get all interactions successfully', async () => {
      const interactions = [
        {
          id: 1,
          customerId: 1,
          userId: testUser.id,
          type: 'call',
          summary: 'Follow up call with customer',
          contactDate: new Date('2024-01-15'),
          createdAt: new Date(),
        }
      ];

      mockedPrisma.contact.findMany.mockResolvedValue(interactions as any);

      const response = await request(app)
        .get('/interactions')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(interactions);

      expect(mockedPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { contactDate: 'desc' },
        take: 100,
      });
    });

    it('should filter interactions by customer_id', async () => {
      const customerId = 1;
      const interactions = [];

      mockedPrisma.contact.findMany.mockResolvedValue(interactions as any);

      const response = await request(app)
        .get(`/interactions?customer_id=${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(interactions);

      expect(mockedPrisma.contact.findMany).toHaveBeenCalledWith({
        where: { 
          customerId: customerId
        },
        orderBy: { contactDate: 'desc' },
        take: 100,
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/interactions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /interactions/:id', () => {
    it('should get interaction by ID successfully', async () => {
      const interactionId = 1;
      const interaction = {
        id: interactionId,
        customerId: 1,
        userId: testUser.id,
        type: 'call',
        summary: 'Follow up call with customer',
        contactDate: new Date('2024-01-15'),
        createdAt: new Date(),
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.findUnique.mockResolvedValue(interaction as any);

      const response = await request(app)
        .get(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(interaction);

      expect(mockedPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { 
          id: interactionId
        },
      });
    });

    it('should return 404 for non-existent interaction', async () => {
      const interactionId = 999;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not found');
    });

    it('should return 400 for invalid ID parameter', async () => {
      const interactionId = 'invalid';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .get(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /interactions', () => {
    it('should create interaction successfully', async () => {
      const interactionData = {
        customerId: 1,
        type: 'meeting',
        summary: 'Product demonstration meeting',
        contactDate: '2024-01-15T10:00:00Z'
      };

      const createdInteraction = {
        id: 2,
        ...interactionData,
        userId: testUser.id,
        contactDate: new Date(interactionData.contactDate),
        createdAt: new Date(),
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.create.mockResolvedValue(createdInteraction as any);

      const response = await request(app)
        .post('/interactions')
        .set('Authorization', `Bearer ${testToken}`)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdInteraction);

      expect(mockedPrisma.contact.create).toHaveBeenCalledWith({
        data: {
          customerId: interactionData.customerId,
          userId: testUser.id,
          type: interactionData.type,
          summary: interactionData.summary,
          contactDate: new Date(interactionData.contactDate),
        },
      });
    });

    it('should create interaction without optional summary', async () => {
      const interactionData = {
        customerId: 1,
        type: 'call',
        contactDate: '2024-01-15T10:00:00Z'
      };

      const createdInteraction = {
        id: 2,
        ...interactionData,
        summary: null,
        userId: testUser.id,
        contactDate: new Date(interactionData.contactDate),
        createdAt: new Date(),
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.create.mockResolvedValue(createdInteraction as any);

      const response = await request(app)
        .post('/interactions')
        .set('Authorization', `Bearer ${testToken}`)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdInteraction);
    });

    it('should return 400 for validation errors', async () => {
      const interactionData = {
        customerId: 'invalid',
        type: '',
        contactDate: 'invalid-date'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { field: 'customerId', message: 'Invalid customer ID' },
          { field: 'type', message: 'Type is required' },
          { field: 'contactDate', message: 'Invalid date format' }
        ]
      } as any);

      const response = await request(app)
        .post('/interactions')
        .set('Authorization', `Bearer ${testToken}`)
        .send(interactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveLength(3);
    });
  });

  describe('PUT /interactions/:id', () => {
    it('should update interaction successfully', async () => {
      const interactionId = 1;
      const updateData = {
        type: 'email',
        summary: 'Updated summary',
        contactDate: '2024-01-16T10:00:00Z'
      };

      const updatedInteraction = {
        id: interactionId,
        customerId: 1,
        userId: testUser.id,
        ...updateData,
        contactDate: new Date(updateData.contactDate),
        createdAt: new Date(),
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.update.mockResolvedValue(updatedInteraction as any);

      const response = await request(app)
        .put(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedInteraction);

      expect(mockedPrisma.contact.update).toHaveBeenCalledWith({
        where: { 
          id: interactionId
        },
        data: {
          type: updateData.type,
          summary: updateData.summary,
          contactDate: new Date(updateData.contactDate),
        },
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const interactionId = 'invalid';
      const updateData = { type: 'email' };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .put(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /interactions/:id', () => {
    it('should delete interaction successfully', async () => {
      const interactionId = 1;

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.contact.delete.mockResolvedValue({ id: interactionId } as any);

      const response = await request(app)
        .delete(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      expect(mockedPrisma.contact.delete).toHaveBeenCalledWith({
        where: { 
          id: interactionId
        },
      });
    });

    it('should return 400 for invalid ID parameter', async () => {
      const interactionId = 'invalid';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid ID' }]
      } as any);

      const response = await request(app)
        .delete(`/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 