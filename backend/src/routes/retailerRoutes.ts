import { Router } from 'express';
import { RetailerController } from '../controllers';

const router = Router();

// GET /api/retailers - Get all active retailers
router.get('/', RetailerController.getRetailers);

// GET /api/retailers/:id - Get specific retailer
router.get('/:id', RetailerController.getRetailer);

// GET /api/retailers/:id/stats - Get retailer statistics
router.get('/:id/stats', RetailerController.getRetailerStats);

export default router;