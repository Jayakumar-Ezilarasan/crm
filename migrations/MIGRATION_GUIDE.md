# Database Migration Guide: Add updatedAt, updatedBy to User and Lead relationships

## Overview
This migration adds the following to the User table:
- `updatedAt` - Timestamp that automatically updates when the record is modified
- `updatedBy` - Reference to the User who last updated the record
- `leads` - Relationship to Lead records

## Step-by-Step Migration Process

### 1. Backup Your Database (IMPORTANT!)
```bash
# Create a backup before making changes
pg_dump your_database_name > backup_before_migration.sql
```

### 2. Run the SQL Migration
```bash
# Connect to your PostgreSQL database and run the migration
psql your_database_name -f migrations/add_user_fields.sql
```

### 3. Update Prisma Schema
Replace your current `backend/prisma/schema.prisma` with the updated version:
```bash
# Copy the updated schema
cp backend/prisma/schema_updated.prisma backend/prisma/schema.prisma
```

### 4. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 5. Update Backend Code
Update the admin routes to include the new fields:

```typescript
// In backend/src/routes/admin.ts
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,  // Now available
    updatedBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### 6. Update Frontend Types
Update `frontend/src/types/models.ts`:

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  updatedAt?: string;
  updatedBy?: {
    id: number;
    name: string;
    email: string;
  };
}
```

### 7. Test the Migration
```bash
# Start the backend server
cd backend && npm run dev

# Test admin functionality
# Login as admin and check if user management works
```

## What the Migration Does

### 1. User Table Changes
- **Adds `updatedAt`**: Automatically tracks when user records are modified
- **Adds `updatedBy`**: Tracks which user made the last modification
- **Adds trigger**: Automatically updates `updatedAt` timestamp on any update

### 2. Lead Table Changes
- **Adds `ownerId`**: Creates relationship between leads and users
- **Adds foreign key**: Ensures data integrity
- **Populates existing data**: Assigns existing leads to the first user

### 3. Performance Optimizations
- **Creates indexes**: Improves query performance for the new fields
- **Adds constraints**: Ensures data integrity

## Rollback Plan (If Needed)

If you need to rollback the migration:

```sql
-- Drop the new columns and relationships
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "ownerId";

-- Drop the trigger
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS "User_updatedAt_idx";
DROP INDEX IF EXISTS "User_updatedBy_idx";
DROP INDEX IF EXISTS "Lead_ownerId_idx";
```

## Verification Steps

After running the migration, verify:

1. **User table has new columns**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('updatedAt', 'updatedBy');
```

2. **Lead table has ownerId**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Lead' 
AND column_name = 'ownerId';
```

3. **Trigger is working**:
```sql
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'update_user_updated_at';
```

4. **Indexes are created**:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname IN ('User_updatedAt_idx', 'User_updatedBy_idx', 'Lead_ownerId_idx');
```

## Notes

- The migration assigns existing leads to the first user in the system
- You may want to customize this assignment based on your business logic
- The `updatedBy` field will be NULL for existing records
- Consider updating your application logic to populate `updatedBy` when users are modified 