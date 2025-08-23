// MongoDB initialization script
db = db.getSiblingDB('seek');

// Create collections
db.createCollection('products');
db.createCollection('retailers');

// Create indexes for better performance
db.products.createIndex({ name: 'text', brand: 'text', description: 'text' });
db.products.createIndex({ brand: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ 'retailers.currentPrice': 1 });
db.products.createIndex({ 'retailers.availability': 1 });

db.retailers.createIndex({ name: 1 }, { unique: true });
db.retailers.createIndex({ isActive: 1 });

// Insert initial retailer data
db.retailers.insertMany([
  {
    name: 'Smokingpipes.com',
    baseUrl: 'https://www.smokingpipes.com',
    logoUrl: null,
    scrapingConfig: {
      productListUrl: 'https://www.smokingpipes.com/tobacco/',
      productListSelector: 'article, .product, [data-testid*="product"], .product-item, div[id*="product"]',
      productLinkSelector: 'a[href*="/tobacco/"], a[href*="/pipe-tobacco/"], a.product-link, a[title]',
      nameSelector: 'h3 a, h2 a, .product-title, .product-name, h3, h2, [data-title], [title]:not(img)',
      priceSelector: '.price, [class*="price"]:not([class*="old"]), .cost, [data-price]',
      brandSelector: '.brand, .manufacturer, [class*="brand"], [data-brand]',
      descriptionSelector: '.description, .excerpt, [class*="desc"], [data-description]',
      imageSelector: 'img[src*="tobacco"], img[alt], img:first-of-type',
      availabilitySelector: '[class*="stock"], [class*="availability"], .in-stock, .out-of-stock, [data-availability]',
      categorySelector: '.category, [class*="category"], [data-category]',
      waitForSelector: 'article, .product, [data-testid*="product"]',
      delay: 2000
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'The Country Squire',
    baseUrl: 'https://www.thecountrysquireonline.com',
    logoUrl: null,
    scrapingConfig: {
      productListUrl: 'https://www.thecountrysquireonline.com/product-category/tobacco/',
      productListSelector: '.product',
      productLinkSelector: 'a.woocommerce-LoopProduct-link',
      nameSelector: '.woocommerce-loop-product__title',
      priceSelector: '.price',
      brandSelector: '.brand',
      descriptionSelector: '.product-description',
      imageSelector: 'img.attachment-woocommerce_thumbnail',
      availabilitySelector: '.stock',
      categorySelector: '.product-category',
      waitForSelector: '.product',
      delay: 1000
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully');