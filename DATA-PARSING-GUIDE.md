# Data Parsing and Scraping Configuration Guide

This guide explains how to view, understand, and adjust the data parsing for scraped products in the Seek pipe tobacco price comparison platform.

## 📊 Understanding the Current Data Structure

### Example: "Angry Cornishman Full English" Product Data

```json
{
  "name": "Angry Cornishman Full English",
  "brand": "The Country Squire",           // ✅ Correctly identified as house brand
  "description": "",                       // ❌ Empty - not parsed properly
  "category": "english",                   // ✅ Correctly inferred from name
  "tobaccoType": ["virginia"],             // ⚠️  Basic inference, could be enhanced
  "imageUrl": "https://...",               // ✅ Successfully scraped
  "currentPrice": 0.2576,                  // ❌ This looks like per-gram, needs adjustment
  "availability": "in_stock",              // ✅ Working properly
  "retailerName": "The Country Squire"     // ✅ Fixed with recent updates
}
```

## 🔍 Viewing Product Data

### Via API
```bash
# Get all products with search
curl -s "http://localhost:3001/api/products/search?limit=5" | jq '.data[]'

# Get specific product by ID
curl -s "http://localhost:3001/api/products/68a8c8575ec1c17b9f1bfa9c" | jq '.data'

# Search for specific products
curl -s "http://localhost:3001/api/products/search?query=Angry%20Cornishman&limit=1" | jq '.data[0]'
```

### Via Database (if needed)
```bash
# Connect to MongoDB container
docker exec -it seek-mongodb-dev mongosh seek

# Query products
db.products.find({name: /Angry Cornishman/i}).pretty()
```

## ⚙️ Current Scraping Configuration

### The Country Squire Configuration
Location: `/Users/claytonrector/Code/Seek/docker/mongo-init.js`

```javascript
{
  name: 'The Country Squire',
  baseUrl: 'https://www.thecountrysquireonline.com',
  scrapingConfig: {
    productListUrl: 'https://www.thecountrysquireonline.com/product-category/tobacco/',
    productListSelector: '.product',                    // Each product container
    productLinkSelector: 'a.woocommerce-LoopProduct-link', // Link to product page
    nameSelector: '.woocommerce-loop-product__title',   // Product name
    priceSelector: '.price',                            // Price element
    brandSelector: '.brand',                            // Brand (likely not found)
    descriptionSelector: '.product-description',        // Description (likely not found)
    imageSelector: 'img.attachment-woocommerce_thumbnail', // Product image
    availabilitySelector: '.stock',                     // Stock status
    categorySelector: '.product-category',              // Category
    waitForSelector: '.product',                        // Wait for this before scraping
    delay: 1000                                         // Wait 1 second between requests
  }
}
```

### Smokingpipes.com Configuration
```javascript
{
  name: 'Smokingpipes.com',
  baseUrl: 'https://www.smokingpipes.com',
  scrapingConfig: {
    productListUrl: 'https://www.smokingpipes.com/tobacco/',
    productListSelector: '.product-item',
    productLinkSelector: 'a.product-link',
    nameSelector: '.product-title',
    priceSelector: '.price',
    // ... other selectors
  }
}
```

## 🛠️ How to Adjust Data Parsing

### Method 1: Update Database Configuration (Quick Fix)

Update CSS selectors directly in the database:

```bash
# Connect to MongoDB and update selectors for better data extraction
docker exec -it seek-mongodb-dev mongosh seek --eval '
db.retailers.updateOne(
  {name: "The Country Squire"}, 
  {$set: {
    "scrapingConfig.descriptionSelector": ".woocommerce-product-details__short-description, .product-short-description, .entry-summary p",
    "scrapingConfig.priceSelector": ".woocommerce-price-amount bdi, .price .amount, .price-current",
    "scrapingConfig.availabilitySelector": ".stock.in-stock, .stock.out-of-stock, .availability"
  }}
)'
```

### Method 2: Modify Core Parsing Logic

#### A. Fix Price Parsing
**File**: `/scraping/src/scrapers/BaseScraper.ts` (lines 50-54)

**Current code:**
```typescript
protected parsePrice(priceText: string): number {
  const cleanPrice = priceText.replace(/[^\d.,]/g, '');
  const price = parseFloat(cleanPrice.replace(',', ''));
  return isNaN(price) ? 0 : price;
}
```

