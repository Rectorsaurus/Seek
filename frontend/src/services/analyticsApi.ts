import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsFilters extends DateRange {
  retailer?: string;
  product?: string;
  limit?: number;
}

export interface RetailerClickStats {
  retailer: string;
  clicks: number;
  revenue?: number;
  products: {
    productId: string;
    productName: string;
    clicks: number;
  }[];
}

export interface ProductStats {
  productId: string;
  productName: string;
  brand: string;
  views: number;
  clicks: number;
}

export interface SearchStats {
  query: string;
  searches: number;
  lastSearched: string;
}

export interface OverviewStats {
  totalViews: number;
  retailerClicks: number;
  productViews: number;
  searches: number;
  conversionRate: string;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta: {
    startDate?: string;
    endDate?: string;
    totalRetailers?: number;
    totalProducts?: number;
    totalQueries?: number;
  };
}

class AnalyticsApi {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/analytics`
  });

  async getOverviewStats(filters: DateRange = {}): Promise<OverviewStats> {
    const response = await this.api.get<AnalyticsResponse<OverviewStats>>('/overview', {
      params: filters
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch overview stats');
    }
    
    return response.data.data;
  }

  async getRetailerClickThroughs(filters: AnalyticsFilters = {}): Promise<RetailerClickStats[]> {
    const response = await this.api.get<AnalyticsResponse<RetailerClickStats[]>>('/retailer-clicks', {
      params: filters
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch retailer click-through data');
    }
    
    return response.data.data;
  }

  async getProductAnalytics(filters: AnalyticsFilters = {}): Promise<ProductStats[]> {
    const response = await this.api.get<AnalyticsResponse<ProductStats[]>>('/products', {
      params: filters
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch product analytics data');
    }
    
    return response.data.data;
  }

  async getSearchAnalytics(filters: AnalyticsFilters = {}): Promise<SearchStats[]> {
    const response = await this.api.get<AnalyticsResponse<SearchStats[]>>('/search', {
      params: filters
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch search analytics data');
    }
    
    return response.data.data;
  }

  async exportAnalyticsData(
    type: 'retailer_clicks' | 'product_analytics' | 'search_analytics',
    format: 'csv' | 'json' = 'csv',
    filters: AnalyticsFilters = {}
  ): Promise<Blob> {
    const response = await this.api.get('/export', {
      params: {
        type,
        format,
        ...filters
      },
      responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
      return new Blob([response.data], { type: 'text/csv' });
    } else {
      return response.data;
    }
  }

  // Helper method to download exported data
  downloadExport(
    blob: Blob,
    filename: string,
    type: 'retailer_clicks' | 'product_analytics' | 'search_analytics'
  ) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const analyticsApi = new AnalyticsApi();