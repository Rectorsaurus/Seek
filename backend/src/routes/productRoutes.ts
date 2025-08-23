import { Router } from 'express';
import { ProductController } from '../controllers';

const router = Router();

// GET /api/products/search - Search products with filters
router.get('/search', ProductController.searchProducts);

// GET /api/products/featured - Get featured products
router.get('/featured', ProductController.getFeaturedProducts);

// GET /api/products/brands - Get all brands
router.get('/brands', ProductController.getBrands);

// GET /api/products/categories - Get all categories
router.get('/categories', ProductController.getCategories);

// GET /api/products/by-brand - Get products by brand
router.get('/by-brand', ProductController.getProductsByBrand);

// GET /api/products/:id - Get specific product
router.get('/:id', ProductController.getProduct);

// GET /api/products/:id/price-history - Get product price history
router.get('/:id/price-history', ProductController.getProductPriceHistory);

export default router;