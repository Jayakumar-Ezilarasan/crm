-- Database Index Optimization Scripts for CRM Application
-- Run these scripts to optimize database performance

-- Customer table indexes
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_owner_created ON customers(owner_id, created_at DESC);

-- Task table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_due_date ON tasks(completed, due_date);

-- Lead table indexes
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_value ON leads(value);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_customer_stage ON leads(customer_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_value ON leads(stage_id, value DESC);

-- Contact table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_date ON contacts(contact_date);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_date ON contacts(customer_id, contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_date ON contacts(user_id, contact_date DESC);

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at);

-- LeadStage table indexes
CREATE INDEX IF NOT EXISTS idx_lead_stages_order ON lead_stages("order");
CREATE INDEX IF NOT EXISTS idx_lead_stages_name ON lead_stages(name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(company, '') || ' ' || COALESCE(email, '')));
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_pending ON tasks(user_id, due_date) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(user_id, due_date) WHERE completed = false AND due_date < NOW();
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(customer_id, stage_id) WHERE stage_id != (SELECT id FROM lead_stages WHERE name = 'Closed' LIMIT 1);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_dashboard_customer_stats ON customers(owner_id, created_at) WHERE created_at >= NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_dashboard_task_stats ON tasks(user_id, completed, created_at) WHERE created_at >= NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_dashboard_lead_stats ON leads(customer_id, stage_id, created_at) WHERE created_at >= NOW() - INTERVAL '30 days';

-- Indexes for reporting queries
CREATE INDEX IF NOT EXISTS idx_reports_customer_acquisition ON customers(owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_sales_conversion ON leads(customer_id, stage_id, value, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_user_activity ON contacts(user_id, contact_date);

-- Analyze tables after creating indexes
ANALYZE customers;
ANALYZE tasks;
ANALYZE leads;
ANALYZE contacts;
ANALYZE users;
ANALYZE lead_stages;

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Query to find unused indexes
-- SELECT schemaname, tablename, indexname 
-- FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 
-- ORDER BY schemaname, tablename;

-- Query to find slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time, rows
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- Query to check table sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to check index sizes
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
-- FROM pg_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;

-- Performance monitoring queries
-- Check for table bloat
-- SELECT 
--   schemaname,
--   tablename,
--   n_tup_ins as inserts,
--   n_tup_upd as updates,
--   n_tup_del as deletes,
--   n_live_tup as live_tuples,
--   n_dead_tup as dead_tuples
-- FROM pg_stat_user_tables 
-- ORDER BY n_dead_tup DESC;

-- Check for index bloat
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Vacuum and analyze commands for maintenance
-- VACUUM ANALYZE customers;
-- VACUUM ANALYZE tasks;
-- VACUUM ANALYZE leads;
-- VACUUM ANALYZE contacts;
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE lead_stages;

-- Reindex commands for index maintenance
-- REINDEX INDEX CONCURRENTLY idx_customers_owner_id;
-- REINDEX INDEX CONCURRENTLY idx_tasks_user_id;
-- REINDEX INDEX CONCURRENTLY idx_leads_customer_id;
-- REINDEX INDEX CONCURRENTLY idx_contacts_customer_id;
-- REINDEX INDEX CONCURRENTLY idx_users_email;
