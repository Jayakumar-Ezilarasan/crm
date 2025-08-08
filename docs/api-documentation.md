# 🔌 CRM System API Documentation

Complete API reference for the CRM System backend. This documentation covers all endpoints, request/response formats, authentication, and usage examples.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Headers](#base-url--headers)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
6. [Data Models](#data-models)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

## 🌐 Overview

The CRM System API is a RESTful API built with Node.js and Express. It provides endpoints for managing customers, leads, tasks, users, and interactions.

- **Base URL**: `https://your-backend-service.onrender.com`
- **API Version**: v1
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer Token

## 🔐 Authentication

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

#### Login to Get Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Using the Token

Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Refresh Token

When the access token expires, use the refresh token to get a new one:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🌍 Base URL & Headers

### Base URL
```
https://your-backend-service.onrender.com
```

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

### Optional Headers
```http
Accept: application/json
X-Request-ID: <unique-request-id>
```

## ⚠️ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request data validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_ENTRY` | Resource already exists |

## 🔗 Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:**
```http
Authorization: Bearer <access-token>
```

### Customer Endpoints

#### GET /api/customers
Get list of customers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search by name, email, or company
- `industry` (string): Filter by industry
- `status` (string): Filter by status (active/inactive)
- `ownerId` (number): Filter by owner ID

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "phone": "+1-555-0123",
        "company": "Acme Corporation",
        "industry": "Technology",
        "website": "https://acme.com",
        "address": "123 Business St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001",
        "ownerId": 1,
        "status": "active",
        "createdAt": "2023-12-01T10:00:00Z",
        "updatedAt": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### POST /api/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "New Customer",
  "email": "contact@newcustomer.com",
  "phone": "+1-555-0124",
  "company": "New Customer Inc",
  "industry": "Healthcare",
  "website": "https://newcustomer.com",
  "address": "456 Customer Ave",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "postalCode": "90210",
  "notes": "Potential high-value customer"
}
```

#### GET /api/customers/:id
Get customer by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "phone": "+1-555-0123",
      "company": "Acme Corporation",
      "industry": "Technology",
      "website": "https://acme.com",
      "address": "123 Business St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001",
      "ownerId": 1,
      "status": "active",
      "notes": "Key account",
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-01T10:00:00Z",
      "owner": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "leads": [
        {
          "id": 1,
          "title": "Software License Renewal",
          "amount": 50000,
          "stage": "Proposal"
        }
      ],
      "interactions": [
        {
          "id": 1,
          "type": "call",
          "subject": "Initial Contact",
          "description": "Discussed software requirements",
          "interactionDate": "2023-12-01T14:00:00Z"
        }
      ]
    }
  }
}
```

#### PUT /api/customers/:id
Update customer information.

**Request Body:**
```json
{
  "name": "Updated Customer Name",
  "email": "updated@customer.com",
  "phone": "+1-555-0125"
}
```

#### DELETE /api/customers/:id
Delete customer (Admin only).

### Lead Endpoints

#### GET /api/leads
Get list of leads with filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `stage` (string): Filter by stage
- `ownerId` (number): Filter by owner
- `customerId` (number): Filter by customer
- `minAmount` (number): Minimum amount
- `maxAmount` (number): Maximum amount

#### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "title": "Software Implementation Project",
  "description": "Enterprise software implementation for new client",
  "amount": 100000,
  "currency": "USD",
  "customerId": 1,
  "stageId": 1,
  "source": "Website",
  "probability": 75,
  "expectedCloseDate": "2024-03-01"
}
```

#### GET /api/leads/:id
Get lead by ID.

#### PUT /api/leads/:id
Update lead information.

#### DELETE /api/leads/:id
Delete lead.

### Task Endpoints

#### GET /api/tasks
Get list of tasks.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `userId` (number): Filter by assigned user
- `dueDate` (string): Filter by due date (YYYY-MM-DD)

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Follow up with client",
  "description": "Call client to discuss proposal",
  "dueDate": "2023-12-15T14:00:00Z",
  "priority": "high",
  "status": "pending",
  "customerId": 1,
  "leadId": 1
}
```

#### GET /api/tasks/:id
Get task by ID.

#### PUT /api/tasks/:id
Update task.

#### PATCH /api/tasks/:id/status
Update task status.

**Request Body:**
```json
{
  "status": "completed"
}
```

#### DELETE /api/tasks/:id
Delete task.

### Interaction Endpoints

#### GET /api/interactions
Get list of interactions.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by type (call/email/meeting/note)
- `customerId` (number): Filter by customer
- `userId` (number): Filter by user

#### POST /api/interactions
Create a new interaction.

**Request Body:**
```json
{
  "type": "call",
  "subject": "Product Demo",
  "description": "Demonstrated new features to client",
  "customerId": 1,
  "leadId": 1,
  "interactionDate": "2023-12-01T15:00:00Z",
  "durationMinutes": 30,
  "outcome": "Client interested in premium plan",
  "followUpDate": "2023-12-08"
}
```

