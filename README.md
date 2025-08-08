# 🏢 CRM System

A modern, full-stack Customer Relationship Management (CRM) system built with React, Node.js, and PostgreSQL. Designed for businesses to manage customers, leads, tasks, and interactions efficiently.

## ✨ Features

- **👥 Customer Management** - Complete customer profiles with contact information and interaction history
- **🎯 Lead Pipeline** - Visual lead management with customizable stages and tracking
- **📋 Task Management** - Create, assign, and track tasks with due dates and priorities
- **📞 Interaction Tracking** - Log calls, emails, meetings, and notes for each customer
- **📊 Dashboard Analytics** - Real-time insights into sales performance and activities
- **🔐 Role-Based Access** - User roles (User, Manager, Admin) with appropriate permissions
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **🔒 Secure Authentication** - JWT-based authentication with refresh tokens
- **⚡ Performance Optimized** - Caching, database indexing, and code splitting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Vite)  │◄──►│  (Node.js/      │◄──►│  (PostgreSQL)   │
│                 │    │   Express)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │    Render       │    │   Render        │
│   (Hosting)     │    │   (API Hosting) │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- PostgreSQL 15+
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/crm-system.git
   cd crm-system
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp deployment/environment/env.example .env
   # Edit .env with your database credentials
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cp deployment/environment/env.example .env
   # Edit .env with your backend API URL
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Default admin: admin@crm.com / admin123

### Docker Setup

```bash
# Using Docker Compose
docker-compose up -d

# Or using production Docker Compose
cd deployment/docker
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- **[User Guide](docs/user-guide.md)** - How to use the CRM system
- **[API Documentation](docs/api-documentation.md)** - Complete API reference
- **[Technical Architecture](docs/technical-architecture.md)** - System design and architecture
- **[Database Schema](docs/database-schema.md)** - Database design and relationships
- **[Deployment Guide](deployment/README.md)** - Production deployment instructions
- **[Development Guide](docs/development-guide.md)** - Contributing and extending the system

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Zustand** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### DevOps & Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend and database hosting
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Prometheus & Grafana** - Monitoring

## 📊 Database Schema

```sql
-- Core entities
users (id, email, password_hash, name, role, ...)
customers (id, name, email, company, owner_id, ...)
leads (id, title, amount, customer_id, stage_id, ...)
tasks (id, title, status, due_date, user_id, ...)
interactions (id, type, customer_id, user_id, ...)

-- Supporting entities
lead_stages (id, name, order_index, ...)
audit_logs (id, table_name, record_id, action, ...)
```

## 🔧 Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Frontend
VITE_API_URL=https://your-backend-service.onrender.com
```

See [Environment Configuration](deployment/environment/env.example) for complete list.

## 🚀 Deployment

### Production Deployment

1. **Backend (Render)**
   ```bash
   # Deploy to Render using render.yaml
   render deploy
   ```

2. **Frontend (Vercel)**
   ```bash
   # Deploy to Vercel
   vercel --prod
   ```

3. **Database (Render PostgreSQL)**
   - Create PostgreSQL service on Render
   - Run migrations: `npm run db:migrate`
   - Seed data: `npm run db:seed`

See [Deployment Guide](deployment/README.md) for detailed instructions.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📈 Performance

- **Frontend Bundle Size**: < 500KB (gzipped)
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 50ms (average)
- **Uptime**: > 99.9%

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection
- HTTPS enforcement

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/contributing.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/crm-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/crm-system/discussions)
- **Email**: support@yourcrm.com

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Frontend hosting
- [Render](https://render.com/) - Backend hosting

---

**Made with ❤️ by the CRM Team** 