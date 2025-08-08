# 🏗️ CRM System Technical Architecture

This document provides a comprehensive overview of the CRM System's technical architecture, design patterns, and implementation details.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Performance Considerations](#performance-considerations)
8. [Scalability](#scalability)
9. [Monitoring & Observability](#monitoring--observability)
10. [Deployment Architecture](#deployment-architecture)

## 🌐 System Overview

The CRM System follows a modern, scalable architecture with clear separation of concerns and microservices principles.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser │ Mobile Browser │ Desktop App │ Third-party API  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (Vite) │ CDN (Cloudflare) │ Load Balancer (Nginx)   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Rate Limiting │ Authentication │ CORS │ Request Routing       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js API │ Business Logic │ Validation │ Error Handling │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Access Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Prisma ORM │ Database Migrations │ Query Optimization │ Caching│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL │ Redis Cache │ File Storage │ Backup Storage      │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Architecture Patterns

### 1. Layered Architecture

The system follows a clean layered architecture pattern:

```
┌─────────────────┐
│   Presentation  │ ← React Components, Pages, UI Logic
├─────────────────┤
│   Application   │ ← Business Logic, Services, Controllers
├─────────────────┤
│   Domain        │ ← Entities, Value Objects, Domain Services
├─────────────────┤
│ Infrastructure  │ ← Database, External Services, Utilities
└─────────────────┘
```

### 2. Repository Pattern

Data access is abstracted through repository interfaces:

```typescript
// Repository Interface
interface ICustomerRepository {
  findById(id: number): Promise<Customer | null>;
  findAll(filters: CustomerFilters): Promise<Customer[]>;
  create(customer: CreateCustomerDto): Promise<Customer>;
  update(id: number, customer: UpdateCustomerDto): Promise<Customer>;
  delete(id: number): Promise<void>;
}

// Implementation
class CustomerRepository implements ICustomerRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { owner: true, leads: true, interactions: true }
    });
  }
  
  // ... other methods
}
```

### 3. Service Layer Pattern

Business logic is encapsulated in service classes:

```typescript
class CustomerService {
  constructor(
    private customerRepo: ICustomerRepository,
    private userService: UserService,
    private auditService: AuditService
  ) {}
  
  async createCustomer(data: CreateCustomerDto, userId: number): Promise<Customer> {
    // Validate user permissions
    const user = await this.userService.findById(userId);
    if (!user || user.role === 'user') {
      throw new UnauthorizedError('Insufficient permissions');
    }
    
    // Create customer
    const customer = await this.customerRepo.create({
      ...data,
      ownerId: userId
    });
    
    // Audit log
    await this.auditService.log('customer_created', {
      userId,
      customerId: customer.id,
      changes: data
    });
    
    return customer;
  }
}
```

### 4. Middleware Pattern

Cross-cutting concerns are handled through middleware:

```typescript
// Authentication Middleware
const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as JwtPayload;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};

// Rate Limiting Middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## 🛠️ Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| TypeScript | 5.0.2 | Type Safety |
| Vite | 4.4.5 | Build Tool & Dev Server |
| Tailwind CSS | 3.3.3 | Styling |
| React Router | 6.11.2 | Client-side Routing |
| React Hook Form | 7.44.3 | Form Management |
| Axios | 1.4.0 | HTTP Client |
| Zustand | 4.4.1 | State Management |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime Environment |
| Express.js | 4.18.2 | Web Framework |
| TypeScript | 5.1.3 | Type Safety |
| Prisma | 5.0.0 | Database ORM |
| PostgreSQL | 15+ | Primary Database |
| Redis | 7+ | Caching & Sessions |
| JWT | 9.0.0 | Authentication |
| bcryptjs | 2.4.3 | Password Hashing |

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Vercel | Frontend Hosting |
| Render | Backend & Database Hosting |
| GitHub Actions | CI/CD Pipeline |
| Prometheus | Metrics Collection |
| Grafana | Monitoring Dashboard |
| Nginx | Reverse Proxy |

## 🧩 System Components

### Frontend Components

#### 1. Component Architecture

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── DataTable.tsx
│   ├── forms/                 # Form components
│   │   ├── CustomerForm.tsx
│   │   ├── LeadForm.tsx
│   │   └── TaskForm.tsx
│   └── layout/                # Layout components
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/                     # Page components
│   ├── Dashboard.tsx
│   ├── Customers.tsx
│   ├── Leads.tsx
│   └── Tasks.tsx
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   └── useOptimizedQueries.ts
├── services/                  # API service layer
│   ├── api.ts
│   ├── customerService.ts
│   └── authService.ts
└── contexts/                  # React contexts
    ├── AuthContext.tsx
    └── ThemeContext.tsx
```

#### 2. State Management

```typescript
// Zustand Store Example
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.accessToken);
    set({
      user: response.user,
      token: response.accessToken,
      isAuthenticated: true
    });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },
  
  updateUser: (user) => set({ user })
}));
```

### Backend Components

#### 1. Application Structure

```
src/
├── routes/                    # API route handlers
│   ├── auth.ts
│   ├── customers.ts
│   ├── leads.ts
│   └── tasks.ts
├── middlewares/               # Express middlewares
│   ├── auth.ts
│   ├── validation.ts
│   ├── rateLimit.ts
│   └── errorHandler.ts
├── services/                  # Business logic services
│   ├── CustomerService.ts
│   ├── LeadService.ts
│   └── TaskService.ts
├── repositories/              # Data access layer
│   ├── CustomerRepository.ts
│   ├── LeadRepository.ts
│   └── TaskRepository.ts
├── utils/                     # Utility functions
│   ├── jwt.ts
│   ├── validation.ts
│   └── helpers.ts
├── types/                     # TypeScript type definitions
│   ├── express.d.ts
│   ├── api.ts
│   └── models.ts
└── config/                    # Configuration files
    ├── database.ts
    ├── redis.ts
    └── app.ts
```

#### 2. Service Layer Implementation

```typescript
// Customer Service with Dependency Injection
class CustomerService {
  constructor(
    private customerRepo: ICustomerRepository,
    private userService: UserService,
    private cacheService: CacheService,
    private auditService: AuditService
  ) {}
  
  async getCustomers(filters: CustomerFilters, userId: number): Promise<PaginatedResult<Customer>> {
    // Check cache first
    const cacheKey = `customers:${JSON.stringify(filters)}:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Get user permissions
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    // Apply permission filters
    if (user.role === 'user') {
      filters.ownerId = userId;
    }
    
    // Fetch from database
    const result = await this.customerRepo.findAll(filters);
    
    // Cache result
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300); // 5 minutes
    
    return result;
  }
  
  async createCustomer(data: CreateCustomerDto, userId: number): Promise<Customer> {
    // Validate input
    await this.validateCustomerData(data);
    
    // Check permissions
    const user = await this.userService.findById(userId);
    if (!user || user.role === 'user') {
      throw new UnauthorizedError('Insufficient permissions');
    }
    
    // Create customer
    const customer = await this.customerRepo.create({
      ...data,
      ownerId: userId
    });
    
    // Invalidate cache
    await this.cacheService.del(`customers:*:${userId}`);
    
    // Audit log
    await this.auditService.log('customer_created', {
      userId,
      customerId: customer.id,
      changes: data
    });
    
    return customer;
  }
}
```

## 🔄 Data Flow

### 1. Request Flow

```
Client Request
     │
     ▼
