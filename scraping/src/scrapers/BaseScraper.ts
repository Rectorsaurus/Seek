import { Browser, Page, chromium } from 'playwright';
import { IRetailer, IScrapingConfig } from '../models';

export interface ScrapedProduct {
  name: string;
  brand?: string;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  productUrl: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected retailer: IRetailer;
  protected config: IScrapingConfig;
  protected requestCount = 0;
  protected lastRequestTime = 0;
  protected rateLimitDelay = 2000;
  protected maxRetries = 3;

  constructor(retailer: IRetailer) {
    this.retailer = retailer;
    this.config = retailer.scrapingConfig;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Randomize user agent slightly
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const selectedUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': selectedUA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Set viewport to common resolution
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async intelligentDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Calculate adaptive delay based on time of day and request count
    let baseDelay = this.rateLimitDelay;
    
    // Increase delay during peak hours (9 AM - 5 PM EST)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      baseDelay *= 1.5;
    }
    
    // Add randomization to appear more human-like
    const randomDelay = Math.random() * 1000 + 500;
    const totalDelay = baseDelay + randomDelay;
    
    // Ensure minimum delay between requests
    const remainingDelay = Math.max(0, totalDelay - timeSinceLastRequest);
    
    if (remainingDelay > 0) {
      await this.delay(remainingDelay);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    
    // Implement exponential backoff after many requests
    if (this.requestCount > 50) {
      const backoffDelay = Math.min(30000, Math.pow(2, Math.floor(this.requestCount / 10)) * 1000);
      await this.delay(backoffDelay);
    }
  }

  protected async safeNavigate(url: string, options: any = {}): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.intelligentDelay();
        
        const defaultOptions = {
          waitUntil: 'networkidle',
          timeout: 30000
        };
        
        await this.page.goto(url, { ...defaultOptions, ...options });
        return true;
        
      } catch (error) {
        retries++;
        console.warn(`🔄 Navigation retry ${retries}/${this.maxRetries} for ${url}: ${error}`);
        
        if (retries >= this.maxRetries) {
          console.error(`❌ Failed to navigate to ${url} after ${this.maxRetries} retries`);
          return false;
        }
        
        // Exponential backoff for retries
        await this.delay(Math.pow(2, retries) * 1000);
      }
    }
    
    return false;
  }

  protected async detectPageChanges(url: string): Promise<{ hasChanged: boolean; checksum?: string }> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      const success = await this.safeNavigate(url);
      if (!success) return { hasChanged: false };
      
      // Get page content for change detection
      const content = await this.page.content();
      
      // Simple checksum using content length and hash
      const checksum = this.generateChecksum(content);
      
      return { hasChanged: true, checksum };
      
    } catch (error) {
      console.error(`❌ Error detecting page changes for ${url}:`, error);
      return { hasChanged: false };
    }
  }

  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16) + '_' + content.length;
  }

  protected isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday to Friday, 9 AM to 9 PM EST
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 21;
  }

  protected shouldThrottle(): boolean {
    return this.requestCount > 100 || !this.isBusinessHours();
  }

  protected parsePrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(',', ''));
    return isNaN(price) ? 0 : price;
  }

  protected parseAvailability(availabilityText: string): 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' {
    const text = availabilityText.toLowerCase();
    
    if (text.includes('in stock') || text.includes('available')) {
      return 'in_stock';
    } else if (text.includes('out of stock') || text.includes('sold out')) {
      return 'out_of_stock';
    } else if (text.includes('limited') || text.includes('few left')) {
      return 'limited';
    } else if (text.includes('discontinued')) {
      return 'discontinued';
    }
    
    return 'in_stock'; // default assumption
  }

  protected normalizeProductName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '');
  }

  protected validateProductName(name: string, selector: string = ''): boolean {
    // Check for suspiciously long names that indicate concatenation issues
    if (name.length > 100) {
      console.log(`WARNING: Very long product name (${name.length} chars) found with selector "${selector}"`);
      console.log(`Name preview: ${name.substring(0, 100)}...`);
      return false;
    }
    
    // Ensure we have a meaningful name
    return name.length > 5;
  }

  protected inferCategory(name: string, description?: string, defaultCategory: 'bulk' | 'tinned' = 'tinned'): 'aromatic' | 'english' | 'virginia' | 'burley' | 'latakia' | 'oriental' | 'perique' | 'cavendish' | 'bulk' | 'tinned' {
    const text = `${name} ${description || ''}`.toLowerCase();

    // First check for specific blend/product patterns that override general categories
    
    // Specific Perique blends (check before Virginia since many are VA/PER)
    if (text.includes('perique') || text.includes('louisiana') || text.includes('vaper') ||
        text.includes('va/per') || text.includes('virginia perique') || text.includes('escudo')) {
      return 'perique';
    }

    // Oriental blends (check before English since oriental can be in English blends)
    if (text.includes('oriental mixture') || text.includes('turkish') || text.includes('smyrna') ||
        text.includes('drama') || text.includes('izmir') || text.includes('macedonian')) {
      return 'oriental';
    }

    // Aromatic indicators (flavored tobaccos)
    if (text.includes('aromatic') || text.includes('vanilla') || text.includes('cherry') || 
        text.includes('caramel') || text.includes('rum') || text.includes('whiskey') ||
        text.includes('chocolate') || text.includes('honey') || text.includes('maple') ||
        text.includes('cognac') || text.includes('amaretto') || text.includes('irish cream') ||
        text.includes('captain black') || text.includes('lane 1-q') || text.includes('borkum riff')) {
      return 'aromatic';
    }

    // English blends (Latakia-based) - check after oriental and perique
    if (text.includes('english') || text.includes('latakia') || text.includes('morning pipe') ||
        text.includes('nightcap') || text.includes('early morning') || text.includes('london mixture') ||
        text.includes('balkan') || text.includes('cyprus latakia') ||
        text.includes('squadron leader') || text.includes('dunhill') || text.includes('gl pease')) {
      return 'english';
    }

    // Virginia-based blends (check after perique)
    if (text.includes('virginia') || text.includes('bright') || text.includes('flake') ||
        text.includes('red virginia') || text.includes('golden virginia') || text.includes('virginia blend') ||
        text.includes('orlik') || text.includes('capstan')) {
      return 'virginia';
    }

    // Navy blends are typically Virginia-Perique, but if no perique mentioned, treat as Virginia
    if (text.includes('navy')) {
      return 'virginia';
    }

    // Burley-based blends
    if (text.includes('burley') || text.includes('white burley') || text.includes('kentucky') ||
        text.includes('carter hall') || text.includes('prince albert') || text.includes('codger')) {
      return 'burley';
    }

    // Cavendish
    if (text.includes('cavendish') || text.includes('black cavendish') || text.includes('danish')) {
      return 'cavendish';
    }

    // Latakia-forward blends (separate from English)
    if (text.includes('latakia mixture') || text.includes('cyprus') || text.includes('syrian latakia')) {
      return 'latakia';
    }

    // Determine bulk vs tinned based on packaging/size indicators only if no blend type identified
    if (text.includes('bulk') || text.includes('ounce') || text.includes('oz') || text.includes('lb') ||
        text.includes('pound') || text.includes('pouch')) {
      return 'bulk';
    }

    if (text.includes('tin') || text.includes('50g') || text.includes('100g') || text.includes('2oz') ||
        text.includes('gram') || text.includes('canister')) {
      return 'tinned';
    }

    // Use retailer-appropriate default
    return defaultCategory;
  }

  abstract scrapeProducts(): Promise<ScrapedProduct[]>;
  abstract scrapeProduct(url: string): Promise<ScrapedProduct | null>;
}