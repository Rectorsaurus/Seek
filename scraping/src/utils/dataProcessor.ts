import mongoose from 'mongoose';
import { Product, Retailer, IProduct, IRetailer, IRetailerProduct } from '../models';
import { ScrapedProduct } from '../scrapers';
import { AlertSystem } from './alertSystem';
import { ProductClassifier } from './productClassifier';

export class DataProcessor {
  private static alertSystem = AlertSystem.getInstance();
  private static classifier = ProductClassifier.getInstance();
  
  static async processScrapedProducts(
    scrapedProducts: ScrapedProduct[], 
    retailer: IRetailer
  ): Promise<void> {
    console.log(`Processing ${scrapedProducts.length} scraped products for ${retailer.name}`);
    
    for (const scrapedProduct of scrapedProducts) {
      try {
        await this.processProduct(scrapedProduct, retailer);
      } catch (error) {
        console.error(`Error processing product ${scrapedProduct.name}:`, error);
      }
    }

    // Update retailer's last scraped time
    await Retailer.findByIdAndUpdate(retailer._id, {
      lastScraped: new Date()
    });

    console.log(`Finished processing products for ${retailer.name}`);
  }

  private static async processProduct(
    scrapedProduct: ScrapedProduct, 
    retailer: IRetailer
  ): Promise<void> {
    
    // Primary matching: Find existing product by name and retailer (most reliable for deduplication)
    let existingProduct = await Product.findOne({
      name: new RegExp(`^${scrapedProduct.name}$`, 'i'),
      'retailers.retailerId': retailer._id
    });

    // If not found and we have a specific brand (not "Unknown"), try name + brand matching
    if (!existingProduct && scrapedProduct.brand && scrapedProduct.brand.toLowerCase() !== 'unknown') {
      existingProduct = await Product.findOne({
        name: new RegExp(`^${scrapedProduct.name}$`, 'i'),
        brand: new RegExp(`^${scrapedProduct.brand}$`, 'i')
      });
      
      // If found, check if this retailer already exists (avoid cross-retailer merging issues)
      if (existingProduct) {
        const hasThisRetailer = existingProduct.retailers.some(
          r => r.retailerId.toString() === retailer._id?.toString()
        );
        if (hasThisRetailer) {
          // Product exists with this retailer - use it
          console.log(`Found existing product with corrected brand: ${scrapedProduct.name} (${scrapedProduct.brand})`);
        } else {
          // Product exists but from different retailer - this is OK, same product different store
          existingProduct = null; // Will create new product for this retailer
        }
      }
    }

    // Final fallback: if brand is "Unknown", try to find existing product by name only 
    // (this helps merge Unknown brands with known brands)
    if (!existingProduct && scrapedProduct.brand?.toLowerCase() === 'unknown') {
      const nameOnlyProduct = await Product.findOne({
        name: new RegExp(`^${scrapedProduct.name}$`, 'i'),
        'retailers.retailerId': retailer._id
      });
      
      if (nameOnlyProduct) {
        existingProduct = nameOnlyProduct;
        console.log(`Found existing product for brand update: ${scrapedProduct.name} (${nameOnlyProduct.brand} → ${scrapedProduct.brand})`);
      }
    }

    const isNewProduct = !existingProduct;

    if (!existingProduct) {
      // Classify the new product
      const classification = this.classifier.classifyProduct(scrapedProduct);
      
      // Create new product
      existingProduct = new Product({
        name: scrapedProduct.name,
        brand: scrapedProduct.brand || 'Unknown',
        description: scrapedProduct.description,
        category: scrapedProduct.category || 'tinned',
        tobaccoType: this.extractTobaccoTypes(scrapedProduct.name, scrapedProduct.description),
        imageUrl: scrapedProduct.imageUrl,
        priority: classification.priority,
        releaseType: classification.releaseType,
        popularityScore: classification.popularityScore,
        searchCount: 0,
        priceVolatility: 0,
        retailers: []
      });
    }

    // Update or add retailer information
    const existingRetailerIndex = existingProduct.retailers.findIndex(
      r => r.retailerId.toString() === retailer._id?.toString()
    );

    const newRetailerProduct: IRetailerProduct = {
      retailerId: retailer._id as mongoose.Types.ObjectId,
      productUrl: scrapedProduct.productUrl,
      currentPrice: scrapedProduct.price,
      availability: scrapedProduct.availability || 'in_stock',
      lastScraped: new Date(),
      priceHistory: []
    } as IRetailerProduct;

    if (existingRetailerIndex >= 0) {
      // Update existing retailer product
      const existingRetailerProduct = existingProduct.retailers[existingRetailerIndex];
      
      const oldPrice = existingRetailerProduct.currentPrice;
      const oldAvailability = existingRetailerProduct.availability;
      
      // Add to price history if price has changed
      if (existingRetailerProduct.currentPrice !== scrapedProduct.price) {
        existingRetailerProduct.priceHistory.push({
          price: existingRetailerProduct.currentPrice,
          date: existingRetailerProduct.lastScraped,
          availability: existingRetailerProduct.availability
        });

        // Keep only last 100 price history entries
        if (existingRetailerProduct.priceHistory.length > 100) {
          existingRetailerProduct.priceHistory = existingRetailerProduct.priceHistory.slice(-100);
        }
        
        // Calculate and update price volatility
        const priceHistory = existingRetailerProduct.priceHistory;
        if (priceHistory.length > 1) {
          const prices = priceHistory.map(entry => entry.price);
          const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
          existingProduct.priceVolatility = Math.sqrt(variance) / mean;
        }
      }

      // Update current information
      existingRetailerProduct.currentPrice = scrapedProduct.price;
      existingRetailerProduct.availability = scrapedProduct.availability;
      existingRetailerProduct.lastScraped = new Date();
      existingRetailerProduct.productUrl = scrapedProduct.productUrl;
      
      existingProduct.retailers[existingRetailerIndex] = existingRetailerProduct;
      
      // Check for alerts on existing products
      if (!isNewProduct) {
        // Price change alert
        if (oldPrice !== scrapedProduct.price) {
          await this.alertSystem.checkPriceChange(existingProduct, oldPrice, scrapedProduct.price, retailer.name);
        }
        
        // Stock change alert
        if (oldAvailability !== scrapedProduct.availability) {
          await this.alertSystem.checkStockChange(existingProduct, oldAvailability, scrapedProduct.availability);
          existingProduct.lastStockChange = new Date();
        }
      }
    } else {
      // Add new retailer product
      existingProduct.retailers.push(newRetailerProduct);
    }

    // Update product metadata if we have better information
    if (scrapedProduct.description && !existingProduct.description) {
      existingProduct.description = scrapedProduct.description;
    }
    
    if (scrapedProduct.imageUrl && !existingProduct.imageUrl) {
      existingProduct.imageUrl = scrapedProduct.imageUrl;
    }
    
    // Update brand if we have better information (e.g., "Unknown" → actual brand)
    if (scrapedProduct.brand && 
        scrapedProduct.brand.toLowerCase() !== 'unknown' && 
        existingProduct.brand.toLowerCase() === 'unknown') {
      console.log(`Updating brand: ${existingProduct.name} (${existingProduct.brand} → ${scrapedProduct.brand})`);
      existingProduct.brand = scrapedProduct.brand;
    }
    
    // Update classification for existing products
    if (!isNewProduct) {
      const updatedClassification = this.classifier.classifyProduct(scrapedProduct, existingProduct);
      const oldPriority = existingProduct.priority;
      
      existingProduct.priority = updatedClassification.priority;
      existingProduct.releaseType = updatedClassification.releaseType;
      existingProduct.popularityScore = this.classifier.updatePopularityScore(existingProduct);
      
      // Log priority changes
      if (oldPriority !== updatedClassification.priority) {
        console.log(`📈 Priority changed for ${existingProduct.name}: ${oldPriority} → ${updatedClassification.priority}`);
      }
    }

    // Save the product
    await existingProduct.save();
    
    // Check for new product alert
    if (isNewProduct) {
      await this.alertSystem.checkNewProduct(existingProduct);
    }
  }