┌─────────────┐
│   Nginx     │ ← Load balancing, SSL termination
└─────────────┘
     │
     ▼
┌─────────────┐
│ Rate Limiter│ ← Request throttling
└─────────────┘
     │
     ▼
┌─────────────┐
│ Auth Middleware│ ← JWT validation
└─────────────┘
     │
     ▼
┌─────────────┐
│ Route Handler│ ← Business logic
└─────────────┘
     │
     ▼
┌─────────────┐
│   Service   │ ← Domain logic
└─────────────┘
     │
     ▼
┌─────────────┐
│ Repository  │ ← Data access
└─────────────┘
     │
     ▼
┌─────────────┐
│  Database   │ ← PostgreSQL
└─────────────┘
```

### 2. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant D as Database
    participant R as Redis

    C->>A: POST /auth/login
    A->>D: Validate credentials
    D->>A: User data
    A->>A: Generate JWT tokens
    A->>R: Store refresh token
    A->>C: Return tokens

    C->>A: API request with JWT
    A->>A: Verify JWT signature
    A->>A: Check token expiration
    A->>C: API response

    C->>A: POST /auth/refresh
    A->>R: Validate refresh token
    R->>A: Token valid
    A->>A: Generate new access token
    A->>C: New access token
```

## 🔒 Security Architecture

### 1. Authentication & Authorization

#### JWT Token Structure
```typescript
interface JwtPayload {
  userId: number;
  email: string;
  role: 'user' | 'manager' | 'admin';
  iat: number; // issued at
  exp: number; // expiration
}

interface RefreshToken {
  tokenId: string;
  userId: number;
  expiresAt: Date;
  isRevoked: boolean;
}
```

