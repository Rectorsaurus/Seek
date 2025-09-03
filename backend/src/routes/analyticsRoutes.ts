import { Router } from 'express';
import analyticsController from '../controllers/analyticsController';

const router = Router();

// Overview statistics
router.get('/overview', analyticsController.getOverviewStats.bind(analyticsController));

// Retailer click-through analytics
router.get('/retailer-clicks', analyticsController.getRetailerClickThroughs.bind(analyticsController));

// Product analytics
router.get('/products', analyticsController.getProductAnalytics.bind(analyticsController));

// Search analytics
router.get('/search', analyticsController.getSearchAnalytics.bind(analyticsController));

// Export analytics data
router.get('/export', analyticsController.exportAnalyticsData.bind(analyticsController));

export { router as analyticsRoutes };