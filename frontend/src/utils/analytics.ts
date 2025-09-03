export interface AnalyticsEvent {
  path: string;
  title?: string;
  referrer?: string;
  event?: boolean;
}

export interface RetailerClickEvent {
  productId: string;
  productName: string;
  retailerName: string;
  retailerUrl: string;
  price: number;
  availability: string;
}

class Analytics {
  private enabled: boolean;
  private goatcounter: any;

  constructor() {
    this.enabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    this.goatcounter = (window as any).goatcounter;
  }

  private isGoatCounterReady(): boolean {
    return this.enabled && this.goatcounter && typeof this.goatcounter.count === 'function';
  }

  trackPageView(path: string, title?: string): void {
    if (!this.isGoatCounterReady()) return;

    this.goatcounter.count({
      path: path,
      title: title || document.title,
      event: false
    });
  }

  trackEvent(eventName: string, data?: Record<string, any>): void {
    if (!this.isGoatCounterReady()) return;

    let path = `/events/${eventName}`;
    if (data) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      path += `?${params.toString()}`;
    }

    this.goatcounter.count({
      path: path,
      title: `Event: ${eventName}`,
      event: true
    });
  }

  trackRetailerClick(data: RetailerClickEvent): void {
    this.trackEvent('retailer_click', {
      product_id: data.productId,
      product_name: data.productName,
      retailer: data.retailerName,
      price: data.price,
      availability: data.availability
    });
  }

  trackSearch(query: string, filters?: Record<string, any>): void {
    this.trackEvent('search', {
      query,
      ...filters
    });
  }

  trackProductView(productId: string, productName: string, brand: string): void {
    this.trackEvent('product_view', {
      product_id: productId,
      product_name: productName,
      brand: brand
    });
  }

  trackPriceComparison(productId: string, retailerCount: number): void {
    this.trackEvent('price_comparison', {
      product_id: productId,
      retailer_count: retailerCount
    });
  }

  trackFilterUsage(filterType: string, filterValue: string): void {
    this.trackEvent('filter_usage', {
      filter_type: filterType,
      filter_value: filterValue
    });
  }
}

export const analytics = new Analytics();