  private static extractTobaccoTypes(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();
    const types: string[] = [];

    const tobaccoTypeMap = {
      'virginia': ['virginia', 'bright virginia', 'red virginia'],
      'burley': ['burley', 'white burley'],
      'latakia': ['latakia', 'syrian latakia', 'cyprian latakia'],
      'oriental': ['oriental', 'turkish', 'smyrna', 'yenidje'],
      'perique': ['perique', 'louisiana perique'],
      'cavendish': ['cavendish', 'black cavendish'],
      'kentucky': ['kentucky', 'dark fired'],
      'maryland': ['maryland']
    };

    for (const [type, keywords] of Object.entries(tobaccoTypeMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        types.push(type);
      }
    }

    return types.length > 0 ? types : ['virginia']; // default to virginia if none found
  }

  static async getScrapingStats(): Promise<{
    totalProducts: number;
    totalRetailers: number;
    lastScrapedDates: { [retailerName: string]: Date | null };
    productsPerRetailer: { [retailerName: string]: number };
  }> {
    const totalProducts = await Product.countDocuments();
    const retailers = await Retailer.find({}, 'name lastScraped');
    
    const lastScrapedDates: { [retailerName: string]: Date | null } = {};
    const productsPerRetailer: { [retailerName: string]: number } = {};

    for (const retailer of retailers) {
      lastScrapedDates[retailer.name] = retailer.lastScraped || null;
      
      const productCount = await Product.countDocuments({
        'retailers.retailerId': retailer._id
      });
      
      productsPerRetailer[retailer.name] = productCount;
    }

    return {
      totalProducts,
      totalRetailers: retailers.length,
      lastScrapedDates,
      productsPerRetailer
    };
  }
}