import dotenv from 'dotenv';
import { DatabaseManager } from './utils/database';
import { DataProcessor } from './utils/dataProcessor';
import { ScrapingScheduler } from './utils/scrapingScheduler';
import { AlertSystem } from './utils/alertSystem';
import { ProductClassifier } from './utils/productClassifier';
import { Retailer } from './models';
import { SmokingpipesScraper, CountrySquireScraper, BaseScraper } from './scrapers';

dotenv.config();

class ScrapingService {
  private dbManager: DatabaseManager;
  private scheduler: ScrapingScheduler;
  private alertSystem: AlertSystem;
  private classifier: ProductClassifier;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.scheduler = ScrapingScheduler.getInstance();
    this.alertSystem = AlertSystem.getInstance();
    this.classifier = ProductClassifier.getInstance();
  }

  async initialize(): Promise<void> {
    await this.dbManager.connect();
    
    // Setup alert system listeners
    this.alertSystem.on('alert', (alert) => {
      console.log(`🚨 Alert triggered: ${alert.message}`);
    });
  }

  async shutdown(): Promise<void> {
    await this.scheduler.stop();
    await this.dbManager.disconnect();
  }

  async scrapeAllRetailers(): Promise<void> {
    console.log('Starting scraping process for all retailers...');
    
    const retailers = await Retailer.find({ isActive: true });
    
    if (retailers.length === 0) {
      console.log('No active retailers found');
      return;
    }

    console.log(`Found ${retailers.length} active retailers`);

    for (const retailer of retailers) {
      try {
        await this.scrapeRetailer(retailer);
      } catch (error) {
        console.error(`Failed to scrape ${retailer.name}:`, error);
      }
    }

    console.log('Completed scraping all retailers');
  }

  async scrapeRetailer(retailer: any): Promise<void> {
    console.log(`Starting scraping for ${retailer.name}...`);
    
    let scraper: BaseScraper;

    // Initialize appropriate scraper based on retailer name
    if (retailer.name.toLowerCase().includes('smokingpipes')) {
      scraper = new SmokingpipesScraper(retailer);
    } else if (retailer.name.toLowerCase().includes('country squire')) {
      scraper = new CountrySquireScraper(retailer);
    } else {
      console.log(`No specific scraper found for ${retailer.name}, using base scraper`);
      return;
    }

    try {
      await scraper.initialize();
      
      console.log(`Scraping products for ${retailer.name}...`);
      const scrapedProducts = await scraper.scrapeProducts();
      
      console.log(`Found ${scrapedProducts.length} products, processing...`);
      await DataProcessor.processScrapedProducts(scrapedProducts, retailer);
      
      console.log(`Successfully processed ${scrapedProducts.length} products for ${retailer.name}`);
      
    } catch (error) {
      console.error(`Error scraping ${retailer.name}:`, error);
    } finally {
      await scraper.cleanup();
    }
  }

  async scrapeLimitedReleases(): Promise<void> {
    console.log('🎯 Starting limited release focused scraping...');
    
    const retailers = await Retailer.find({ isActive: true });
    let totalLimitedFound = 0;
    
    for (const retailer of retailers) {
      let scraper: BaseScraper;

      if (retailer.name.toLowerCase().includes('smokingpipes')) {
        scraper = new SmokingpipesScraper(retailer);
      } else if (retailer.name.toLowerCase().includes('country squire')) {
        scraper = new CountrySquireScraper(retailer);
      } else {
        continue;
      }

      try {
        await scraper.initialize();
        const scrapedProducts = await scraper.scrapeProducts();
        
        // Filter for limited releases
        const limitedReleases = this.classifier.identifyLimitedReleases(scrapedProducts);
        
        if (limitedReleases.length > 0) {
          console.log(`🎯 Found ${limitedReleases.length} limited releases from ${retailer.name}`);
          
          for (const product of limitedReleases) {
            console.log(`  • ${product.brand} - ${product.name} ($${product.price})`);
            
            // Check if this is a new limited release
            if (this.classifier.detectNewLimitedRelease(product)) {
              console.log(`    🚨 New limited release detected!`);
            }
          }
          
          await DataProcessor.processScrapedProducts(limitedReleases, retailer);
          totalLimitedFound += limitedReleases.length;
        }
        
      } catch (error) {
        console.error(`❌ Error scraping limited releases from ${retailer.name}:`, error);
      } finally {
        await scraper.cleanup();
      }
    }
    
    console.log(`✅ Limited release scan complete. Found ${totalLimitedFound} limited releases total.`);
  }

  async getStats(): Promise<void> {
    const stats = await DataProcessor.getScrapingStats();
    const schedulerStatus = await this.scheduler.getSchedulerStatus();
    const alertStats = this.alertSystem.getAlertStats();
    
    console.log('\n=== Scraping Statistics ===');
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`Total Retailers: ${stats.totalRetailers}`);
    
    console.log('\n=== Scheduler Status ===');
    console.log(`Running: ${schedulerStatus.isRunning}`);
    console.log(`Total Tasks: ${schedulerStatus.totalTasks}`);
    console.log(`Tasks by Priority:`);
    for (const [priority, count] of Object.entries(schedulerStatus.tasksByPriority)) {
      console.log(`  ${priority}: ${count}`);
    }
    
    console.log('\n=== Alert Statistics ===');
    console.log(`Total Alerts: ${alertStats.total}`);
    console.log(`Alerts (Last 24h): ${alertStats.last24h}`);
    console.log(`By Type:`);
    for (const [type, count] of Object.entries(alertStats.byType)) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`By Priority:`);
    for (const [priority, count] of Object.entries(alertStats.byPriority)) {
      console.log(`  ${priority}: ${count}`);
    }
    
    console.log('\nLast Scraped Dates:');
    for (const [retailer, date] of Object.entries(stats.lastScrapedDates)) {
      console.log(`  ${retailer}: ${date ? date.toISOString() : 'Never'}`);
    }
    
    console.log('\nProducts per Retailer:');
    for (const [retailer, count] of Object.entries(stats.productsPerRetailer)) {
      console.log(`  ${retailer}: ${count} products`);
    }
  }
}

