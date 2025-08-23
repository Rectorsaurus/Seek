import { Request, Response, NextFunction } from 'express';
import { Retailer, Product } from '../models';
import { AppError } from '../middleware/errorHandler';

export class RetailerController {
  
  static async getRetailers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const retailers = await Retailer.find({ isActive: true })
        .select('name baseUrl logoUrl lastScraped')
        .sort({ name: 1 });

      res.json({
        data: retailers
      });

    } catch (error) {
      next(error);
    }
  }

  static async getRetailer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const retailer = await Retailer.findById(id)
        .select('name baseUrl logoUrl lastScraped isActive');

      if (!retailer) {
        throw new AppError('Retailer not found', 404);
      }

      res.json({
        data: retailer
      });

    } catch (error) {
      next(error);
    }
  }

  static async getRetailerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const retailer = await Retailer.findById(id);

      if (!retailer) {
        throw new AppError('Retailer not found', 404);
      }

      // Get product count and average price for this retailer
      const stats = await Product.aggregate([
        {
          $match: {
            'retailers.retailerId': retailer._id
          }
        },
        {
          $unwind: '$retailers'
        },
        {
          $match: {
            'retailers.retailerId': retailer._id
          }
        },
        {
          $group: {
            _id: retailer._id,
            name: { $first: retailer.name },
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: '$retailers.currentPrice' },
            inStockProducts: {
              $sum: {
                $cond: [
                  { $eq: ['$retailers.availability', 'in_stock'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const retailerStats = stats[0] || {
        _id: retailer._id,
        name: retailer.name,
        totalProducts: 0,
        averagePrice: 0,
        inStockProducts: 0
      };

      res.json({
        data: {
          ...retailerStats,
          lastScraped: retailer.lastScraped
        }
      });

    } catch (error) {
      next(error);
    }
  }
}