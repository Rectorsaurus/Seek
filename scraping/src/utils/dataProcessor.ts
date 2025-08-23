import mongoose from 'mongoose';
import { Product, Retailer, IProduct, IRetailer, IRetailerProduct } from '../models';
import { ScrapedProduct } from '../scrapers';

export class DataProcessor {
  
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
    
    // Try to find existing product by name and brand
    let existingProduct = await Product.findOne({
      name: new RegExp(`^${scrapedProduct.name}$`, 'i'),
      brand: new RegExp(`^${scrapedProduct.brand || ''}$`, 'i')
    });

    if (!existingProduct) {
      // Create new product
      existingProduct = new Product({
        name: scrapedProduct.name,
        brand: scrapedProduct.brand || 'Unknown',
        description: scrapedProduct.description,
        category: scrapedProduct.category || 'tinned',
        tobaccoType: this.extractTobaccoTypes(scrapedProduct.name, scrapedProduct.description),
        imageUrl: scrapedProduct.imageUrl,
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
      }

      // Update current information
      existingRetailerProduct.currentPrice = scrapedProduct.price;
      existingRetailerProduct.availability = scrapedProduct.availability;
      existingRetailerProduct.lastScraped = new Date();
      existingRetailerProduct.productUrl = scrapedProduct.productUrl;
      
      existingProduct.retailers[existingRetailerIndex] = existingRetailerProduct;
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

    // Save the product
    await existingProduct.save();
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