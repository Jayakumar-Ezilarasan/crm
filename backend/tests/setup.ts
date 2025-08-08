import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../src/index';
import { signAccessToken } from '../src/utils/jwt';

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-secret-refresh';

// Mock Prisma
jest.mock('../src/db', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    lead: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    leadStage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

// Mock JWT utilities
jest.mock('../src/utils/jwt', () => ({
  signAccessToken: jest.fn((payload) => {
    return `test-token-${JSON.stringify(payload)}`;
  }),
  signRefreshToken: jest.fn((payload) => {
    return `test-refresh-token-${JSON.stringify(payload)}`;
  }),
  verifyRefreshToken: jest.fn((token) => {
    if (token.startsWith('test-refresh-token-')) {
      const payloadStr = token.replace('test-refresh-token-', '');
      return JSON.parse(payloadStr);
    }
    throw new Error('Invalid refresh token');
  }),
}));

// Mock password utilities
jest.mock('../src/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    // For testing, we'll create a simple token-like string
    return `test-token-${JSON.stringify(payload)}`;
  }),
  verify: jest.fn((token, secret) => {
    // For testing, we'll parse the token and return the payload
    if (token.startsWith('test-token-')) {
      const payloadStr = token.replace('test-token-', '');
      return JSON.parse(payloadStr);
    }
    throw new Error('Invalid token');
  }),
}));

// Mock express-validator with proper middleware functions
jest.mock('express-validator', () => {
  const createValidationChain = () => {
    const chain = jest.fn((req: any, res: any, next: any) => {
      next();
    }) as any;
    
    chain.isEmail = jest.fn().mockReturnValue(chain);
    chain.isLength = jest.fn().mockReturnValue(chain);
    chain.notEmpty = jest.fn().mockReturnValue(chain);
    chain.isInt = jest.fn().mockReturnValue(chain);
    chain.isNumeric = jest.fn().mockReturnValue(chain);
    chain.isString = jest.fn().mockReturnValue(chain);
    chain.isISO8601 = jest.fn().mockReturnValue(chain);
    chain.isBoolean = jest.fn().mockReturnValue(chain);
    chain.isIn = jest.fn().mockReturnValue(chain);
    chain.optional = jest.fn().mockReturnValue(chain);
    chain.withMessage = jest.fn().mockReturnValue(chain);
    
    return chain;
  };
  
  return {
    body: jest.fn(() => createValidationChain()),
    param: jest.fn(() => createValidationChain()),
    validationResult: jest.fn(),
  };
});

// Mock rate limiter
jest.mock('../src/middlewares/security', () => ({
  apiLimiter: jest.fn((req: any, res: any, next: any) => next()),
}));

// Global test utilities
export const createTestUser = (role: string = 'user') => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role,
});

export const createTestToken = (user: any = createTestUser()) => {
  return signAccessToken(user);
};

// Import the mocked prisma
import prisma from '../src/db';

// Create a properly typed mock
const mockedPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  customer: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  lead: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  leadStage: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRawUnsafe: jest.fn(),
};

// Replace the imported prisma with our mock
Object.assign(prisma, mockedPrisma);

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset all mocked functions
  Object.values(mockedPrisma).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method: any) => {
        if (typeof method === 'function') {
          method.mockReset();
        }
      });
    }
  });
});

// Export test utilities
export { request, app, mockedPrisma }; 