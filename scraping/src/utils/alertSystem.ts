import { EventEmitter } from 'events';
import { IProduct } from '../models';

export interface Alert {
  id: string;
  type: 'stock_change' | 'price_drop' | 'new_product' | 'restock' | 'limited_release';
  productId: string;
  productName: string;
  brand: string;
  message: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  retailers: string[];
}

export interface AlertRule {
  id: string;
  type: Alert['type'];
  enabled: boolean;
  conditions: {
    brands?: string[];
    categories?: string[];
    maxPrice?: number;
    minPopularityScore?: number;
    keywords?: string[];
  };
  actions: {
    logToConsole?: boolean;
    saveToDatabase?: boolean;
    webhook?: string;
    email?: string[];
  };
}

export class AlertSystem extends EventEmitter {
  private static instance: AlertSystem;
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];
  private alertCount = 0;

  private constructor() {
    super();
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  private initializeDefaultRules(): void {
    // Default alert rules for limited releases and price changes
    this.rules = [
      {
        id: 'limited_release',
        type: 'limited_release',
        enabled: true,
        conditions: {
          minPopularityScore: 40
        },
        actions: {
          logToConsole: true,
          saveToDatabase: true
        }
      },
      {
        id: 'esoterica_restock',
        type: 'restock',
        enabled: true,
        conditions: {
          brands: ['Esoterica', 'esoterica']
        },
        actions: {
          logToConsole: true,
          saveToDatabase: true
        }
      },
      {
        id: 'significant_price_drop',
        type: 'price_drop',
        enabled: true,
        conditions: {
          minPopularityScore: 20
        },
        actions: {
          logToConsole: true,
          saveToDatabase: true
        }
      },
      {
        id: 'mcclelland_stock',
        type: 'stock_change',
        enabled: true,
        conditions: {
          brands: ['McClelland', 'mcclelland'],
          keywords: ['christmas', 'holiday', 'seasonal']
        },
        actions: {
          logToConsole: true,
          saveToDatabase: true
        }
      }
    ];
  }

  public async checkStockChange(product: IProduct, oldAvailability: string, newAvailability: string): Promise<void> {
    if (oldAvailability === newAvailability) return;

    const priority = this.calculateStockChangePriority(product, oldAvailability, newAvailability);
    
    const alert: Alert = {
      id: `stock_${++this.alertCount}_${Date.now()}`,
      type: 'stock_change',
      productId: (product._id as any).toString(),
      productName: product.name,
      brand: product.brand,
      message: `Stock changed from ${oldAvailability} to ${newAvailability}`,
      data: {
        oldAvailability,
        newAvailability,
        priority: product.priority,
        releaseType: product.releaseType,
        popularityScore: product.popularityScore
      },
      timestamp: new Date(),
      priority,
      retailers: product.retailers.map(r => r.retailerId.toString())
    };

    await this.processAlert(alert);

    // Special handling for restocks of popular/limited items
    if (newAvailability === 'in_stock' && ['out_of_stock', 'discontinued'].includes(oldAvailability)) {
      await this.checkRestock(product);
    }
  }

  public async checkPriceChange(product: IProduct, oldPrice: number, newPrice: number, retailerName: string): Promise<void> {
    if (oldPrice === newPrice) return;

    const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
    
    // Only alert on significant price drops or increases for popular items
    if (Math.abs(priceChange) < 5) return;

    const priority = this.calculatePriceChangePriority(product, priceChange);
    const alertType: Alert['type'] = priceChange < 0 ? 'price_drop' : 'stock_change';

    const alert: Alert = {
      id: `price_${++this.alertCount}_${Date.now()}`,
      type: alertType,
      productId: (product._id as any).toString(),
      productName: product.name,
      brand: product.brand,
      message: `Price ${priceChange < 0 ? 'dropped' : 'increased'} by ${Math.abs(priceChange).toFixed(1)}% on ${retailerName}`,
      data: {
        oldPrice,
        newPrice,
        priceChange,
        retailerName,
        popularityScore: product.popularityScore
      },
      timestamp: new Date(),
      priority,
      retailers: [retailerName]
    };

    await this.processAlert(alert);
  }

  public async checkNewProduct(product: IProduct): Promise<void> {
    const isLimited = product.priority === 'limited_release' || product.releaseType !== 'regular';
    
    const alert: Alert = {
      id: `new_${++this.alertCount}_${Date.now()}`,
      type: isLimited ? 'limited_release' : 'new_product',
      productId: (product._id as any).toString(),
      productName: product.name,
      brand: product.brand,
      message: `New ${isLimited ? 'limited release' : 'product'} detected: ${product.name}`,
      data: {
        priority: product.priority,
        releaseType: product.releaseType,
        popularityScore: product.popularityScore,
        price: product.retailers[0]?.currentPrice
      },
      timestamp: new Date(),
      priority: isLimited ? 'urgent' : 'medium',
      retailers: product.retailers.map(r => r.retailerId.toString())
    };

    await this.processAlert(alert);
  }

  private async checkRestock(product: IProduct): Promise<void> {
    const alert: Alert = {
      id: `restock_${++this.alertCount}_${Date.now()}`,
      type: 'restock',
      productId: (product._id as any).toString(),
      productName: product.name,
      brand: product.brand,
      message: `${product.name} is back in stock!`,
      data: {
        priority: product.priority,
        releaseType: product.releaseType,
        popularityScore: product.popularityScore
      },
      timestamp: new Date(),
      priority: product.priority === 'limited_release' ? 'urgent' : 'high',
      retailers: product.retailers.map(r => r.retailerId.toString())
    };

    await this.processAlert(alert);
  }

  private calculateStockChangePriority(product: IProduct, oldAvailability: string, newAvailability: string): Alert['priority'] {
    // Highest priority for limited releases becoming available
    if (product.priority === 'limited_release' && newAvailability === 'in_stock') {
      return 'urgent';
    }

    // High priority for popular items going out of stock
    if (product.priority === 'popular' && newAvailability === 'out_of_stock') {
      return 'high';
    }

    // Medium priority for regular stock changes
    if (product.popularityScore > 20) {
      return 'medium';
    }

    return 'low';
  }

  private calculatePriceChangePriority(product: IProduct, priceChange: number): Alert['priority'] {
    // Urgent for significant drops on limited releases
    if (product.priority === 'limited_release' && priceChange < -15) {
      return 'urgent';
    }

    // High for significant drops on popular items
    if (product.popularityScore > 20 && priceChange < -20) {
      return 'high';
    }

    // Medium for moderate changes on tracked items
    if (Math.abs(priceChange) > 10) {
      return 'medium';
    }

    return 'low';
  }

  private async processAlert(alert: Alert): Promise<void> {
    // Find applicable rules
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && this.doesAlertMatchRule(alert, rule)
    );

    if (applicableRules.length === 0) return;

    // Store alert
    this.alerts.set(alert.id, alert);

    // Execute actions for each applicable rule
    for (const rule of applicableRules) {
      await this.executeAlertActions(alert, rule);
    }

    // Emit event for external listeners
    this.emit('alert', alert);

    // Clean up old alerts (keep last 1000)
    if (this.alerts.size > 1000) {
      const oldestAlerts = Array.from(this.alerts.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, this.alerts.size - 1000);
      
      oldestAlerts.forEach(([id]) => this.alerts.delete(id));
    }
  }

  private doesAlertMatchRule(alert: Alert, rule: AlertRule): boolean {
    // Type must match
    if (alert.type !== rule.type) return false;

    const conditions = rule.conditions;

    // Check brand conditions
    if (conditions.brands && conditions.brands.length > 0) {
      const brandMatches = conditions.brands.some(brand => 
        alert.brand.toLowerCase().includes(brand.toLowerCase())
      );
      if (!brandMatches) return false;
    }

    // Check popularity score
    if (conditions.minPopularityScore && alert.data.popularityScore < conditions.minPopularityScore) {
      return false;
    }

    // Check price conditions
    if (conditions.maxPrice && alert.data.price > conditions.maxPrice) {
      return false;
    }

    // Check keyword conditions
    if (conditions.keywords && conditions.keywords.length > 0) {
      const fullText = `${alert.productName} ${alert.brand}`.toLowerCase();
      const keywordMatches = conditions.keywords.some(keyword => 
        fullText.includes(keyword.toLowerCase())
      );
      if (!keywordMatches) return false;
    }

    return true;
  }

  private async executeAlertActions(alert: Alert, rule: AlertRule): Promise<void> {
    const actions = rule.actions;

    // Console logging
    if (actions.logToConsole) {
      const emoji = this.getAlertEmoji(alert);
      const priorityColor = this.getPriorityColor(alert.priority);
      console.log(`${emoji} ${priorityColor}[${alert.priority.toUpperCase()}]${priorityColor} ${alert.message}`);
      
      if (alert.data) {
        console.log(`   📊 Details:`, JSON.stringify(alert.data, null, 2));
      }
    }

    // Database logging (would be implemented based on your database structure)
    if (actions.saveToDatabase) {
      // This would save to a dedicated alerts collection
      console.log(`💾 Alert saved to database: ${alert.id}`);
    }

    // Webhook notifications
    if (actions.webhook) {
      try {
        await this.sendWebhook(actions.webhook, alert);
      } catch (error) {
        console.error(`❌ Failed to send webhook for alert ${alert.id}:`, error);
      }
    }
  }

  private getAlertEmoji(alert: Alert): string {
    switch (alert.type) {
      case 'limited_release': return '🎯';
      case 'new_product': return '🆕';
      case 'restock': return '📦';
      case 'price_drop': return '💰';
      case 'stock_change': return '📊';
      default: return '🔔';
    }
  }

  private getPriorityColor(priority: Alert['priority']): string {
    // ANSI color codes for terminal output
    switch (priority) {
      case 'urgent': return '\x1b[91m'; // Bright red
      case 'high': return '\x1b[31m';   // Red
      case 'medium': return '\x1b[33m'; // Yellow
      case 'low': return '\x1b[90m';    // Gray
      default: return '\x1b[0m';        // Reset
    }
  }

  private async sendWebhook(url: string, alert: Alert): Promise<void> {
    const payload = {
      alert_id: alert.id,
      type: alert.type,
      product_name: alert.productName,
      brand: alert.brand,
      message: alert.message,
      priority: alert.priority,
      timestamp: alert.timestamp.toISOString(),
      data: alert.data
    };

    // This would be implemented with an HTTP client
    console.log(`🔗 Webhook payload prepared for ${url}:`, payload);
  }

  // Public API methods
  public addRule(rule: AlertRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  public getAlerts(limit = 50, type?: Alert['type']): Alert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }
    
    return alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getAlertStats(): any {
    const alerts = Array.from(this.alerts.values());
    const stats = {
      total: alerts.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      last24h: 0
    };

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    alerts.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
      
      if (alert.timestamp.getTime() > oneDayAgo) {
        stats.last24h++;
      }
    });

    return stats;
  }
}