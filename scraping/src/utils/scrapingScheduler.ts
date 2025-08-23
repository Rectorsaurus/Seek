import cron from 'node-cron';
import { Product, Retailer } from '../models';
import { SmokingpipesScraper } from '../scrapers/SmokingpipesScraper';
import { CountrySquireScraper } from '../scrapers/CountrySquireScraper';
import { ProductClassifier } from './productClassifier';
import { DatabaseManager } from './database';

export interface ScheduledScrapeTask {
  id: string;
  retailerId: string;
  priority: 'limited_release' | 'seasonal' | 'popular' | 'standard' | 'discontinued';
  frequency: number; // minutes
  lastRun?: Date;
  nextRun: Date;
  productIds?: string[];
}

export class ScrapingScheduler {
  private static instance: ScrapingScheduler;
  private tasks: Map<string, ScheduledScrapeTask> = new Map();
  private cronJobs: Map<string, any> = new Map();
  private classifier: ProductClassifier;
  private isRunning = false;

  private constructor() {
    this.classifier = ProductClassifier.getInstance();
  }

  public static getInstance(): ScrapingScheduler {
    if (!ScrapingScheduler.instance) {
      ScrapingScheduler.instance = new ScrapingScheduler();
    }
    return ScrapingScheduler.instance;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('🚀 Starting dynamic scraping scheduler...');
    this.isRunning = true;
    
    await this.initializeTasks();
    this.startCronJobs();
    
    // Schedule task optimization every hour
    cron.schedule('0 * * * *', () => this.optimizeTasks());
    
    console.log('✅ Scraping scheduler started successfully');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('⏹️ Stopping scraping scheduler...');
    this.isRunning = false;
    
    // Stop all cron jobs
    this.cronJobs.forEach(job => job.destroy());
    this.cronJobs.clear();
    this.tasks.clear();
    
    console.log('✅ Scraping scheduler stopped');
  }

  private async initializeTasks(): Promise<void> {
    const retailers = await Retailer.find({ isActive: true });
    
    for (const retailer of retailers) {
      // Create tasks for different priority levels
      const priorities: Array<'limited_release' | 'seasonal' | 'popular' | 'standard'> = 
        ['limited_release', 'seasonal', 'popular', 'standard'];
      
      for (const priority of priorities) {
        const frequency = this.classifier.getScrapingFrequencyMinutes(priority);
        const task: ScheduledScrapeTask = {
          id: `${(retailer._id as any)}_${priority}`,
          retailerId: (retailer._id as any).toString(),
          priority,
          frequency,
          nextRun: new Date(Date.now() + frequency * 60 * 1000)
        };
        
        // Get products for this priority
        task.productIds = await this.getProductIdsByPriority((retailer._id as any).toString(), priority);
        
        this.tasks.set(task.id, task);
      }
    }
  }

  private async getProductIdsByPriority(retailerId: string, priority: string): Promise<string[]> {
    const products = await Product.find(
      { 
        priority,
        'retailers.retailerId': retailerId 
      },
      '_id'
    ).limit(100); // Limit to avoid memory issues
    
    return products.map(p => (p._id as any).toString());
  }

