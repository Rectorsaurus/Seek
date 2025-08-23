import dotenv from 'dotenv';
import { DatabaseManager } from './utils/database';
import { DataProcessor } from './utils/dataProcessor';
import { Retailer } from './models';
import { SmokingpipesScraper, CountrySquireScraper, BaseScraper } from './scrapers';

dotenv.config();

class ScrapingService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    await this.dbManager.connect();
  }

  async shutdown(): Promise<void> {
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

  async getStats(): Promise<void> {
    const stats = await DataProcessor.getScrapingStats();
    
    console.log('\n=== Scraping Statistics ===');
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`Total Retailers: ${stats.totalRetailers}`);
    
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
        console.log('Usage: npm run scrape [all|stats|smokingpipes|countrysquire]');
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