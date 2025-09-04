import { Router } from 'express';
import productRoutes from './productRoutes';
import retailerRoutes from './retailerRoutes';
import { analyticsRoutes } from './analyticsRoutes';
import authRoutes from './auth';

const router = Router();

// Mount route handlers
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/retailers', retailerRoutes);
router.use('/analytics', analyticsRoutes);

export default router;