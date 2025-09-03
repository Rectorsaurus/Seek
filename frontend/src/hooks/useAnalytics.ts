import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, RetailerClickEvent } from '../utils/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search);
  }, [location]);
}

export function useAnalytics() {
  return {
    trackRetailerClick: (data: RetailerClickEvent) => analytics.trackRetailerClick(data),
    trackSearch: (query: string, filters?: Record<string, any>) => analytics.trackSearch(query, filters),
    trackProductView: (productId: string, productName: string, brand: string) => 
      analytics.trackProductView(productId, productName, brand),
    trackPriceComparison: (productId: string, retailerCount: number) => 
      analytics.trackPriceComparison(productId, retailerCount),
    trackFilterUsage: (filterType: string, filterValue: string) => 
      analytics.trackFilterUsage(filterType, filterValue),
    trackEvent: (eventName: string, data?: Record<string, any>) => analytics.trackEvent(eventName, data)
  };
}