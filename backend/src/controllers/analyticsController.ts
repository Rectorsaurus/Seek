import { Request, Response } from 'express';
import axios from 'axios';

interface GoatCounterConfig {
  apiUrl: string;
  apiKey: string;
  siteCode: string;
}

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  retailer?: string;
  product?: string;
  limit?: number;
}

interface RetailerClickStats {
  retailer: string;
  clicks: number;
  revenue?: number;
  products: {
    productId: string;
    productName: string;
    clicks: number;
  }[];
}

class AnalyticsController {
  private goatCounterConfig: GoatCounterConfig;

  constructor() {
    this.goatCounterConfig = {
      apiUrl: process.env.GOATCOUNTER_API_URL || 'http://localhost:8080/api',
      apiKey: process.env.GOATCOUNTER_API_KEY || '',
      siteCode: process.env.GOATCOUNTER_SITE_CODE || 'seek-tobacco'
    };
  }

  private async makeGoatCounterRequest(endpoint: string, params?: Record<string, any>) {
    try {
      const response = await axios.get(`${this.goatCounterConfig.apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.goatCounterConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        params
      });
      return response.data;
    } catch (error) {
      console.error('GoatCounter API error:', error);
      throw new Error('Failed to fetch analytics data');
    }
  }

  async getRetailerClickThroughs(req: Request, res: Response) {
    try {
      const { startDate, endDate, retailer, limit = 50 } = req.query as AnalyticsQuery;

      // Fetch retailer click events from GoatCounter
      const params: any = {
        filter: 'event',
        event: 'retailer_click',
        limit
      };

      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const data = await this.makeGoatCounterRequest('/v0/stats/hits', params);

      // Process and group by retailer
      const retailerStats: Record<string, RetailerClickStats> = {};

      if (data?.hits) {
        data.hits.forEach((hit: any) => {
          // Parse retailer from path or referrer
          const pathMatch = hit.path?.match(/retailer=([^&]+)/);
          const retailerName = pathMatch ? decodeURIComponent(pathMatch[1]) : 'Unknown';

          if (retailer && retailerName !== retailer) return;

          if (!retailerStats[retailerName]) {
            retailerStats[retailerName] = {
              retailer: retailerName,
              clicks: 0,
              products: []
            };
          }

          retailerStats[retailerName].clicks += hit.count || 1;

          // Extract product info if available
          const productIdMatch = hit.path?.match(/product_id=([^&]+)/);
          const productNameMatch = hit.path?.match(/product_name=([^&]+)/);

          if (productIdMatch && productNameMatch) {
            const productId = decodeURIComponent(productIdMatch[1]);
            const productName = decodeURIComponent(productNameMatch[1]);

            let productStat = retailerStats[retailerName].products.find(p => p.productId === productId);
            if (!productStat) {
              productStat = { productId, productName, clicks: 0 };
              retailerStats[retailerName].products.push(productStat);
            }
            productStat.clicks += hit.count || 1;
          }
        });
      }

      const result = Object.values(retailerStats)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, Number(limit));

      res.json({
        success: true,
        data: result,
        meta: {
          startDate,
          endDate,
          retailer,
          totalRetailers: result.length
        }
      });
    } catch (error) {
      console.error('Error fetching retailer click-throughs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch retailer analytics data'
      });
    }
  }

  async getProductAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, product, limit = 50 } = req.query as AnalyticsQuery;

      const params: any = {
        filter: 'event',
        event: 'product_view',
        limit
      };

      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const data = await this.makeGoatCounterRequest('/v0/stats/hits', params);

      const productStats: Record<string, any> = {};

      if (data?.hits) {
        data.hits.forEach((hit: any) => {
          const productIdMatch = hit.path?.match(/product_id=([^&]+)/);
          const productNameMatch = hit.path?.match(/product_name=([^&]+)/);
          const brandMatch = hit.path?.match(/brand=([^&]+)/);

          if (productIdMatch) {
            const productId = decodeURIComponent(productIdMatch[1]);
            const productName = productNameMatch ? decodeURIComponent(productNameMatch[1]) : 'Unknown';
            const brand = brandMatch ? decodeURIComponent(brandMatch[1]) : 'Unknown';

            if (product && productId !== product) return;

            if (!productStats[productId]) {
              productStats[productId] = {
                productId,
                productName,
                brand,
                views: 0,
                clicks: 0
              };
            }

            productStats[productId].views += hit.count || 1;
          }
        });
      }

      // Also get retailer clicks for these products
      const clickData = await this.makeGoatCounterRequest('/v0/stats/hits', {
        filter: 'event',
        event: 'retailer_click',
        limit: 1000
      });

      if (clickData?.hits) {
        clickData.hits.forEach((hit: any) => {
          const productIdMatch = hit.path?.match(/product_id=([^&]+)/);
          if (productIdMatch) {
            const productId = decodeURIComponent(productIdMatch[1]);
            if (productStats[productId]) {
              productStats[productId].clicks += hit.count || 1;
            }
          }
        });
      }

      const result = Object.values(productStats)
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, Number(limit));

      res.json({
        success: true,
        data: result,
        meta: {
          startDate,
          endDate,
          product,
          totalProducts: result.length
        }
      });
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product analytics data'
      });
    }
  }

  async getSearchAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = 50 } = req.query as AnalyticsQuery;

      const params: any = {
        filter: 'event',
        event: 'search',
        limit
      };

      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const data = await this.makeGoatCounterRequest('/v0/stats/hits', params);

      const searchStats: Record<string, any> = {};

      if (data?.hits) {
        data.hits.forEach((hit: any) => {
          const queryMatch = hit.path?.match(/query=([^&]+)/);
          if (queryMatch) {
            const query = decodeURIComponent(queryMatch[1]);

            if (!searchStats[query]) {
              searchStats[query] = {
                query,
                searches: 0,
                lastSearched: hit.created_at
              };
            }

            searchStats[query].searches += hit.count || 1;
            if (hit.created_at > searchStats[query].lastSearched) {
              searchStats[query].lastSearched = hit.created_at;
            }
          }
        });
      }

      const result = Object.values(searchStats)
        .sort((a: any, b: any) => b.searches - a.searches)
        .slice(0, Number(limit));

      res.json({
        success: true,
        data: result,
        meta: {
          startDate,
          endDate,
          totalQueries: result.length
        }
      });
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch search analytics data'
      });
    }
  }

  async getOverviewStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as AnalyticsQuery;

      const params: any = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const [totalViews, events] = await Promise.all([
        this.makeGoatCounterRequest('/v0/stats/total', params),
        this.makeGoatCounterRequest('/v0/stats/hits', { filter: 'event', ...params })
      ]);

      let retailerClicks = 0;
      let productViews = 0;
      let searches = 0;

      if (events?.hits) {
        events.hits.forEach((hit: any) => {
          if (hit.path?.includes('retailer_click')) retailerClicks += hit.count || 1;
          if (hit.path?.includes('product_view')) productViews += hit.count || 1;
          if (hit.path?.includes('search')) searches += hit.count || 1;
        });
      }

      res.json({
        success: true,
        data: {
          totalViews: totalViews?.count || 0,
          retailerClicks,
          productViews,
          searches,
          conversionRate: totalViews?.count > 0 ? (retailerClicks / totalViews.count * 100).toFixed(2) : '0.00'
        },
        meta: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch overview analytics data'
      });
    }
  }

  async exportAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'csv', type = 'retailer_clicks' } = req.query;

      // For now, return a simple placeholder export
      const data: any[] = [
        { message: 'Analytics export functionality is under development' }
      ];

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.csv"`);
        
        // Convert to CSV (simplified implementation)
        const csv = this.convertToCSV(data);
        res.send(csv);
      } else {
        res.json({ success: true, data });
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data'
      });
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

const analyticsController = new AnalyticsController();

export default analyticsController;