  private startCronJobs(): void {
    // Limited release scraping - every 15 minutes during business hours (9 AM - 9 PM EST)
    cron.schedule('*/15 9-21 * * *', async () => {
      await this.executePriorityTasks('limited_release');
    });

    // Seasonal scraping - every 30 minutes during business hours
    cron.schedule('*/30 9-21 * * *', async () => {
      await this.executePriorityTasks('seasonal');
    });

    // Popular items - every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      await this.executePriorityTasks('popular');
    });

    // Standard items - daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.executePriorityTasks('standard');
    });

    // Quick availability checks for limited releases every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.quickAvailabilityCheck();
    });
  }

  private async executePriorityTasks(priority: string): Promise<void> {
    const now = new Date();
    const tasksToRun = Array.from(this.tasks.values())
      .filter(task => task.priority === priority && task.nextRun <= now);

    if (tasksToRun.length === 0) return;

    console.log(`🔄 Running ${tasksToRun.length} ${priority} scraping tasks`);

    for (const task of tasksToRun) {
      try {
        await this.executeScrapeTask(task);
        task.lastRun = now;
        task.nextRun = new Date(now.getTime() + task.frequency * 60 * 1000);
      } catch (error) {
        console.error(`❌ Error executing task ${task.id}:`, error);
        // Increase frequency slightly on error (backoff)
        task.nextRun = new Date(now.getTime() + (task.frequency * 1.5) * 60 * 1000);
      }
    }
  }

  private async executeScrapeTask(task: ScheduledScrapeTask): Promise<void> {
    const retailer = await Retailer.findById(task.retailerId);
    if (!retailer) {
      console.error(`❌ Retailer not found: ${task.retailerId}`);
      return;
    }

    const scraper = this.createScraper(retailer);
    if (!scraper) return;

    try {
      await scraper.initialize();

      if (task.priority === 'limited_release' && task.productIds?.length) {
        // For limited releases, scrape specific products
        await this.scrapeSpecificProducts(scraper, task.productIds);
      } else {
        // For others, scrape product listing
        const products = await scraper.scrapeProducts();
        console.log(`📊 Scraped ${products.length} products for ${retailer.name} (${task.priority})`);
        await this.processScrapedProducts(products, retailer);
      }

    } finally {
      await scraper.cleanup();
    }
  }

  private async scrapeSpecificProducts(scraper: any, productIds: string[]): Promise<void> {
    const products = await Product.find({ _id: { $in: productIds } }).limit(20);
    
    for (const product of products) {
      const retailerProduct = product.retailers.find(r => r.retailerId.toString() === scraper.retailer._id.toString());
      if (!retailerProduct?.productUrl) continue;

      try {
        const scrapedProduct = await scraper.scrapeProduct(retailerProduct.productUrl);
        if (scrapedProduct) {
          await this.updateProductFromScrapedData(product, scrapedProduct, scraper.retailer);
        }
      } catch (error) {
        console.error(`❌ Error scraping specific product ${product.name}:`, error);
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }
  }

  private createScraper(retailer: any): any {
    if (retailer.name.toLowerCase().includes('smokingpipes')) {
      return new SmokingpipesScraper(retailer);
    } else if (retailer.name.toLowerCase().includes('country squire')) {
      return new CountrySquireScraper(retailer);
    }
    return null;
  }

  private async processScrapedProducts(products: any[], retailer: any): Promise<void> {
    for (const scrapedProduct of products) {
      try {
        let existingProduct = await Product.findOne({ 
          name: new RegExp(scrapedProduct.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          brand: new RegExp(scrapedProduct.brand?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '', 'i')
        });

        if (existingProduct) {
          await this.updateProductFromScrapedData(existingProduct, scrapedProduct, retailer);
        } else {
          await this.createNewProduct(scrapedProduct, retailer);
        }
      } catch (error) {
        console.error(`❌ Error processing product ${scrapedProduct.name}:`, error);
      }
    }
  }

  private async updateProductFromScrapedData(product: any, scrapedData: any, retailer: any): Promise<void> {
    const retailerIndex = product.retailers.findIndex(
      (r: any) => r.retailerId.toString() === retailer._id.toString()
    );

    if (retailerIndex === -1) return;

    const oldPrice = product.retailers[retailerIndex].currentPrice;
    const oldAvailability = product.retailers[retailerIndex].availability;

    // Update retailer data
    product.retailers[retailerIndex].currentPrice = scrapedData.price;
    product.retailers[retailerIndex].availability = scrapedData.availability;
    product.retailers[retailerIndex].lastScraped = new Date();

    // Add to price history if changed
    if (oldPrice !== scrapedData.price || oldAvailability !== scrapedData.availability) {
      product.retailers[retailerIndex].priceHistory.push({
        price: scrapedData.price,
        availability: scrapedData.availability,
        date: new Date()
      });

      // Update stock change tracking
      if (oldAvailability !== scrapedData.availability) {
        product.lastStockChange = new Date();
        
        // Log significant changes
        console.log(`🔄 Stock change: ${product.name} - ${oldAvailability} → ${scrapedData.availability}`);
      }

      // Calculate price volatility
      product.priceVolatility = this.calculatePriceVolatility(product.retailers[retailerIndex].priceHistory);
    }

    // Update classification
    const classification = this.classifier.classifyProduct(scrapedData, product);
    product.priority = classification.priority;
    product.releaseType = classification.releaseType;
    product.popularityScore = classification.popularityScore;

    await product.save();

    // Adjust scraping frequency if priority changed
    await this.adjustTaskPriority(product);
  }

  private async createNewProduct(scrapedData: any, retailer: any): Promise<void> {
    const classification = this.classifier.classifyProduct(scrapedData);
    
    const newProduct = new Product({
      name: scrapedData.name,
      brand: scrapedData.brand || 'Unknown',
      description: scrapedData.description,
      category: scrapedData.category,
      tobaccoType: [scrapedData.category],
      imageUrl: scrapedData.imageUrl,
      priority: classification.priority,
      releaseType: classification.releaseType,
      popularityScore: classification.popularityScore,
      searchCount: 0,
      priceVolatility: 0,
      retailers: [{
        retailerId: retailer._id,
        productUrl: scrapedData.productUrl,
        currentPrice: scrapedData.price,
        availability: scrapedData.availability,
        lastScraped: new Date(),
        priceHistory: [{
          price: scrapedData.price,
          availability: scrapedData.availability,
          date: new Date()
        }]
      }]
    });

    await newProduct.save();
    
    // Log new limited releases
    if (classification.priority === 'limited_release') {
      console.log(`🎯 New limited release detected: ${scrapedData.name} by ${scrapedData.brand}`);
    }
  }

  private calculatePriceVolatility(priceHistory: any[]): number {
    if (priceHistory.length < 2) return 0;
    
    const prices = priceHistory.map(entry => entry.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private async adjustTaskPriority(product: any): Promise<void> {
    const retailerId = product.retailers[0]?.retailerId?.toString();
    if (!retailerId) return;

    const taskId = `${retailerId}_${product.priority}`;
    const task = this.tasks.get(taskId);
    
    if (task && !task.productIds?.includes(product._id.toString())) {
      task.productIds = task.productIds || [];
      task.productIds.push(product._id.toString());
      
      // Limit array size to prevent memory issues
      if (task.productIds.length > 100) {
        task.productIds = task.productIds.slice(-100);
      }
    }
  }

  private async quickAvailabilityCheck(): Promise<void> {
    // Quick check for limited release availability changes
    const limitedProducts = await Product.find({ 
      priority: 'limited_release',
      'retailers.availability': { $in: ['in_stock', 'limited'] }
    }).limit(10);

    for (const product of limitedProducts) {
      // This would be a lightweight check - just availability, not full scrape
      // Implementation would depend on retailer APIs or minimal page scraping
    }
  }

  private async optimizeTasks(): Promise<void> {
    console.log('🔧 Optimizing scraping tasks...');
    
    // Rebalance tasks based on recent activity
    for (const [taskId, task] of this.tasks) {
      if (task.priority === 'standard') {
        // Check if any standard products have become popular
        const products = await Product.find({ 
          _id: { $in: task.productIds },
          popularityScore: { $gte: 20 }
        });
        
        if (products.length > 0) {
          // Move these to popular category
          const popularTaskId = taskId.replace('_standard', '_popular');
          const popularTask = this.tasks.get(popularTaskId);
          if (popularTask) {
            popularTask.productIds = popularTask.productIds || [];
            popularTask.productIds.push(...products.map(p => (p._id as any).toString()));
          }
        }
      }
    }
    
    console.log('✅ Task optimization completed');
  }

  public async getSchedulerStatus(): Promise<any> {
    const taskStats = Array.from(this.tasks.values()).reduce((stats, task) => {
      stats[task.priority] = (stats[task.priority] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      isRunning: this.isRunning,
      totalTasks: this.tasks.size,
      tasksByPriority: taskStats,
      nextRuns: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        priority: task.priority,
        nextRun: task.nextRun,
        productCount: task.productIds?.length || 0
      })).sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime()).slice(0, 10)
    };
  }
}