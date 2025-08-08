-- Migration: Add updatedAt, updatedBy to User table and create leads relationship
-- Date: 2025-08-06

-- 1. Add updatedAt column to User table
ALTER TABLE "User" 
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Add updatedBy column to User table (references User.id)
ALTER TABLE "User" 
ADD COLUMN "updatedBy" INTEGER;

-- 3. Add foreign key constraint for updatedBy
ALTER TABLE "User" 
ADD CONSTRAINT "User_updatedBy_fkey" 
FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL;

-- 4. Add ownerId column to Lead table to create relationship with User
ALTER TABLE "Lead" 
ADD COLUMN "ownerId" INTEGER;

-- 5. Add foreign key constraint for Lead.ownerId
ALTER TABLE "Lead" 
ADD CONSTRAINT "Lead_ownerId_fkey" 
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL;

-- 6. Update existing leads to assign them to the first user (or a specific user)
-- You can modify this query based on your business logic
UPDATE "Lead" 
SET "ownerId" = (SELECT "id" FROM "User" LIMIT 1)
WHERE "ownerId" IS NULL;

-- 7. Make ownerId NOT NULL after populating existing data
ALTER TABLE "Lead" 
ALTER COLUMN "ownerId" SET NOT NULL;

-- 8. Create index for better performance
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");
CREATE INDEX "User_updatedBy_idx" ON "User"("updatedBy");
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- 9. Add trigger to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Update Prisma schema (you'll need to update the schema.prisma file)
-- Add these lines to the User model:
-- updatedAt DateTime @updatedAt
-- updatedBy User? @relation("UserUpdatedBy", fields: [updatedBy], references: [id])
-- updatedUsers User[] @relation("UserUpdatedBy")
-- leads Lead[]

-- Add this line to the Lead model:
-- owner User @relation(fields: [ownerId], references: [id])
-- ownerId Int

-- 11. After running this migration, regenerate Prisma client:
-- npx prisma generate 