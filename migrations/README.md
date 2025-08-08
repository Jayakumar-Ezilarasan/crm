# Database Migrations

This directory contains migration files for the CRM database schema.

- Each migration is a timestamped folder with up/down SQL scripts.
- Use a migration tool (e.g., Prisma Migrate, Flyway, or native SQL) to apply migrations.
- Example structure:

migrations/
  20240425_001_create_tables/
    up.sql
    down.sql
  20240425_002_seed_data/
    up.sql
    down.sql

- Migration order is important. Always review and test before applying to production. 