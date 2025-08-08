-- USERS
INSERT INTO users (email, password_hash, name, role) VALUES
('alice@example.com', 'hashedpassword1', 'Alice Smith', 'admin'),
('bob@example.com', 'hashedpassword2', 'Bob Jones', 'user');

-- CATEGORIES
INSERT INTO categories (name, type) VALUES
('VIP', 'customer'),
('Standard', 'customer'),
('Hot Lead', 'lead'),
('Cold Lead', 'lead'),
('Urgent', 'task'),
('Routine', 'task');

-- CUSTOMERS
INSERT INTO customers (name, email, phone, company, address, owner_id, category_id) VALUES
('Acme Corp', 'contact@acme.com', '123-456-7890', 'Acme Corp', '123 Main St', 1, 1),
('Beta LLC', 'info@beta.com', '555-555-5555', 'Beta LLC', '456 Elm St', 2, 2);

-- INTERACTIONS
INSERT INTO interactions (customer_id, user_id, type, summary, interaction_date) VALUES
(1, 1, 'call', 'Discussed new project', NOW() - INTERVAL '7 days'),
(2, 2, 'email', 'Sent proposal', NOW() - INTERVAL '3 days');

-- LEADS
INSERT INTO leads (customer_id, category_id, stage, value, source) VALUES
(1, 3, 'Lead', 10000, 'Referral'),
(2, 4, 'Qualified', 5000, 'Website');

-- TASKS
INSERT INTO tasks (user_id, customer_id, lead_id, category_id, title, description, due_date, completed) VALUES
(1, 1, 1, 5, 'Follow up call', 'Call Acme Corp to discuss proposal', NOW() + INTERVAL '2 days', false),
(2, 2, 2, 6, 'Send contract', 'Send contract to Beta LLC', NOW() + INTERVAL '1 day', false); 