// Main execution
async function main() {
  const service = new ScrapingService();
  
  try {
    await service.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'all':
        await service.scrapeAllRetailers();
        break;
      case 'stats':
        await service.getStats();
        break;
      case 'scheduler':
        console.log('🚀 Starting dynamic scraping scheduler...');
        await (service as any).scheduler.start();
        // Keep running until interrupted
        process.on('SIGINT', async () => {
          console.log('\n⏹️ Stopping scheduler...');
          await service.shutdown();
          process.exit(0);
        });
        // Keep the process alive
        setInterval(() => {}, 1000);
        break;
      case 'limited':
        await service.scrapeLimitedReleases();
        break;
      case 'alerts':
        const recentAlerts = (service as any).alertSystem.getAlerts(20);
        console.log('\n=== Recent Alerts ===');
        recentAlerts.forEach((alert: any) => {
          const emoji = alert.type === 'limited_release' ? '🎯' : '🔔';
          console.log(`${emoji} [${alert.priority.toUpperCase()}] ${alert.message}`);
          console.log(`   📅 ${alert.timestamp.toISOString()}`);
        });
        break;
      case 'smokingpipes':
        const smokingpipesRetailer = await Retailer.findOne({ name: /smokingpipes/i });
        if (smokingpipesRetailer) {
          await service.scrapeRetailer(smokingpipesRetailer);
        } else {
          console.log('Smokingpipes retailer not found');
        }
        break;
      case 'countrysquire':
        const countrySquireRetailer = await Retailer.findOne({ name: /country squire/i });
        if (countrySquireRetailer) {
          await service.scrapeRetailer(countrySquireRetailer);
        } else {
          console.log('Country Squire retailer not found');
        }
        break;
      default:
        console.log('Usage: npm run scrape [all|stats|scheduler|limited|alerts|smokingpipes|countrysquire]');
        break;
    }
    
  } catch (error) {
    console.error('Scraping service error:', error);
  } finally {
    await service.shutdown();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}