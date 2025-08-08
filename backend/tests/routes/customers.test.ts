import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator');
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Customer Routes', () => {
  const testUser = createTestUser();
  const testToken = createTestToken(testUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /customers', () => {
    it('should get all customers successfully', async () => {
      const customers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          company: 'ABC Corp',
          address: '123 Main St',
          ownerId: testUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email
          }
        }
      ];

      mockedPrisma.customer.findMany.mockResolvedValue(customers as any);

      const response = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(customers);

      expect(mockedPrisma.customer.findMany).toHaveBeenCalledWith({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/customers')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockedPrisma.customer.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch customers');
    });
  });

  describe('GET /customers/:id', () => {
    it('should get customer by ID successfully', async () => {
      const customerId = 1;
      const customer = {
        id: customerId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        company: 'ABC Corp',
        address: '123 Main St',
        ownerId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        }
      };

      mockedPrisma.customer.findFirst.mockResolvedValue(customer as any);

      const response = await request(app)
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(customer);

      expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: customerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 999;

      mockedPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });
  });

  describe('POST /customers', () => {
    it('should create customer successfully', async () => {
      const customerData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        company: 'XYZ Inc',
        address: '456 Oak Ave'
      };

      const createdCustomer = {
        id: 2,
        ...customerData,
        ownerId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.customer.create.mockResolvedValue(createdCustomer as any);

      const response = await request(app)
        .post('/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdCustomer);

      expect(mockedPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          ...customerData,
          ownerId: testUser.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return 400 for validation errors', async () => {
      const customerData = {
        name: '',
        email: 'invalid-email'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Invalid email format' }
        ]
      } as any);

      const response = await request(app)
        .post('/customers')
        .set('Authorization', `Bearer ${testToken}`)
        .send(customerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveLength(2);
    });
  });

  describe('PUT /customers/:id', () => {
    it('should update customer successfully', async () => {
      const customerId = 1;
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '5555555555'
      };

      const existingCustomer = {
        id: customerId,
        name: 'Original Name',
        email: 'original@example.com',
        ownerId: testUser.id
      };

      const updatedCustomer = {
        ...existingCustomer,
        ...updateData,
        owner: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email
        }
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.customer.findFirst.mockResolvedValue(existingCustomer as any);
      mockedPrisma.customer.update.mockResolvedValue(updatedCustomer as any);

      const response = await request(app)
        .put(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedCustomer);

      expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: customerId,
        },
      });
      expect(mockedPrisma.customer.update).toHaveBeenCalledWith({
        where: {
          id: customerId,
        },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 999;
      const updateData = { name: 'Updated Name' };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 403 for unauthorized update', async () => {
      const customerId = 1;
      const updateData = { name: 'Updated Name' };

      const existingCustomer = {
        id: customerId,
        name: 'Original Name',
        email: 'original@example.com',
        ownerId: 999 // Different owner
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.customer.findFirst.mockResolvedValue(existingCustomer as any);

      const response = await request(app)
        .put(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to update this customer');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should delete customer successfully', async () => {
      const customerId = 1;

      const existingCustomer = {
        id: customerId,
        name: 'John Doe',
        email: 'john@example.com',
        ownerId: testUser.id
      };

      mockedPrisma.customer.findFirst.mockResolvedValue(existingCustomer as any);
      mockedPrisma.customer.delete.mockResolvedValue(existingCustomer as any);

      const response = await request(app)
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer deleted successfully');

      expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: customerId,
        },
      });
      expect(mockedPrisma.customer.delete).toHaveBeenCalledWith({
        where: {
          id: customerId,
        },
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 999;

      mockedPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 403 for unauthorized deletion', async () => {
      const customerId = 1;

      const existingCustomer = {
        id: customerId,
        name: 'John Doe',
        email: 'john@example.com',
        ownerId: 999 // Different owner
      };

      mockedPrisma.customer.findFirst.mockResolvedValue(existingCustomer as any);

      const response = await request(app)
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authorized to delete this customer');
    });
  });
}); 