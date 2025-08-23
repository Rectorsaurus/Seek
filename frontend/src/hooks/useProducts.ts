import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/api';
import { SearchFilters } from '../types';

export const useProducts = (filters: SearchFilters, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: () => productApi.searchProducts(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProductsByBrand = (brand: string) => {
  return useQuery({
    queryKey: ['products', 'brand', brand],
    queryFn: () => productApi.getProductsByBrand(brand),
    enabled: !!brand,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.getFeaturedProducts(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};