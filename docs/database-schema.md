# 🗄️ CRM System Database Schema

Complete documentation of the CRM System database design, including entity relationships, constraints, indexes, and data flow.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Database Tables](#database-tables)
4. [Relationships](#relationships)
5. [Indexes & Performance](#indexes--performance)
6. [Data Types & Constraints](#data-types--constraints)
7. [Migrations](#migrations)
8. [Seeding](#seeding)
9. [Backup & Recovery](#backup--recovery)

## 🌐 Overview

The CRM System uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The schema is designed for scalability, performance, and data integrity.

### Database Statistics
- **Total Tables**: 8 core tables
- **Total Indexes**: 25+ indexes for performance
- **Relationships**: 15+ foreign key relationships
- **Audit Trail**: Complete audit logging for all changes

## 🔗 Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   LeadStages    │    │   AuditLogs     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ email (UQ)      │    │ name            │    │ table_name      │
│ password_hash   │    │ description     │    │ record_id       │
│ name            │    │ order_index     │    │ action          │
│ role            │    │ is_active       │    │ old_values      │
│ is_active       │    │ created_at      │    │ new_values      │
│ last_login      │    │ updated_at      │    │ user_id (FK)    │
│ created_at      │    └─────────────────┘    │ created_at      │
│ updated_at      │                           └─────────────────┘
└─────────────────┘                                    │
         │                                             │
         │ 1:N                                         │
         ▼                                             │
┌─────────────────┐    ┌─────────────────┐             │
│   Customers     │    │      Leads      │             │
├─────────────────┤    ├─────────────────┤             │
│ id (PK)         │    │ id (PK)         │             │
│ name            │    │ title           │             │
│ email           │    │ description     │             │
│ phone           │    │ amount          │             │
│ company         │    │ currency        │             │
│ industry        │    │ customer_id(FK) │◄────────────┼──┐
│ website         │    │ stage_id (FK)   │             │  │
│ address         │    │ owner_id (FK)   │             │  │
│ city            │    │ source          │             │  │
│ state           │    │ probability     │             │  │
│ country         │    │ expected_close  │             │  │
│ postal_code     │    │ created_at      │             │  │
│ owner_id (FK)   │    │ updated_at      │             │  │
│ status          │    └─────────────────┘             │  │
│ notes           │             │                      │  │
│ created_at      │             │ 1:N                  │  │
│ updated_at      │             ▼                      │  │
└─────────────────┘    ┌─────────────────┐             │  │
         │              │     Tasks       │             │  │
         │ 1:N          ├─────────────────┤             │  │
         ▼              │ id (PK)         │             │  │
┌─────────────────┐    │ title           │             │  │
│  Interactions   │    │ description     │             │  │
├─────────────────┤    │ status          │             │  │
│ id (PK)         │    │ priority        │             │  │
│ type            │    │ due_date        │             │  │
│ subject         │    │ completed_at    │             │  │
│ description     │    │ user_id (FK)    │             │  │
│ customer_id(FK) │    │ customer_id(FK) │◄────────────┼──┼──┐
│ lead_id (FK)    │    │ lead_id (FK)    │◄────────────┼──┼──┼──┐
│ user_id (FK)    │    │ assigned_to(FK) │             │  │  │  │  │
│ interaction_date│    │ created_at      │             │  │  │  │  │
│ duration_minutes│    │ updated_at      │             │  │  │  │  │
│ outcome         │    └─────────────────┘             │  │  │  │  │
│ follow_up_date  │             │                      │  │  │  │  │
│ created_at      │             │ 1:N                  │  │  │  │  │
│ updated_at      │             ▼                      │  │  │  │  │
└─────────────────┘    ┌─────────────────┐             │  │  │  │  │
                       │   Interactions  │◄────────────┼──┼──┼──┼──┘
                       ├─────────────────┤             │  │  │  │
                       │ id (PK)         │             │  │  │  │
                       │ type            │             │  │  │  │
                       │ subject         │             │  │  │  │
                       │ description     │             │  │  │  │
                       │ customer_id(FK) │◄────────────┼──┼──┼──┘
                       │ lead_id (FK)    │◄────────────┼──┼──┘
                       │ user_id (FK)    │◄────────────┼──┘
                       │ interaction_date│
                       │ duration_minutes│
                       │ outcome         │
                       │ follow_up_date  │
                       │ created_at      │
                       │ updated_at      │
                       └─────────────────┘
```

## 📊 Database Tables

### 1. Users Table

**Purpose**: Store user accounts and authentication information

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Sample Data**:
```sql
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@crm.com', '$2b$10$...', 'System Administrator', 'admin'),
('manager@crm.com', '$2b$10$...', 'Sales Manager', 'manager'),
('user@crm.com', '$2b$10$...', 'Sales Representative', 'user');
```

### 2. Customers Table

**Purpose**: Store customer information and contact details

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    industry VARCHAR(100),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_customers_owner_id ON customers(owner_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_industry ON customers(industry);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_company ON customers(company);
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '')));
```

**Sample Data**:
```sql
INSERT INTO customers (name, email, company, industry, owner_id) VALUES
('Acme Corp', 'contact@acme.com', 'Acme Corporation', 'Technology', 1),
('Tech Solutions', 'info@techsolutions.com', 'Tech Solutions Inc', 'Technology', 2),
('Healthcare Plus', 'hello@healthcareplus.com', 'Healthcare Plus LLC', 'Healthcare', 3);
```

### 3. Lead Stages Table

**Purpose**: Define the stages in the sales pipeline

```sql
CREATE TABLE lead_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data**:
```sql
INSERT INTO lead_stages (name, description, order_index) VALUES
('New', 'Recently added leads', 1),
('Contacted', 'Initial contact made', 2),
('Qualified', 'Lead meets criteria and is interested', 3),
('Proposal', 'Proposal or quote sent', 4),
('Negotiation', 'In negotiation phase', 5),
('Closed Won', 'Successfully converted to customer', 6),
('Closed Lost', 'Opportunity lost', 7);
```

### 4. Leads Table

**Purpose**: Track sales opportunities and their progression

```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES lead_stages(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(100),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_stage_id ON leads(stage_id);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_amount ON leads(amount);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

### 5. Tasks Table

**Purpose**: Manage tasks and activities for users

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

### 6. Interactions Table

**Purpose**: Track all customer interactions and communications

```sql
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    type interaction_type NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER,
    outcome TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_interaction_date ON interactions(interaction_date);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
```

### 7. Audit Logs Table

**Purpose**: Track all changes to data for compliance and debugging

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

## 🔗 Relationships

### Primary Relationships

1. **Users → Customers** (1:N)
   - One user can own many customers
   - Customer ownership can be transferred

2. **Users → Leads** (1:N)
   - One user can own many leads
   - Lead ownership can be transferred

3. **Users → Tasks** (1:N)
   - One user can have many tasks
   - Tasks can be assigned to different users

4. **Customers → Leads** (1:N)
   - One customer can have multiple leads
   - Lead must belong to a customer

5. **Customers → Interactions** (1:N)
   - One customer can have many interactions
   - All interactions must be linked to a customer

6. **Leads → Tasks** (1:N)
   - One lead can have multiple tasks
   - Tasks can be related to leads

7. **Lead Stages → Leads** (1:N)
   - One stage can have many leads
   - Lead must be in one stage

### Foreign Key Constraints

```sql
-- Customer ownership
ALTER TABLE customers 
ADD CONSTRAINT fk_customers_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Lead relationships
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE leads 
ADD CONSTRAINT fk_leads_stage 
FOREIGN KEY (stage_id) REFERENCES lead_stages(id) ON DELETE SET NULL;

ALTER TABLE leads 
ADD CONSTRAINT fk_leads_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Task relationships
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_lead 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Interaction relationships
ALTER TABLE interactions 
ADD CONSTRAINT fk_interactions_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE interactions 
ADD CONSTRAINT fk_interactions_lead 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

ALTER TABLE interactions 
ADD CONSTRAINT fk_interactions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## ⚡ Indexes & Performance

### Performance Indexes

#### Composite Indexes for Common Queries

```sql
-- Customer queries by owner and status
CREATE INDEX idx_customers_owner_status ON customers(owner_id, status);

-- Lead queries by owner and stage
CREATE INDEX idx_leads_owner_stage ON leads(owner_id, stage_id);

-- Task queries by user and status
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Interaction queries by customer and date
CREATE INDEX idx_interactions_customer_date ON interactions(customer_id, interaction_date);

-- Lead queries by customer and stage
CREATE INDEX idx_leads_customer_stage ON leads(customer_id, stage_id);
```

#### Partial Indexes for Active Data

```sql
-- Only active customers
CREATE INDEX idx_customers_active ON customers(owner_id, status) 
WHERE status = 'active';

-- Only pending tasks
CREATE INDEX idx_tasks_pending ON tasks(user_id, due_date) 
WHERE status = 'pending';

-- Only active leads
CREATE INDEX idx_leads_active ON leads(owner_id, stage_id) 
WHERE stage_id NOT IN (6, 7); -- Exclude closed stages
```

#### Full-Text Search Indexes

```sql
-- Customer search
CREATE INDEX idx_customers_search ON customers 
USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '') || ' ' || COALESCE(email, '')));

-- Lead search
CREATE INDEX idx_leads_search ON leads 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Task search
CREATE INDEX idx_tasks_search ON tasks 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### Query Optimization Examples

#### Optimized Customer Query

```sql
-- Before optimization
SELECT c.*, u.name as owner_name 
FROM customers c 
LEFT JOIN users u ON c.owner_id = u.id 
WHERE c.owner_id = $1;

-- After optimization (with proper indexing)
SELECT c.id, c.name, c.email, c.company, c.status, u.name as owner_name
FROM customers c 
LEFT JOIN users u ON c.owner_id = u.id 
WHERE c.owner_id = $1 AND c.status = 'active'
ORDER BY c.created_at DESC;
```

#### Optimized Lead Pipeline Query

```sql
-- Efficient lead pipeline query
SELECT 
    ls.name as stage_name,
    ls.order_index,
    COUNT(l.id) as lead_count,
    SUM(l.amount) as total_value
FROM lead_stages ls
LEFT JOIN leads l ON ls.id = l.stage_id AND l.owner_id = $1
WHERE ls.is_active = true
GROUP BY ls.id, ls.name, ls.order_index
ORDER BY ls.order_index;
```

## 📝 Data Types & Constraints

### Custom Types

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');

-- Task status
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Lead status (deprecated, now using lead_stages table)
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Interaction types
CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'note');
```

### Constraints

#### Check Constraints

```sql
-- Probability must be between 0 and 100
ALTER TABLE leads 
ADD CONSTRAINT chk_leads_probability 
CHECK (probability >= 0 AND probability <= 100);

-- Amount must be positive
ALTER TABLE leads 
ADD CONSTRAINT chk_leads_amount 
CHECK (amount IS NULL OR amount > 0);

-- Duration must be positive
ALTER TABLE interactions 
ADD CONSTRAINT chk_interactions_duration 
CHECK (duration_minutes IS NULL OR duration_minutes > 0);

-- Email format validation
ALTER TABLE customers 
ADD CONSTRAINT chk_customers_email 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### Unique Constraints

```sql
-- User email must be unique
ALTER TABLE users 
ADD CONSTRAINT uk_users_email UNIQUE (email);

-- Customer name + company combination should be unique
ALTER TABLE customers 
ADD CONSTRAINT uk_customers_name_company UNIQUE (name, company);
```

## 🔄 Migrations

### Migration Strategy

The system uses Prisma migrations for database schema changes:

```bash
# Generate migration
npx prisma migrate dev --name add_customer_industry

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Example Migration

```sql
-- Migration: 20231201_add_customer_industry.sql
-- Add industry field to customers table

ALTER TABLE customers 
ADD COLUMN industry VARCHAR(100);

-- Create index for industry queries
CREATE INDEX idx_customers_industry ON customers(industry);

-- Add constraint for valid industries
ALTER TABLE customers 
ADD CONSTRAINT chk_customers_industry 
CHECK (industry IS NULL OR industry IN (
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 
    'Education', 'Real Estate', 'Consulting', 'Other'
));
```

## 🌱 Seeding

### Seed Data Structure

```typescript
// prisma/seed.ts
async function main() {
  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password_hash: await bcrypt.hash('admin123', 12),
      name: 'System Administrator',
      role: 'admin'
    }
  });

  // Create lead stages
  const stages = await Promise.all([
    prisma.leadStage.create({ data: { name: 'New', orderIndex: 1 } }),
    prisma.leadStage.create({ data: { name: 'Contacted', orderIndex: 2 } }),
    prisma.leadStage.create({ data: { name: 'Qualified', orderIndex: 3 } }),
    prisma.leadStage.create({ data: { name: 'Proposal', orderIndex: 4 } }),
    prisma.leadStage.create({ data: { name: 'Negotiation', orderIndex: 5 } }),
    prisma.leadStage.create({ data: { name: 'Closed Won', orderIndex: 6 } }),
    prisma.leadStage.create({ data: { name: 'Closed Lost', orderIndex: 7 } })
  ]);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        company: 'Acme Corp',
        industry: 'Technology',
        ownerId: admin.id
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Tech Solutions Inc',
        email: 'info@techsolutions.com',
        company: 'Tech Solutions',
        industry: 'Technology',
        ownerId: admin.id
      }
    })
  ]);
}
```

## 💾 Backup & Recovery

### Backup Strategy

#### Automated Backups

```bash
#!/bin/bash
# backup.sh

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --file="/backups/crm_backup_$(date +%Y%m%d_%H%M%S).sql"

# Compress backup
gzip "/backups/crm_backup_$(date +%Y%m%d_%H%M%S).sql"

# Upload to cloud storage
aws s3 cp "/backups/crm_backup_$(date +%Y%m%d_%H%M%S).sql.gz" \
  "s3://crm-backups/database/"
```

#### Recovery Process

```bash
#!/bin/bash
# restore.sh

# Download backup
aws s3 cp "s3://crm-backups/database/backup_file.sql.gz" .

# Decompress
gunzip backup_file.sql.gz

# Restore database
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  backup_file.sql
```

### Data Retention Policy

- **Customer Data**: Retained indefinitely
- **Lead Data**: Retained for 5 years after closure
- **Task Data**: Retained for 3 years after completion
- **Interaction Data**: Retained for 7 years
- **Audit Logs**: Retained for 10 years
- **User Data**: Retained while account is active

---

*This database schema documentation is maintained by the database team. For schema changes, please follow the migration process and update this documentation accordingly.*
