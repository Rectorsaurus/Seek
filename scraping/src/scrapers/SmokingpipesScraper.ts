import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './BaseScraper';
import { IRetailer } from '../models';

export class SmokingpipesScraper extends BaseScraper {
  constructor(retailer: IRetailer) {
    super(retailer);
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    const products: ScrapedProduct[] = [];
    
    try {
      console.log(`Navigating to ${this.config.productListUrl}`);
      await this.page.goto(this.config.productListUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      if (this.config.waitForSelector) {
        await this.page.waitForSelector(this.config.waitForSelector, { timeout: 10000 });
      }

      await this.delay(this.config.delay);

      const content = await this.page.content();
      const $ = cheerio.load(content);

      // Try multiple selectors in case the primary one doesn't work
      const productSelectors = this.config.productListSelector.split(', ');
      let productsFound = false;
      
      for (const selector of productSelectors) {
        const elements = $(selector.trim());
        console.log(`Trying selector "${selector}": found ${elements.length} elements`);
        
        if (elements.length > 0) {
          productsFound = true;
          elements.each((index, element) => {
            try {
              const $element = $(element);
              
              // Try multiple name selectors
              const nameSelectors = this.config.nameSelector.split(', ');
              let name = '';
              for (const nameSelector of nameSelectors) {
                const foundElement = $element.find(nameSelector.trim());
                name = foundElement.text().trim();
                
                // Debug: log suspicious long names and skip them
                if (name.length > 100) {
                  console.log(`WARNING: Very long product name (${name.length} chars) found with selector "${nameSelector}"`);
                  console.log(`Name preview: ${name.substring(0, 100)}...`);
                  continue; // Skip this selector and try the next one
                }
                
                if (name && name.length > 5) break; // Ensure we have a meaningful name
              }
              
              // Try multiple price selectors
              const priceSelectors = this.config.priceSelector.split(', ');
              let priceText = '';
              for (const priceSelector of priceSelectors) {
                priceText = $element.find(priceSelector.trim()).text().trim();
                if (priceText && priceText.includes('$')) break;
              }
              const price = this.parsePrice(priceText);
              
              // Try multiple link selectors
              const linkSelectors = this.config.productLinkSelector.split(', ');
              let productLink = '';
              for (const linkSelector of linkSelectors) {
                productLink = $element.find(linkSelector.trim()).attr('href') || '';
                if (productLink) break;
              }
          
              if (!name || !price || !productLink) {
                return; // skip incomplete products
              }

              const productUrl = productLink.startsWith('http') 
                ? productLink 
                : `${this.retailer.baseUrl}${productLink}`;

              let brand = '';
              if (this.config.brandSelector) {
                brand = $element.find(this.config.brandSelector).text().trim();
              }
              if (!brand) {
                brand = this.extractBrandFromName(name);
              }

              const description = this.config.descriptionSelector 
                ? $element.find(this.config.descriptionSelector).text().trim()
                : undefined;

              const imageElement = $element.find(this.config.imageSelector);
              const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

              const availabilityText = this.config.availabilitySelector 
                ? $element.find(this.config.availabilitySelector).text().trim()
                : 'in stock';

              const availability = this.parseAvailability(availabilityText);
              const category = this.inferCategory(name, description, 'tinned');

              products.push({
                name: this.normalizeSmokingpipesProductName(name),
                brand,
                price,
                availability,
                productUrl,
                description,
                imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${this.retailer.baseUrl}${imageUrl}`) : undefined,
                category
              });

            } catch (error) {
              console.error(`Error parsing product at index ${index}:`, error);
            }
          });
          break; // Stop after finding products with the first working selector
        }
      }
      
      if (!productsFound) {
        console.log('No products found with any selector. Page content sample:');
        console.log(content.substring(0, 1000));
      }

    } catch (error) {
      console.error('Error scraping products:', error);
    }

    console.log(`Scraped ${products.length} products from ${this.retailer.name}`);
    return products;
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await this.delay(this.config.delay);

      const content = await this.page.content();
      const $ = cheerio.load(content);

      const name = $(this.config.nameSelector).text().trim();
      const priceText = $(this.config.priceSelector).text().trim();
      const price = this.parsePrice(priceText);

      if (!name || !price) {
        return null;
      }

      let brand = '';
      if (this.config.brandSelector) {
        brand = $(this.config.brandSelector).text().trim();
      }
      if (!brand) {
        brand = this.extractBrandFromName(name);
      }

      const description = this.config.descriptionSelector 
        ? $(this.config.descriptionSelector).text().trim()
        : undefined;

      const imageElement = $(this.config.imageSelector);
      const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

      const availabilityText = this.config.availabilitySelector 
        ? $(this.config.availabilitySelector).text().trim()
        : 'in stock';

      const availability = this.parseAvailability(availabilityText);
      const category = this.inferCategory(name, description, 'tinned');

      return {
        name: this.normalizeSmokingpipesProductName(name),
        brand,
        price,
        availability,
        productUrl: url,
        description,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${this.retailer.baseUrl}${imageUrl}`) : undefined,
        category
      };

    } catch (error) {
      console.error(`Error scraping product ${url}:`, error);
      return null;
    }
  }

  private normalizeSmokingpipesProductName(name: string): string {
    // First normalize using base class method
    let cleanName = this.normalizeProductName(name);
    
    // Remove common Smokingpipes.com patterns:
    // - Weight indicators (50g, 100g, 1oz, 2oz, etc.)
    cleanName = cleanName.replace(/\s+\d+g\b/gi, '');
    cleanName = cleanName.replace(/\s+\d+oz\b/gi, '');
    cleanName = cleanName.replace(/\s+\d+\s?lb\b/gi, '');
    
    // - Product codes (patterns like 003-057-0003)
    cleanName = cleanName.replace(/\s+\d{3}-\d{3}-\d{4}/g, '');
    
    // - Generic product codes (3+ digits followed by hyphens and more digits)
    cleanName = cleanName.replace(/\s+\d{3,}[-\d]*$/g, '');
    
    // - Additional size patterns (175oz, 14oz, etc.)
    cleanName = cleanName.replace(/\s+\d+oz$/gi, '');
    cleanName = cleanName.replace(/\s+\d+g$/gi, '');
    
    // - Size indicators in parentheses or at end
    cleanName = cleanName.replace(/\s*\([^)]*\d+g[^)]*\)$/gi, '');
    cleanName = cleanName.replace(/\s*\([^)]*\d+oz[^)]*\)$/gi, '');
    
    // - Clean up multiple spaces and trim
    cleanName = cleanName.replace(/\s+/g, ' ').trim();
    
    return cleanName;
  }

  private extractBrandFromName(name: string): string {
    const commonBrands = [
      'Peterson', 'Dunhill', 'McClelland', 'Rattray', 'Solani', 
      'Sutliff', 'Lane', 'Captain Black', 'Borkum Riff', 'Cornell & Diehl',
      'Mac Baren', 'Erik Stokkebye', 'Larsen', 'Robert Lewis',
      'Missouri Meerschaum', 'Royal Comfort', 'Drew Estate', 'Ashton',
      'Davidoff', 'CAO', 'H. Upmann', 'Frog Morton', 'Seattle Pipe Club',
      'C&D', 'GL Pease', 'Esoterica', 'McCranie', 'Orlik', 'Altadis',
      'Samuel Gawith', 'Gawith Hoggarth', 'Wessex', 'Amphora', 'Villiger',
      'Peter Stokkebye', 'Three Nuns', 'Balkan Sobranie', 'John Cotton',
      'Dunhill', 'Mixture 79', 'Carter Hall', 'Prince Albert', '1792',
      'Escudo', '965', 'Squadron Leader', 'Nightcap', 'Early Morning'
    ];

    const lowerName = name.toLowerCase();
    
    // First try exact brand matches (case insensitive)
    for (const brand of commonBrands) {
      if (lowerName.includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Handle special numeric brands first
    if (/^1792\b/i.test(name)) return '1792';
    if (/^965\b/i.test(name)) return '965';
    if (/^\d+\s*(mixture|blend)/i.test(name)) {
      const match = name.match(/^(\d+)/);
      if (match) return match[1];
    }
    
    // Clean the name first to better extract brand
    let cleanName = name.trim();
    
    // Remove trailing weight/size but preserve leading numbers that might be brands
    cleanName = cleanName.replace(/\s*\d+g?\s*$/, ''); // Remove trailing weight/size
    
    // Split into words and look for brand patterns
    const words = cleanName.split(/\s+/).filter(word => word.length > 1);
    
    if (words.length > 0) {
      // Try first word as brand
      const firstWord = words[0];
      if (firstWord.length > 2 && /^[A-Za-z]/.test(firstWord)) {
        // Capitalize properly
        return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      }
      
      // Try first two words as brand (for brands like "Mac Baren", "Captain Black")
      if (words.length > 1) {
        const twoWords = `${words[0]} ${words[1]}`;
        const lowerTwoWords = twoWords.toLowerCase();
        
        // Check common two-word brands
        const twoWordBrands = [
          'Captain Black', 'Mac Baren', 'Cornell & Diehl', 'Samuel Gawith',
          'Gawith Hoggarth', 'Drew Estate', 'Seattle Pipe Club', 'Peter Stokkebye',
          'GL Pease', 'Three Nuns', 'Balkan Sobranie', 'John Cotton',
          'Carter Hall', 'Prince Albert', 'Royal Comfort', 'Mixture 79'
        ];
        
        for (const brand of twoWordBrands) {
          if (lowerTwoWords === brand.toLowerCase()) {
            return brand;
          }
        }
        
        // Return capitalized two words if they look like a brand
        if (/^[A-Za-z]+\s[A-Za-z]+$/.test(twoWords)) {
          return twoWords.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }
      
      // Fallback to first word, properly capitalized
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    }

    return 'Unknown';
  }

}