#### GET /api/interactions/:id
Get interaction by ID.

#### PUT /api/interactions/:id
Update interaction.

#### DELETE /api/interactions/:id
Delete interaction.

### Dashboard Endpoints

#### GET /api/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "activeLeads": 25,
    "pendingTasks": 12,
    "monthlyRevenue": 75000,
    "conversionRate": 15.5,
    "recentActivity": [
      {
        "id": 1,
        "type": "customer_created",
        "description": "New customer Acme Corp added",
        "timestamp": "2023-12-01T16:00:00Z"
      }
    ]
  }
}
```

#### GET /api/dashboard/leads-pipeline
Get lead pipeline data.

**Response:**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "id": 1,
        "name": "New",
        "count": 5,
        "value": 250000
      },
      {
        "id": 2,
        "name": "Contacted",
        "count": 8,
        "value": 400000
      }
    ]
  }
}
```

### User Management Endpoints (Admin Only)

#### GET /api/users
Get list of users.

#### POST /api/users
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "manager"
}
```

#### GET /api/users/:id
Get user by ID.

#### PUT /api/users/:id
Update user.

#### DELETE /api/users/:id
Delete user.

## 📊 Data Models

### User Model
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'manager' | 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Customer Model
```typescript
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerId: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lead Model
```typescript
interface Lead {
  id: number;
  title: string;
  description?: string;
  amount?: number;
  currency: string;
  customerId: number;
  stageId: number;
  ownerId?: number;
  source?: string;
  probability?: number;
  expectedCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Model
```typescript
interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  userId: number;
  customerId?: number;
  leadId?: number;
  assignedTo?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Interaction Model
```typescript
interface Interaction {
  id: number;
  type: 'call' | 'email' | 'meeting' | 'note';
  subject?: string;
  description?: string;
  customerId: number;
  leadId?: number;
  userId: number;
  interactionDate: Date;
  durationMinutes?: number;
  outcome?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚦 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per minute per user
- **Bulk operations**: 10 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 💡 Examples

### Complete Customer Workflow

#### 1. Create Customer
```bash
curl -X POST https://your-backend-service.onrender.com/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Solutions Inc",
    "email": "contact@techsolutions.com",
    "phone": "+1-555-0126",
    "company": "Tech Solutions Inc",
    "industry": "Technology",
    "website": "https://techsolutions.com"
  }'
```

#### 2. Create Lead for Customer
```bash
curl -X POST https://your-backend-service.onrender.com/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Development Project",
    "description": "Custom software development for inventory management",
    "amount": 75000,
    "customerId": 1,
    "stageId": 1,
    "source": "Referral",
    "probability": 80,
    "expectedCloseDate": "2024-02-15"
  }'
```

#### 3. Create Task
```bash
curl -X POST https://your-backend-service.onrender.com/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prepare Proposal",
    "description": "Create detailed proposal for Tech Solutions project",
    "dueDate": "2023-12-10T17:00:00Z",
    "priority": "high",
    "customerId": 1,
    "leadId": 1
  }'
```

#### 4. Log Interaction
```bash
curl -X POST https://your-backend-service.onrender.com/api/interactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "meeting",
    "subject": "Requirements Gathering",
    "description": "Met with client to understand project requirements",
    "customerId": 1,
    "leadId": 1,
    "interactionDate": "2023-12-01T14:00:00Z",
    "durationMinutes": 60,
    "outcome": "Requirements documented, moving to proposal stage"
  }'
```

### JavaScript/Node.js Examples

#### Using Fetch API
```javascript
const API_BASE = 'https://your-backend-service.onrender.com';

// Login
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data.data.accessToken;
}

// Get customers
async function getCustomers(token, page = 1) {
  const response = await fetch(`${API_BASE}/api/customers?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

// Create customer
async function createCustomer(token, customerData) {
  const response = await fetch(`${API_BASE}/api/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  
  return response.json();
}
```

#### Using Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-backend-service.onrender.com',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', response.data.data.accessToken);
          return api.request(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const customerAPI = {
  getAll: (params) => api.get('/api/customers', { params }),
  getById: (id) => api.get(`/api/customers/${id}`),
  create: (data) => api.post('/api/customers', data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  delete: (id) => api.delete(`/api/customers/${id}`),
};
```

## 🔧 OpenAPI/Swagger Specification

The API also provides a Swagger/OpenAPI specification at:

```
https://your-backend-service.onrender.com/api/docs
```

This interactive documentation allows you to:
- Explore all endpoints
- Test API calls directly
- View request/response schemas
- Download the OpenAPI specification

## 📞 Support

For API support:
- **Email**: api-support@yourcrm.com
- **Documentation**: https://docs.yourcrm.com/api
- **Status Page**: https://status.yourcrm.com

---

*This API documentation is versioned and updated regularly. For the latest version, visit our developer portal.*
