import { useQuery } from '@tanstack/react-query';
import { 
  analyticsApi, 
  AnalyticsFilters, 
  DateRange
} from '../services/analyticsApi';

export function useOverviewStats(filters: DateRange = {}) {
  return useQuery({
    queryKey: ['analytics', 'overview', filters],
    queryFn: () => analyticsApi.getOverviewStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRetailerClickThroughs(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['analytics', 'retailer-clicks', filters],
    queryFn: () => analyticsApi.getRetailerClickThroughs(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['analytics', 'products', filters],
    queryFn: () => analyticsApi.getProductAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['analytics', 'search', filters],
    queryFn: () => analyticsApi.getSearchAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  });
}