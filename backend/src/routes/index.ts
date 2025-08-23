import { Router } from 'express';
import productRoutes from './productRoutes';
import retailerRoutes from './retailerRoutes';

const router = Router();

// Mount route handlers
router.use('/products', productRoutes);
router.use('/retailers', retailerRoutes);

export default router;