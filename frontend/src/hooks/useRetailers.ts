import { useQuery } from '@tanstack/react-query';
import { retailerApi } from '../services/api';

export const useRetailers = () => {
  return useQuery({
    queryKey: ['retailers'],
    queryFn: () => retailerApi.getRetailers(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useRetailer = (id: string) => {
  return useQuery({
    queryKey: ['retailer', id],
    queryFn: () => retailerApi.getRetailer(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};