#### Role-Based Access Control (RBAC)
```typescript
const permissions = {
  user: {
    customers: ['read:own', 'create', 'update:own'],
    leads: ['read:own', 'create', 'update:own'],
    tasks: ['read:own', 'create', 'update:own'],
    interactions: ['read:own', 'create']
  },
  manager: {
    customers: ['read:all', 'create', 'update:all'],
    leads: ['read:all', 'create', 'update:all'],
    tasks: ['read:all', 'create', 'update:all'],
    interactions: ['read:all', 'create'],
    users: ['read:team']
  },
  admin: {
    customers: ['read:all', 'create', 'update:all', 'delete'],
    leads: ['read:all', 'create', 'update:all', 'delete'],
    tasks: ['read:all', 'create', 'update:all', 'delete'],
    interactions: ['read:all', 'create', 'delete'],
    users: ['read:all', 'create', 'update:all', 'delete'],
    system: ['configure', 'monitor']
  }
};
```

### 2. Data Protection

#### Input Validation
```typescript
const customerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Valid phone number required'),
  body('company').optional().trim().isLength({ max: 200 }).withMessage('Company name too long'),
  body('industry').optional().isIn(['Technology', 'Healthcare', 'Finance', 'Retail', 'Other']),
  validationResult()
];
```

#### SQL Injection Prevention
- Prisma ORM with parameterized queries
- Input sanitization
- Database user with minimal permissions

#### XSS Prevention
- Content Security Policy (CSP) headers
- Input sanitization
- Output encoding
- React's built-in XSS protection

### 3. API Security

#### Rate Limiting
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});
```

#### CORS Configuration
```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining']
};
```

## ⚡ Performance Considerations

### 1. Database Optimization

#### Indexing Strategy
```sql
-- Primary indexes
CREATE INDEX idx_customers_owner_id ON customers(owner_id);
CREATE INDEX idx_leads_stage_id ON leads(stage_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);

-- Composite indexes for common queries
CREATE INDEX idx_customers_owner_status ON customers(owner_id, status);
CREATE INDEX idx_leads_owner_stage ON leads(owner_id, stage_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Full-text search indexes
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '')));
```

#### Query Optimization
```typescript
// Optimized customer query with pagination
async findAll(filters: CustomerFilters): Promise<PaginatedResult<Customer>> {
  const { page = 1, limit = 10, search, ownerId, status } = filters;
  const offset = (page - 1) * limit;
  
  const where: Prisma.CustomerWhereInput = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (ownerId) where.ownerId = ownerId;
  if (status) where.status = status;
  
  const [customers, total] = await Promise.all([
    this.prisma.customer.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true, interactions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    this.prisma.customer.count({ where })
  ]);
  
  return {
    data: customers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### 2. Caching Strategy

#### Redis Caching
```typescript
class CacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async del(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    const popularCustomers = await this.customerRepo.findPopular();
    await this.set('popular_customers', popularCustomers, 1800); // 30 minutes
  }
}
```

### 3. Frontend Performance

#### Code Splitting
```typescript
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Leads = lazy(() => import('./pages/Leads'));

// Route-based code splitting
const routes = [
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/customers',
    element: <Customers />
  },
  {
    path: '/leads',
    element: <Leads />
  }
];
```

#### Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          utils: ['axios', 'jwt-decode'],
          forms: ['react-hook-form', 'react-hook-form-resolvers']
        }
      }
    }
  }
});
```

## 📈 Scalability

### 1. Horizontal Scaling

#### Load Balancing
```nginx
# nginx.conf
upstream backend {
    least_conn;
    server backend1:3001 max_fails=3 fail_timeout=30s;
    server backend2:3001 max_fails=3 fail_timeout=30s;
    server backend3:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name yourcrm.com;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Database Scaling
```typescript
// Connection pooling configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling
  __internal: {
    engine: {
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 30000,
      queryTimeout: 30000
    }
  }
});
```

### 2. Vertical Scaling

#### Resource Optimization
```typescript
// Memory management
class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, any>();
  private maxSize = 1000;
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }
  
  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key: string): any {
    return this.cache.get(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

## 📊 Monitoring & Observability

### 1. Application Monitoring

#### Health Checks
```typescript
// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis health check
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### Performance Monitoring
```typescript
// Request timing middleware
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path, statusCode } = req;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${method} ${path} - ${duration}ms`);
    }
    
    // Send metrics to monitoring service
    metrics.histogram('http_request_duration', duration, {
      method,
      path,
      status_code: statusCode
    });
  });
  
  next();
};
```

### 2. Error Tracking

#### Error Handling
```typescript
// Global error handler
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: {
        url: req.url,
        method: req.method,
        userId: req.user?.id
      }
    });
  }
  
  if (error instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.details
      }
    });
  }
  
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    }
  });
};
```

## 🚀 Deployment Architecture

### 1. Containerization

#### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs
EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/crm
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=crm
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 2. CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy CRM System

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v1.0.0
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

*This technical architecture document is maintained by the development team. For questions or updates, contact the architecture team.*
