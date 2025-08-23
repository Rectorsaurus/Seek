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

  constructor(retailer: IRetailer) {
    this.retailer = retailer;
    this.config = retailer.scrapingConfig;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
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