**Enhanced version:**
```typescript
protected parsePrice(priceText: string): number {
  // Handle different price formats like "$12.99" or "$0.26/oz" 
  const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
  if (!priceMatch) return 0;
  
  let price = parseFloat(priceMatch[1]);
  
  // Convert per-ounce pricing to per-pound for consistency
  if (priceText.toLowerCase().includes('oz') || priceText.toLowerCase().includes('ounce')) {
    price = price * 16; // 16 ounces in a pound
  }
  
  // Handle bulk pricing (per pound indicators)
  if (priceText.toLowerCase().includes('lb') || priceText.toLowerCase().includes('pound')) {
    // Price is already per pound, no conversion needed
  }
  
  return price;
}
```

#### B. Enhance Description Extraction
**File**: `/scraping/src/scrapers/CountrySquireScraper.ts` (lines 65-67)

**Current code:**
```typescript
const description = this.config.descriptionSelector 
  ? $element.find(this.config.descriptionSelector).text().trim()
  : undefined;
```

**Enhanced version:**
```typescript
const description = this.config.descriptionSelector 
  ? $element.find(this.config.descriptionSelector).text().trim()
  : $element.find('.woocommerce-product-details__short-description, .product-summary, .entry-summary p, .product-excerpt').first().text().trim();
```

#### C. Improve Tobacco Type Detection
**File**: `/scraping/src/utils/dataProcessor.ts` (lines 110-132)

**Enhanced version:**
```typescript
private static extractTobaccoTypes(name: string, description?: string): string[] {
  const text = `${name} ${description || ''}`.toLowerCase();
  const types: string[] = [];

  const tobaccoTypeMap = {
    'virginia': ['virginia', 'bright virginia', 'red virginia', 'flue-cured'],
    'burley': ['burley', 'white burley'],
    'latakia': ['latakia', 'syrian latakia', 'cyprian latakia'],
    'oriental': ['oriental', 'turkish', 'smyrna', 'yenidje', 'izmir'],
    'perique': ['perique', 'louisiana perique'],
    'cavendish': ['cavendish', 'black cavendish'],
    'kentucky': ['kentucky', 'dark fired'],
    'maryland': ['maryland']
  };

  // Special handling for English blends like "Angry Cornishman Full English"
  if (text.includes('english') && !text.includes('breakfast')) {
    types.push('latakia', 'oriental', 'virginia'); // Typical English blend components
  }

  // Regular tobacco type detection
  for (const [type, keywords] of Object.entries(tobaccoTypeMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      types.push(type);
    }
  }

  return types.length > 0 ? types : ['virginia']; // default to virginia if none found
}
```

#### D. Enhanced Category Inference
**File**: `/scraping/src/scrapers/CountrySquireScraper.ts` (lines 189-212)

**Enhanced version:**
```typescript
private inferCategory(name: string, description?: string): 'aromatic' | 'english' | 'virginia' | 'burley' | 'latakia' | 'oriental' | 'perique' | 'cavendish' | 'bulk' | 'tinned' {
  const text = `${name} ${description || ''}`.toLowerCase();

  // Enhanced categorization logic
  if (text.includes('aromatic') || text.includes('vanilla') || text.includes('cherry') || 
      text.includes('caramel') || text.includes('rum') || text.includes('whiskey') ||
      text.includes('chocolate') || text.includes('honey') || text.includes('maple')) {
    return 'aromatic';
  } else if (text.includes('english') || text.includes('latakia') || text.includes('morning pipe') ||
             text.includes('balkan') || text.includes('oriental')) {
    return 'english';
  } else if (text.includes('virginia') || text.includes('bright') || text.includes('flue')) {
    return 'virginia';
  } else if (text.includes('burley') || text.includes('white burley')) {
    return 'burley';
  } else if (text.includes('perique') || text.includes('louisiana')) {
    return 'perique';
  } else if (text.includes('cavendish') || text.includes('black cavendish')) {
    return 'cavendish';
  } else if (text.includes('bulk') || text.includes('ounce') || text.includes('oz') || 
             text.includes('per oz') || text.includes('loose')) {
    return 'bulk';
  } else if (text.includes('tin') || text.includes('50g') || text.includes('100g')) {
    return 'tinned';
  }

  // Default for Country Squire (sells mostly bulk tobacco)
  return 'bulk';
}
```

### Method 3: Individual Product Page Scraping (Most Detailed)

**File**: `/scraping/src/scrapers/CountrySquireScraper.ts` (line 112+)

