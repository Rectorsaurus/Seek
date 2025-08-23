export interface Product {
  _id: string;
  name: string;
  brand: string;
  description?: string;
  category: 'aromatic' | 'english' | 'virginia' | 'burley' | 'latakia' | 'oriental' | 'perique' | 'cavendish' | 'bulk' | 'tinned';
  tobaccoType: string[];
  imageUrl?: string;
  retailers: RetailerProduct[];
  allRetailers?: RetailerProduct[]; // For product detail page - all retailers for same name/brand
  createdAt: string;
  updatedAt: string;
}

export interface RetailerProduct {
  retailerId: string | Retailer;
  retailerName?: string;
  productUrl: string;
  currentPrice: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  lastScraped: string;
  priceHistory: PriceHistory[];
}

export interface PriceHistory {
  price: number;
  date: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
}

export interface Retailer {
  _id: string;
  name: string;
  baseUrl: string;
  logoUrl?: string;
  isActive: boolean;
  lastScraped?: string;
}

export interface SearchFilters {
  query?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string[];
  retailers?: string[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}