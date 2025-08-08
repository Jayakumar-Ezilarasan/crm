import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateJWT } from '../middlewares/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// List leads
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
  const leads = await prisma.lead.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// Get lead by ID
router.get('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  try {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    
  const lead = await prisma.lead.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
  res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

// Create lead
router.post(
  '/',
  authenticateJWT,
  body('customerId').isInt(),
  body('stageId').isInt(),
  body('value').optional().isNumeric(),
  body('source').optional().isString(),
  async (req: Request, res: Response) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
      
      const { customerId, stageId, value, source } = req.body;
    const lead = await prisma.lead.create({
        data: { 
          customerId, 
          stageId, 
          value: value ? parseFloat(value) : null, 
          source 
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
    });
    res.status(201).json({ success: true, data: lead });
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ success: false, error: 'Failed to create lead' });
    }
  }
);

// Update lead
router.put(
  '/:id',
  authenticateJWT,
  param('id').isInt(),
  body('stageId').optional().isInt(),
  body('value').optional().isNumeric(),
  body('source').optional().isString(),
  async (req: Request, res: Response) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
      
      const { stageId, value, source } = req.body;
    const lead = await prisma.lead.update({
        where: { id: Number(req.params.id) },
        data: { 
          stageId, 
          value: value ? parseFloat(value) : null, 
          source 
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
    });
    res.json({ success: true, data: lead });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ success: false, error: 'Failed to update lead' });
    }
  }
);

// Delete lead
router.delete('/:id', authenticateJWT, param('id').isInt(), async (req: Request, res: Response) => {
  try {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });
    
    await prisma.lead.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

export default router; 