```typescript
async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  if (!this.page) {
    throw new Error('Scraper not initialized');
  }

  try {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await this.delay(this.config.delay);

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const name = $('.product_title, .entry-title, h1').first().text().trim();
    
    // Enhanced price extraction from product page
    const priceElement = $('.woocommerce-Price-amount bdi, .price ins .amount, .price .amount').first();
    const priceText = priceElement.text().trim();
    const price = this.parsePrice(priceText);

    if (!name || !price) {
      return null;
    }

    const brand = this.extractBrandFromCountrySquire(name, $('body'));

    // Get detailed description from multiple possible locations
    const detailedDescription = $('.woocommerce-product-details__short-description, .product-description, .entry-summary, .product-short-description')
      .map((i, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0)
      .join(' ');

    // Better image extraction
    const imageElement = $('.woocommerce-product-gallery__image img, .product-image img, .wp-post-image').first();
    const imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || imageElement.attr('data-large_image');

    // Enhanced availability detection
    const availabilityElement = $('.stock, .availability, .in-stock, .out-of-stock').first();
    const availabilityText = availabilityElement.text().trim() || availabilityElement.attr('class') || 'in stock';

    const availability = this.parseAvailability(availabilityText);
    const category = this.inferCategory(name, detailedDescription);

    return {
      name: this.normalizeProductName(name),
      brand,
      price,
      availability,
      productUrl: url,
      description: detailedDescription,
      imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${this.retailer.baseUrl}${imageUrl}`) : undefined,
      category
    };

  } catch (error) {
    console.error(`Error scraping product ${url}:`, error);
    return null;
  }
}
```

## 🧪 Testing Your Changes

### 1. Make Your Modifications
Edit the appropriate files based on the methods above.

### 2. Rebuild and Restart Services
```bash
make dev-down
make dev
```

### 3. Re-scrape the Data
```bash
# Re-scrape Country Squire specifically
make scrape-countrysquire

# Or re-scrape all retailers
make scrape-all
```

### 4. Verify the Changes
```bash
# Check updated product data
curl -s "http://localhost:3001/api/products/search?query=Angry%20Cornishman&limit=1" | jq '.data[0] | {
  name, 
  brand, 
  description, 
  currentPrice: .retailers[0].currentPrice, 
  tobaccoType,
  category
}'

# Check scraping statistics
make scrape-stats
```

## 🐛 Debugging Data Extraction

### Add Debug Logging

Add debug statements to see what the scraper is extracting:

**In CountrySquireScraper.ts (around line 46-56):**
```typescript
console.log(`Debug - Product: ${name}`);
console.log(`Debug - Price text: "${priceText}"`);
console.log(`Debug - Parsed price: ${price}`);
console.log(`Debug - Description found: ${!!description}`);
console.log(`Debug - Image URL: ${imageUrl}`);
console.log(`Debug - Availability: ${availabilityText} -> ${availability}`);
console.log('---');
```

### Inspect Raw HTML

To see what HTML the scraper is working with:

```typescript
// Add this to scrapeProducts() method
console.log('Raw HTML sample:', content.substring(0, 1000));
```

### Test Individual Elements

```bash
# Test a specific product URL manually
curl -s "https://www.thecountrysquireonline.com/product/angry-cornishman/" | grep -i "price\|description\|stock"
```

## 📝 Common Issues and Solutions

### Issue: Price showing as $0.26 instead of $4.16/oz
**Solution**: Update the `parsePrice()` method to handle per-ounce pricing (Method 2A above).

### Issue: Empty descriptions
**Solution**: Update `descriptionSelector` in database or enhance extraction logic (Method 1 or 2B).

### Issue: Incorrect tobacco types
**Solution**: Enhance the `extractTobaccoTypes()` method (Method 2C above).

### Issue: Wrong categories
**Solution**: Improve the `inferCategory()` method (Method 2D above).

## 🔄 Continuous Improvement

### Monitor Scraping Results
```bash
# Regular checks
make scrape-stats

# Check for failed scrapes
docker logs seek-scraping-dev | grep -i error

# Monitor database growth
curl -s "http://localhost:3001/api/products/search?limit=1" | jq '.pagination.total'
```

### Performance Optimization
- Adjust `delay` in scraping config if getting blocked
- Modify `waitForSelector` if pages load slowly
- Add retry logic for failed requests

### Adding New Retailers
1. Add new retailer configuration to `docker/mongo-init.js`
2. Create new scraper class extending `BaseScraper`
3. Add scraper selection logic to `scraping/src/scraper.ts`
4. Update Makefile with new scrape commands

## 📚 File Reference

- **Scraping Configuration**: `docker/mongo-init.js`
- **Base Scraper Logic**: `scraping/src/scrapers/BaseScraper.ts`
- **Country Squire Scraper**: `scraping/src/scrapers/CountrySquireScraper.ts`
- **Data Processing**: `scraping/src/utils/dataProcessor.ts`
- **Database Models**: `scraping/src/models/index.ts`
- **Main Scraper Service**: `scraping/src/scraper.ts`

For more advanced customizations, refer to the Playwright documentation for web scraping techniques and the Cheerio documentation for HTML parsing.