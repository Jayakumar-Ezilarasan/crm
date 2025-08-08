# CRM System Deployment Guide

This guide provides comprehensive deployment configurations for the CRM system across multiple environments.

## 🚀 Quick Start

1. **Prerequisites**
   - GitHub repository with code
   - Vercel account for frontend
   - Render account for backend
   - PostgreSQL database
   - Cloudflare account for CDN

2. **Deployment Order**
   ```bash
   1. Database Setup (Render PostgreSQL)
   2. Backend Deployment (Render)
   3. Frontend Deployment (Vercel)
   4. CDN Configuration (Cloudflare)
   5. Monitoring Setup
   ```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] Monitoring tools set up

### Post-Deployment
- [ ] Health checks passing
- [ ] Database connections verified
- [ ] API endpoints tested
- [ ] Frontend-backend communication confirmed
- [ ] Performance monitoring active
- [ ] Backup procedures tested

## 🔧 Environment Variables

### Backend (Render)
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://your-backend-service.onrender.com
VITE_APP_NAME=CRM System
VITE_APP_VERSION=1.0.0
```

## 🛠️ Rollback Strategy

### Backend Rollback
1. Navigate to Render dashboard
2. Select your backend service
3. Go to "Deployments" tab
4. Click "Rollback" on previous deployment

### Frontend Rollback
1. Navigate to Vercel dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click "Redeploy" on previous deployment

### Database Rollback
```bash
# Restore from backup
pg_restore -h host -U username -d database backup_file.sql
```

## 📊 Monitoring & Alerts

### Health Check Endpoints
- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: `https://your-frontend.vercel.app/health`

### Performance Metrics
- Response time < 200ms
- Uptime > 99.9%
- Error rate < 0.1%

## 🔒 Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] JWT secrets rotated regularly
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection protection
- [ ] XSS protection enabled

## 📞 Support & Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS_ORIGIN configuration
2. **Database Connection**: Verify DATABASE_URL format
3. **Build Failures**: Check Node.js version compatibility
4. **Environment Variables**: Ensure all required vars are set

### Emergency Contacts
- DevOps Team: devops@company.com
- Database Admin: db-admin@company.com
- Security Team: security@company.com

---

For detailed configuration files, see the following sections:
- [Backend Deployment](./backend/)
- [Frontend Deployment](./frontend/)
- [Database Setup](./database/)
- [CI/CD Pipeline](./ci-cd/)
- [Monitoring](./monitoring/)

