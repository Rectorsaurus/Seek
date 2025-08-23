import axios from 'axios';
import { Product, Retailer, SearchFilters, ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const productApi = {
  searchProducts: async (filters: SearchFilters, page = 1, limit = 20): Promise<PaginatedResponse<Product>> => {
    // Convert filters to properly formatted query parameters
    const params: any = { page, limit };
    
    // Add non-array filters
    if (filters.query) params.query = filters.query;
    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    
    // Add array filters with proper array syntax
    if (filters.availability && filters.availability.length > 0) {
      filters.availability.forEach((avail, index) => {
        params[`availability[${index}]`] = avail;
      });
    }
    if (filters.retailers && filters.retailers.length > 0) {
      filters.retailers.forEach((retailer, index) => {
        params[`retailers[${index}]`] = retailer;
      });
    }

    const response = await api.get('/products/search', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getProductsByBrand: async (brand: string): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/by-brand', { params: { brand } });
    return response.data;
  },

  getFeaturedProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/featured');
    return response.data;
  },
};

export const retailerApi = {
  getRetailers: async (): Promise<ApiResponse<Retailer[]>> => {
    const response = await api.get('/retailers');
    return response.data;
  },

  getRetailer: async (id: string): Promise<ApiResponse<Retailer>> => {
    const response = await api.get(`/retailers/${id}`);
    return response.data;
  },
};

export const healthApi = {
  checkHealth: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    const response = await api.get('/health');
    return response.data;
  },
};