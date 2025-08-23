import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './BaseScraper';
import { IRetailer } from '../models';

export class CountrySquireScraper extends BaseScraper {
  constructor(retailer: IRetailer) {
    super(retailer);
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    const products: ScrapedProduct[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    try {
      while (hasMorePages && currentPage <= 10) { // Limit to 10 pages max
        const pageUrl = `${this.config.productListUrl}?page=${currentPage}`;
        console.log(`Scraping page ${currentPage}: ${pageUrl}`);

        await this.page.goto(pageUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        if (this.config.waitForSelector) {
          await this.page.waitForSelector(this.config.waitForSelector, { timeout: 10000 });
        }

        await this.delay(this.config.delay);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        const pageProducts = $(this.config.productListSelector);
        
        if (pageProducts.length === 0) {
          hasMorePages = false;
          break;
        }

        pageProducts.each((index, element) => {
          try {
            const $element = $(element);
            
            // Try multiple name selectors with validation
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
            const priceText = $element.find(this.config.priceSelector).text().trim();
            const price = this.parsePrice(priceText);
            const productLink = $element.find(this.config.productLinkSelector).attr('href');
            
            if (!name || !price || !productLink) {
              return; // skip incomplete products
            }

            const productUrl = productLink.startsWith('http') 
              ? productLink 
              : `${this.retailer.baseUrl}${productLink}`;

            // Country Squire specific brand extraction
            const brand = this.extractBrandFromCountrySquire(name, $element);

            const description = this.config.descriptionSelector 
              ? $element.find(this.config.descriptionSelector).text().trim()
              : undefined;

            const imageElement = $element.find(this.config.imageSelector);
            const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

            const availabilityText = this.config.availabilitySelector 
              ? $element.find(this.config.availabilitySelector).text().trim()
              : 'in stock';

            const availability = this.parseAvailability(availabilityText);
            const category = this.inferCategory(name, description, 'bulk');

            products.push({
              name: this.normalizeProductName(name),
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

        currentPage++;
        
        // Check if there's a next page button
        const nextPageExists = $('.next').length > 0 || $('.pagination .next').length > 0;
        if (!nextPageExists) {
          hasMorePages = false;
        }
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

      // Try multiple name selectors with validation
      const nameSelectors = this.config.nameSelector.split(', ');
      let name = '';
      for (const nameSelector of nameSelectors) {
        const foundElement = $(nameSelector.trim());
        name = foundElement.text().trim();
        
        // Debug: log suspicious long names and skip them
        if (name.length > 100) {
          console.log(`WARNING: Very long product name (${name.length} chars) found with selector "${nameSelector}"`);
          console.log(`Name preview: ${name.substring(0, 100)}...`);
          continue; // Skip this selector and try the next one
        }
        
        if (name && name.length > 5) break; // Ensure we have a meaningful name
      }
      const priceText = $(this.config.priceSelector).text().trim();
      const price = this.parsePrice(priceText);

      if (!name || !price) {
        return null;
      }

      const brand = this.extractBrandFromCountrySquire(name, $('body'));

      const description = this.config.descriptionSelector 
        ? $(this.config.descriptionSelector).text().trim()
        : undefined;

      const imageElement = $(this.config.imageSelector);
      const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

      const availabilityText = this.config.availabilitySelector 
        ? $(this.config.availabilitySelector).text().trim()
        : 'in stock';

      const availability = this.parseAvailability(availabilityText);
      const category = this.inferCategory(name, description, 'bulk');

      return {
        name: this.normalizeProductName(name),
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

  private extractBrandFromCountrySquire(name: string, $element: cheerio.Cheerio<any>): string {
    // Country Squire has many house blends
    if (name.toLowerCase().includes('country squire') || 
        name.toLowerCase().includes('squire') ||
        $element.find('.house-blend').length > 0) {
      return 'The Country Squire';
    }

    // Check for other brands
    const commonBrands = [
      'Peterson', 'Dunhill', 'McClelland', 'Rattray', 'Solani', 
      'Sutliff', 'Lane', 'Cornell & Diehl', 'G.L. Pease', 'Samuel Gawith'
    ];

    for (const brand of commonBrands) {
      if (name.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Many products at Country Squire are house blends
    return 'The Country Squire';
  }

}