import { Router, Request, Response } from 'express';
import prisma from '../db';
import { body, validationResult } from 'express-validator';
import { apiLimiter } from '../middlewares/security';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Get all customers
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
    });
  }
});

// Get customer by ID
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
    });
  }
});

// Create new customer
router.post(
  '/',
  apiLimiter,
  authenticateJWT,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array(),
        });
      }

      const { name, email, phone, company, address } = req.body;
      const userId = (req as any).user.id; // From auth middleware

      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          company,
          address,
          ownerId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create customer',
      });
    }
  }
);

// Update customer
router.put(
  '/:id',
  apiLimiter,
  authenticateJWT,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, email, phone, company, address } = req.body;
      const userId = (req as any).user.id;

      // Check if customer exists and user has permission
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id: parseInt(id),
        },
      });

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
      }

      // Only allow owner to update
      if (existingCustomer.ownerId !== userId) {
        console.log('Authorization failed:', {
          customerOwnerId: existingCustomer.ownerId,
          currentUserId: userId,
          customerId: id
        });
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this customer',
        });
      }

      const customer = await prisma.customer.update({
        where: {
          id: parseInt(id),
        },
        data: {
          name,
          email,
          phone,
          company,
          address,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update customer',
      });
    }
  }
);

// Delete customer
router.delete('/:id', apiLimiter, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if customer exists and user has permission
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Only allow owner to delete
    if (existingCustomer.ownerId !== userId) {
      console.log('Authorization failed (delete):', {
        customerOwnerId: existingCustomer.ownerId,
        currentUserId: userId,
        customerId: id
      });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this customer',
      });
    }

    // Hard delete
    await prisma.customer.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
    });
  }
});

export default router; 