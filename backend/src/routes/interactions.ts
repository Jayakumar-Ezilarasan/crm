import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateJWT } from '../middlewares/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// List interactions (optionally by customer)
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { customer_id } = req.query;
  const where: any = {};
  if (customer_id) where.customerId = Number(customer_id);
  const interactions = await prisma.contact.findMany({
    where,
    orderBy: { contactDate: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: interactions });
});

// Get interaction by ID
router.get('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
  const interaction = await prisma.contact.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!interaction) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: interaction });
});

// Create interaction
router.post(
  '/',
  authenticateJWT,
  body('customerId').isInt(),
  body('type').notEmpty(),
  body('summary').optional().isString(),
  body('contactDate').isISO8601(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    const { customerId, type, summary, contactDate } = req.body;
    const interaction = await prisma.contact.create({
      data: {
        customerId,
        userId: (req as any).user.id,
        type,
        summary,
        contactDate,
      },
    });
    res.status(201).json({ success: true, data: interaction });
  }
);

// Update interaction
router.put(
  '/:id',
  authenticateJWT,
  param('id').isInt(),
  body('type').optional().notEmpty(),
  body('summary').optional().isString(),
  body('contactDate').optional().isISO8601(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    const { type, summary, contactDate } = req.body;
    const interaction = await prisma.contact.update({
      where: { id: Number(req.params.id) },
      data: { type, summary, contactDate },
    });
    res.json({ success: true, data: interaction });
  }
);

// Delete interaction
router.delete('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
  await prisma.contact.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ success: true });
});

export default router; 