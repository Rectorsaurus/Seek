import { ScrapedProduct } from '../scrapers/BaseScraper';
import { IProduct } from '../models';

export interface ProductClassification {
  priority: 'standard' | 'popular' | 'limited_release' | 'seasonal' | 'discontinued';
  releaseType: 'regular' | 'limited' | 'seasonal' | 'anniversary' | 'exclusive' | 'small_batch';
  popularityScore: number;
}

export class ProductClassifier {
  private static instance: ProductClassifier;
  
  private limitedReleaseKeywords = [
    'limited', 'exclusive', 'small batch', 'anniversary', 'special edition',
    'collectors', 'reserve', 'vintage', 'aged', 'barrel aged', 'cask',
    'christmas', 'holiday', 'seasonal', 'limited edition', 'ltd',
    'commemorative', 'tribute', 'special release', 'rare'
  ];

  private seasonalKeywords = [
    'christmas', 'holiday', 'winter', 'spring', 'summer', 'fall', 'autumn',
    'easter', 'thanksgiving', 'halloween', 'seasonal', 'yuletide'
  ];

  private anniversaryKeywords = [
    'anniversary', '10th', '20th', '25th', '50th', '100th', 'centennial',
    'milestone', 'celebration', 'commemorative', 'jubilee'
  ];

  private exclusiveKeywords = [
    'exclusive', 'members only', 'vip', 'private', 'invitation only',
    'select', 'premium', 'signature', 'master', 'artisan'
  ];

  private smallBatchKeywords = [
    'small batch', 'micro batch', 'artisan', 'handcrafted', 'craft',
    'boutique', 'limited production', 'single batch'
  ];

  private limitedBrands = [
    'esoterica', 'mcclelland', 'gl pease', 'cornell & diehl', 'c&d',
    'seattle pipe club', 'drew estate', 'peter stokkebye', 'mac baren'
  ];

  private popularBrands = [
    'peterson', 'dunhill', 'captain black', 'lane', 'borkum riff',
    'carter hall', 'prince albert', 'amphora', 'sutliff'
  ];

  public static getInstance(): ProductClassifier {
    if (!ProductClassifier.instance) {
      ProductClassifier.instance = new ProductClassifier();
    }
    return ProductClassifier.instance;
  }

  public classifyProduct(product: ScrapedProduct | IProduct, existingData?: IProduct): ProductClassification {
    const name = product.name.toLowerCase();
    const brand = product.brand?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const fullText = `${name} ${brand} ${description}`;

    let priority: 'standard' | 'popular' | 'limited_release' | 'seasonal' | 'discontinued' = 'standard';
    let releaseType: 'regular' | 'limited' | 'seasonal' | 'anniversary' | 'exclusive' | 'small_batch' = 'regular';
    let popularityScore = 0;

    // Check for discontinued products
    const availability = 'availability' in product ? product.availability : 'in_stock';
    if (availability === 'discontinued' || fullText.includes('discontinued')) {
      priority = 'discontinued';
      releaseType = 'regular';
      return { priority, releaseType, popularityScore: -10 };
    }

    // Classify release type first
    if (this.containsKeywords(fullText, this.anniversaryKeywords)) {
      releaseType = 'anniversary';
      priority = 'limited_release';
      popularityScore += 30;
    } else if (this.containsKeywords(fullText, this.exclusiveKeywords)) {
      releaseType = 'exclusive';
      priority = 'limited_release';
      popularityScore += 25;
    } else if (this.containsKeywords(fullText, this.smallBatchKeywords)) {
      releaseType = 'small_batch';
      priority = 'limited_release';
      popularityScore += 20;
    } else if (this.containsKeywords(fullText, this.seasonalKeywords)) {
      releaseType = 'seasonal';
      priority = 'seasonal';
      popularityScore += 15;
    } else if (this.containsKeywords(fullText, this.limitedReleaseKeywords)) {
      releaseType = 'limited';
      priority = 'limited_release';
      popularityScore += 25;
    }

    // Adjust priority based on brand reputation
    if (this.limitedBrands.includes(brand)) {
      if (priority === 'standard') priority = 'popular';
      popularityScore += 15;
      
      // Esoterica gets special treatment - almost always limited
      if (brand === 'esoterica') {
        priority = 'limited_release';
        if (releaseType === 'regular') releaseType = 'limited';
        popularityScore += 20;
      }
    } else if (this.popularBrands.includes(brand)) {
      if (priority === 'standard') priority = 'popular';
      popularityScore += 10;
    }

    // Factor in existing popularity metrics if available
    if (existingData) {
      popularityScore += this.calculateHistoricalScore(existingData);
    }

    // Price-based adjustments (higher prices often indicate premium/limited items)
    const price = 'price' in product ? product.price : 0;
    if (price > 50) {
      popularityScore += 10;
      if (priority === 'standard') priority = 'popular';
    } else if (price > 100) {
      popularityScore += 20;
      if (priority !== 'limited_release') priority = 'popular';
    }

    // Availability-based adjustments
    if (availability === 'limited') {
      popularityScore += 15;
      if (priority === 'standard') priority = 'popular';
    }

    return { priority, releaseType, popularityScore: Math.max(0, popularityScore) };
  }

  public shouldPrioritizeScraping(product: IProduct): boolean {
    if (!product.priority) return false;
    
    return ['limited_release', 'seasonal'].includes(product.priority) ||
           (product.priority === 'popular' && product.popularityScore > 20);
  }

  public getScrapingFrequencyMinutes(priority: string): number {
    switch (priority) {
      case 'limited_release': return 15; // Every 15 minutes
      case 'seasonal': return 30; // Every 30 minutes
      case 'popular': return 120; // Every 2 hours
      case 'discontinued': return 10080; // Weekly
      default: return 1440; // Daily
    }
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private calculateHistoricalScore(product: IProduct): number {
    let score = 0;
    
    // Search count factor
    score += Math.min(product.searchCount * 2, 30);
    
    // Price volatility indicates popularity
    score += Math.min(product.priceVolatility * 10, 20);
    
    // Recent stock changes indicate high demand
    if (product.lastStockChange) {
      const daysSinceChange = Math.floor(
        (Date.now() - product.lastStockChange.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceChange < 7) score += 15;
      else if (daysSinceChange < 30) score += 10;
    }
    
    // Price history analysis
    product.retailers.forEach(retailer => {
      if (retailer.priceHistory.length > 1) {
        const priceChanges = retailer.priceHistory.length - 1;
        score += Math.min(priceChanges * 2, 15);
        
        // Frequent availability changes indicate high demand
        const availabilityChanges = retailer.priceHistory
          .slice(1)
          .filter((entry, i) => entry.availability !== retailer.priceHistory[i].availability)
          .length;
        score += Math.min(availabilityChanges * 3, 20);
      }
    });
    
    return Math.min(score, 50); // Cap at 50 additional points
  }

  public updatePopularityScore(product: IProduct): number {
    const baseScore = this.classifyProduct(product, product).popularityScore;
    const historicalScore = this.calculateHistoricalScore(product);
    return Math.min(baseScore + historicalScore, 100);
  }

  public identifyLimitedReleases(products: ScrapedProduct[]): ScrapedProduct[] {
    return products.filter(product => {
      const classification = this.classifyProduct(product);
      return classification.priority === 'limited_release' || 
             classification.releaseType !== 'regular';
    });
  }

  public detectNewLimitedRelease(product: ScrapedProduct): boolean {
    const classification = this.classifyProduct(product);
    return classification.priority === 'limited_release' || 
           classification.popularityScore > 40;
  }
}