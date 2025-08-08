import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

// Customer acquisition over time
router.get('/customer-acquisition', authenticateJWT, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  const data = await prisma.$queryRawUnsafe(`
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
    FROM customers
    WHERE deleted_at IS NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  res.json({ success: true, data });
});

// Sales conversion rates by stage
router.get('/sales-conversion', authenticateJWT, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  const data = await prisma.$queryRawUnsafe(`
    SELECT stage, COUNT(*) AS count
    FROM leads
    WHERE deleted_at IS NULL
    GROUP BY stage
    ORDER BY count DESC
  `);
  res.json({ success: true, data });
});

export default router; 