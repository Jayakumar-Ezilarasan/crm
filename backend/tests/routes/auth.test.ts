import request from 'supertest';
import app from '../../src/index';
import { mockedPrisma, createTestUser, createTestToken } from '../setup';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { validationResult } from 'express-validator';

// Mock JWT and password utilities
jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/password');
jest.mock('express-validator');

const mockedSignAccessToken = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
const mockedSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        email: userData.email,
        name: userData.name,
        role: 'user'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue(hashedPassword);
      mockedPrisma.user.create.mockResolvedValue(createdUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name
      });

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(mockedHashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: 'user'
        }
      });
    });

    it('should return 400 for validation errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        name: ''
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Password too short' },
          { field: 'name', message: 'Name is required' }
        ]
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveLength(3);
    });

    it('should return 409 for existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const existingUser = {
        id: 1,
        email: userData.email,
        name: 'Existing User'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
    const loginData = {
      email: 'test@example.com',
        password: 'password123'
    };

      const user = {
        id: 1,
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: 'hashedPassword123'
      };

      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-123';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(true);
      mockedSignAccessToken.mockReturnValue(accessToken);
      mockedSignRefreshToken.mockReturnValue(refreshToken);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        accessToken,
        refreshToken
      });

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(mockedComparePassword).toHaveBeenCalledWith(loginData.password, user.password);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const user = {
        id: 1,
        email: loginData.email,
        name: 'Test User',
        role: 'user',
        password: 'hashedPassword123'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      const logoutData = {
        refreshToken: 'refresh-token-123'
      };

      const response = await request(app)
        .post('/auth/logout')
        .send(logoutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out');
    });

    it('should logout without refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 401 for invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      mockedVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /auth/password/reset', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'newpassword123'
      };

      const tokenPayload = {
        id: 1
      };

      const hashedPassword = 'newHashedPassword123';

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      // Mock JWT verify to return a valid payload
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue(tokenPayload);

      mockedHashPassword.mockResolvedValue(hashedPassword);
      mockedPrisma.user.update.mockResolvedValue({ id: 1 } as any);

      const response = await request(app)
        .post('/auth/password/reset')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);

      expect(mockedHashPassword).toHaveBeenCalledWith(resetData.password);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: tokenPayload.id },
        data: { password: hashedPassword }
      });
    });

    it('should return 400 for invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        password: 'newpassword123'
      };

      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      } as any);

      // Mock JWT verify to throw an error
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/auth/password/reset')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
}); 