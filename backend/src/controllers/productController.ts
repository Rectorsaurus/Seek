import { Request, Response, NextFunction } from 'express';
import { Product, Retailer } from '../models';
import { AppError } from '../middleware/errorHandler';

interface SearchQuery {
  query?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string[];
  retailers?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'brand' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class ProductController {
  
  static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        query = '',
        brand,
        category,
        minPrice,
        maxPrice,
        availability,
        retailers,
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query as unknown as SearchQuery;

      // Normalize array parameters
      const availabilityArray = Array.isArray(availability) ? availability : 
        (availability ? [availability] : []);
      const retailersArray = Array.isArray(retailers) ? retailers : 
        (retailers ? [retailers] : []);

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build search filter
      const filter: any = {};

      // Text search
      if (query && query.trim()) {
        filter.$text = { $search: query.trim() };
      }

      // Brand filter (AND logic - exact match)
      if (brand && brand.trim()) {
        filter.brand = new RegExp(brand.trim(), 'i');
      }

      // Category filter (AND logic - exact match) 
      if (category && category.trim()) {
        filter.category = category.trim();
      }

      // Handle retailer-based filters (price, availability, retailer names)
      // These need to be applied to products that have retailers matching ANY of the criteria
      const retailerFilters: any = {};
      
      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceCondition: any = {};
        if (minPrice !== undefined) {
          priceCondition.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined) {
          priceCondition.$lte = Number(maxPrice);
        }
        retailerFilters.currentPrice = priceCondition;
      }

      // Availability filter (OR logic - match any selected availability)
      if (availabilityArray.length > 0) {
        retailerFilters.availability = { $in: availabilityArray };
      }

      // Retailers filter (OR logic - match any selected retailer)
      if (retailersArray.length > 0) {
        const retailerObjects = await Retailer.find({ 
          name: { $in: retailersArray.map(r => new RegExp(r.trim(), 'i')) } 
        });
        const retailerIds = retailerObjects.map(r => r._id);
        if (retailerIds.length > 0) {
          retailerFilters.retailerId = { $in: retailerIds };
        }
      }

      // Apply retailer filters if any exist
      // This ensures products have AT LEAST ONE retailer matching the criteria
      if (Object.keys(retailerFilters).length > 0) {
        filter.retailers = { $elemMatch: retailerFilters };
      }


      // Build sort object
      const sort: any = {};
      if (sortBy === 'price') {
        sort['retailers.currentPrice'] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

      // Execute search
      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate('retailers.retailerId', 'name baseUrl logoUrl')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        Product.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findById(id)
        .populate('retailers.retailerId', 'name baseUrl logoUrl');

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Find all products with the same name and brand to aggregate retailers
      const allProductVariants = await Product.find({
        name: product.name,
        brand: product.brand
      }).populate('retailers.retailerId', 'name baseUrl logoUrl');

      // Aggregate all retailers from all variants
      const allRetailers: any[] = [];
      allProductVariants.forEach(variant => {
        variant.retailers.forEach(retailer => {
          allRetailers.push({
            ...JSON.parse(JSON.stringify(retailer)),
            productId: variant._id
          });
        });
      });

      // Sort retailers by availability (in_stock first) then by price
      allRetailers.sort((a, b) => {
        if (a.availability === 'in_stock' && b.availability !== 'in_stock') return -1;
        if (a.availability !== 'in_stock' && b.availability === 'in_stock') return 1;
        return a.currentPrice - b.currentPrice;
      });

      res.json({
        data: {
          ...product.toObject(),
          allRetailers
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getProductsByBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { brand } = req.query;

      if (!brand) {
        throw new AppError('Brand parameter is required', 400);
      }

      const products = await Product.find({
        brand: new RegExp(brand as string, 'i')
      })
      .populate('retailers.retailerId', 'name baseUrl logoUrl')
      .limit(50);

      res.json({
        data: products
      });

    } catch (error) {
      next(error);
    }
  }

  static async getFeaturedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get products with multiple retailers (indicating popularity)
      const products = await Product.aggregate([
        {
          $match: {
            'retailers.1': { $exists: true } // Has at least 2 retailers
          }
        },
        {
          $addFields: {
            retailerCount: { $size: '$retailers' },
            avgPrice: { $avg: '$retailers.currentPrice' }
          }
        },
        {
          $sort: {
            retailerCount: -1,
            avgPrice: 1
          }
        },
        {
          $limit: 20
        }
      ]);

      // Populate retailer information
      await Product.populate(products, {
        path: 'retailers.retailerId',
        select: 'name baseUrl logoUrl'
      });

      res.json({
        data: products
      });

    } catch (error) {
      next(error);
    }
  }

  static async getProductPriceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { retailerId } = req.query;

      const product = await Product.findById(id);

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      let priceHistory;

      if (retailerId) {
        // Get price history for specific retailer
        const retailerProduct = product.retailers.find(
          r => r.retailerId.toString() === retailerId
        );

        if (!retailerProduct) {
          throw new AppError('Product not found at this retailer', 404);
        }

        priceHistory = [
          ...retailerProduct.priceHistory,
          {
            price: retailerProduct.currentPrice,
            date: retailerProduct.lastScraped,
            availability: retailerProduct.availability
          }
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        // Get price history across all retailers
        priceHistory = product.retailers.flatMap(retailer => [
          ...retailer.priceHistory.map(p => ({ ...p, retailerId: retailer.retailerId })),
          {
            price: retailer.currentPrice,
            date: retailer.lastScraped,
            availability: retailer.availability,
            retailerId: retailer.retailerId
          }
        ]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      res.json({
        data: priceHistory
      });

    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await Product.distinct('brand');
      
      res.json({
        data: brands.sort()
      });

    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await Product.distinct('category');
      
      res.json({
        data: categories.sort()
      });

    } catch (error) {
      next(error);
    }
  }
}