# Seek - Pipe Tobacco Price Comparison

A real-time price comparison website for pipe tobacco from multiple retailers. Compare prices, track historical data, and find the best deals across top tobacco retailers.

## Features

✨ **Real-time Price Comparison** - Compare prices across multiple retailers instantly
📊 **Price History Tracking** - Track price trends over time  
🔍 **Advanced Search** - Full-text search with filtering by brand, category, price, and availability
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
🤖 **Automated Scraping** - Keeps prices updated automatically
🏪 **Multi-Retailer Support** - Easy to add new retailers
📈 **Advanced Analytics** - GoatCounter integration for retailer click-through tracking and user behavior analysis

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript  
- **Database**: MongoDB with full-text search
- **Analytics**: GoatCounter with PostgreSQL for privacy-first tracking
- **Scraping**: Playwright + Cheerio for robust web scraping
- **Deployment**: Docker containers optimized for M4 Mac Mini

## Current Retailers

- **Smokingpipes.com** - Large selection of tinned and bulk tobacco
- **TheCountrySquireOnline.com** - Focus on artisanal and house blends

## Quick Start

### 🚀 Prerequisites

**Install Docker Desktop:**
```bash
# Install via Homebrew
brew install --cask docker

# Start Docker Desktop
open -a "Docker Desktop"

# Verify installation
docker --version
docker compose version
```

### Option 1: Automated Setup (Recommended) ✨

```bash
# Clone the repository
git clone <repository-url>
cd seek

# Run complete automated setup
make setup
```

**The setup script automatically:**
- ✅ Verifies Docker installation
- ✅ Creates all environment files
- ✅ Builds Docker images
- ✅ Starts all services
- ✅ Verifies everything is working

### Option 2: Manual Docker Setup

```bash
# Clone the repository
git clone <repository-url>
cd seek

# Start development environment
make dev
```

### Option 3: Local Development (No Docker)

```bash
# Install dependencies for all services
make install

# Copy environment files (already created by setup)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp scraping/.env.example scraping/.env

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Start services in separate terminals
cd backend && npm run dev      # Terminal 1
cd frontend && npm run dev     # Terminal 2
cd scraping && npm run dev     # Terminal 3 (optional)
```

### 🌐 Access Your Application

After startup:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **Analytics Dashboard**: http://localhost:8080 (GoatCounter)
- **Analytics API**: http://localhost:3001/api/analytics

## Development Commands

| Command | Description |
|---------|-------------|
| `make setup` | **🚀 Complete automated setup (first time)** |
| `make check-docker` | Verify Docker installation |
| `make dev` | Start development environment |
| `make dev-down` | Stop development environment |
| `make dev-logs` | View application logs |
| `make dev-build` | Rebuild containers |
| `make build` | Build all services |
| `make test` | Run all tests |
| `make lint` | Run linting |
| `make scrape-all` | Run all scrapers |
| `make scrape-stats` | View scraping statistics |
| `make analytics-setup` | Set up GoatCounter analytics |
| `make analytics-start` | Start analytics services |
| `make analytics-logs` | View analytics logs |
| `make help` | Show all available commands |

## Project Structure

```
seek/
├── backend/              # Express API server
│   ├── src/
│   │   ├── controllers/  # API route handlers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Express middleware
│   ├── Dockerfile & Dockerfile.dev
│   ├── .env             # Environment variables (auto-created)
│   └── package.json
├── frontend/             # React web application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   ├── Dockerfile & Dockerfile.dev
│   ├── .env             # Environment variables (auto-created)
│   └── package.json
├── scraping/             # Web scraping services
│   ├── src/
│   │   ├── scrapers/     # Individual retailer scrapers
│   │   ├── models/       # Data models
│   │   └── utils/        # Scraping utilities
│   ├── Dockerfile & Dockerfile.dev
│   ├── .env             # Environment variables (auto-created)
│   └── package.json
├── docker/               # Docker configurations
│   ├── docker-compose.yml
│   └── mongo-init.js
├── scripts/              # Setup and utility scripts
│   └── setup.sh         # Automated setup script
├── docker-compose.dev.yml  # Development Docker Compose
├── Makefile              # Development commands
├── QUICKSTART.md        # Quick start guide
└── deployment-guide.md   # Detailed deployment instructions
```

## Data Parsing and Scraping

### 📊 Understanding and Adjusting Scraped Data

For detailed information about how data is parsed from retailers and how to adjust the parsing logic, see:

**[📋 DATA-PARSING-GUIDE.md](DATA-PARSING-GUIDE.md)** - Complete guide to viewing, understanding, and modifying data extraction

This guide covers:
- How to view current product data via API and database
- Understanding the scraping configuration for each retailer
- Methods to fix common issues (price formatting, missing descriptions, etc.)
- Debugging tools and testing procedures
- Advanced customization techniques

## Adding a New Retailer

To add a new website to scrape, follow these steps:

### 1. Add Retailer Configuration to Database

First, add the retailer information to the MongoDB initialization script:

```javascript
// Edit: docker/mongo-init.js
db.retailers.insertOne({
  name: 'New Retailer Name',
  baseUrl: 'https://example.com',
  logoUrl: null, // Optional: URL to retailer logo
  scrapingConfig: {
    productListUrl: 'https://example.com/tobacco/',
    productListSelector: '.product-item',        // CSS selector for product containers
    productLinkSelector: 'a.product-link',       // CSS selector for product links
    nameSelector: '.product-title',              // CSS selector for product name
    priceSelector: '.price',                     // CSS selector for price
    brandSelector: '.brand',                     // Optional: brand selector
    descriptionSelector: '.description',         // Optional: description selector
    imageSelector: 'img.product-image',          // Optional: image selector
    availabilitySelector: '.availability',       // Optional: availability selector
    categorySelector: '.category',               // Optional: category selector
    waitForSelector: '.product-item',            // Selector to wait for before scraping
    delay: 1000                                  // Delay between requests (ms)
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 2. Create Custom Scraper Class

Create a new scraper class in `scraping/src/scrapers/`:

```typescript
// Create: scraping/src/scrapers/NewRetailerScraper.ts
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedProduct } from './BaseScraper';
import { IRetailer } from '../models';

export class NewRetailerScraper extends BaseScraper {
  constructor(retailer: IRetailer) {
    super(retailer);
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    // Implement product listing scraping logic
    // See SmokingpipesScraper.ts for reference
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    // Implement individual product scraping logic
    // See SmokingpipesScraper.ts for reference
  }

  // Add retailer-specific helper methods
  private extractCustomBrand(name: string): string {
    // Custom brand extraction logic
  }

  private inferCustomCategory(name: string, description?: string) {
    // Custom category inference logic
  }
}
```

### 3. Update Scraper Factory

Add the new scraper to the scraper service:

```typescript
// Edit: scraping/src/scraper.ts
import { NewRetailerScraper } from './scrapers/NewRetailerScraper';

// In the scrapeRetailer method, add:
if (retailer.name.toLowerCase().includes('new retailer')) {
  scraper = new NewRetailerScraper(retailer);
}
```

### 4. Export New Scraper

Update the scrapers index file:

```typescript
// Edit: scraping/src/scrapers/index.ts
export { NewRetailerScraper } from './NewRetailerScraper';
```

### 5. Add Scraping Command

Add a new command to the Makefile:

```makefile
# Edit: Makefile
scrape-newretailer:
	cd scraping && npm run scrape newretailer
```

### 6. Test the New Scraper

```bash
# Rebuild containers to include new retailer data
make dev-build

# Test the new scraper
cd scraping
npm run scrape newretailer

# Check scraping statistics
npm run scrape stats
```

### 7. Update Frontend (Optional)

If the retailer has specific branding or special handling needs, you might want to:

- Add retailer logo to `frontend/public/`
- Update retailer-specific styling in components
- Add any custom display logic for the retailer's products

## Configuration

### Environment Variables

**Backend (.env)**
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/seek
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:3001/api
```

**Scraping (.env)**
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/seek
SCRAPING_DELAY=1000
SCRAPING_TIMEOUT=30000
```

## API Endpoints

### Products
- `GET /api/products/search` - Search products with filters
- `GET /api/products/:id` - Get specific product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/brands` - Get all brands
- `GET /api/products/categories` - Get all categories

### Retailers
- `GET /api/retailers` - Get all active retailers
- `GET /api/retailers/:id` - Get specific retailer
- `GET /api/retailers/:id/stats` - Get retailer statistics

### Analytics
- `GET /api/analytics/overview` - Get overview statistics (views, clicks, conversion rates)
- `GET /api/analytics/retailer-clicks` - Get retailer click-through analytics with date filtering
- `GET /api/analytics/products` - Get product engagement analytics (views, clicks, conversion rates)
- `GET /api/analytics/search` - Get search query analytics and popular terms
- `GET /api/analytics/export` - Export analytics data as CSV or JSON

## 📊 Analytics & Reporting with GoatCounter

Seek includes comprehensive analytics powered by GoatCounter, providing privacy-first tracking of user behavior and retailer click-through performance.

### 🚀 Setting Up Analytics

#### Quick Setup
```bash
# Set up analytics (includes GoatCounter configuration)
make analytics-setup

# Start full environment with analytics
make dev
```

#### Manual Analytics Setup
```bash
# 1. Start analytics services
make analytics-start

# 2. Visit GoatCounter dashboard
open http://localhost:8080

# 3. Create your first site with code 'seek-tobacco'
# 4. Copy API key from settings
# 5. Update environment variables in .env files
```

### 📈 Generating Reports

#### 1. **Retailer Click-Through Reports**

Track which retailers are performing best and driving the most clicks from your platform.

**Via Web Dashboard:**
- Visit `http://localhost:5173/analytics`
- Select "Retailer Performance" tab
- Choose date range (Last 7 days, 30 days, 90 days, or custom)
- Export to CSV for external analysis

**Via API:**
```bash
# Get retailer click-through data for last 30 days
curl "http://localhost:3001/api/analytics/retailer-clicks?startDate=2025-01-01&endDate=2025-01-31"

# Filter by specific retailer
curl "http://localhost:3001/api/analytics/retailer-clicks?retailer=Smokingpipes&limit=10"

# Export as CSV
curl "http://localhost:3001/api/analytics/export?type=retailer_clicks&format=csv&startDate=2025-01-01" \
     -H "Accept: text/csv" > retailer_report.csv
```

**Report includes:**
- Total clicks per retailer
- Click-through conversion rates
- Top performing products per retailer
- Performance trends over time
- Revenue attribution (if integrated)

#### 2. **Product Engagement Analytics**

Understand which products generate the most interest and conversion.

**Via Web Dashboard:**
- Visit `http://localhost:5173/analytics`
- Select "Product Analytics" tab
- Filter by brand, category, or specific products
- View engagement metrics and export data

**Via API:**
```bash
# Get product analytics with views and clicks
curl "http://localhost:3001/api/analytics/products?startDate=2025-01-01&limit=25"

# Filter by specific product
curl "http://localhost:3001/api/analytics/products?product=PRODUCT_ID"

# Export product data
curl "http://localhost:3001/api/analytics/export?type=product_analytics&format=csv" > products.csv
```

**Report includes:**
- Product view counts
- Click-through rates to retailers  
- Conversion rates (views → clicks)
- Brand performance analysis
- Category engagement metrics

#### 3. **Search Query Analytics**

Monitor what users are searching for to optimize inventory and content.

**Via Web Dashboard:**
- Visit `http://localhost:5173/analytics`
- Select "Search Analytics" tab
- View popular search terms and trends
- Identify search patterns and opportunities

**Via API:**
```bash
# Get popular search queries
curl "http://localhost:3001/api/analytics/search?limit=50"

# Export search data
curl "http://localhost:3001/api/analytics/export?type=search_analytics&format=csv" > searches.csv
```

**Report includes:**
- Popular search terms
- Search frequency trends
- Zero-result searches (improvement opportunities)
- Search-to-click conversion rates

#### 4. **Overview & KPI Dashboard**

Get high-level metrics and key performance indicators.

**Via Web Dashboard:**
- Visit `http://localhost:5173/analytics` (Overview tab)
- View real-time metrics and trends
- Monitor overall platform performance

**Via API:**
```bash
# Get overview statistics
curl "http://localhost:3001/api/analytics/overview"

# Get overview for specific date range
curl "http://localhost:3001/api/analytics/overview?startDate=2025-01-01&endDate=2025-01-31"
```

**Dashboard includes:**
- Total page views and unique visitors
- Total retailer clicks and conversions
- Overall conversion rate (views → clicks)
- Search volume and engagement metrics
- Top performing retailers and products

### 📋 Advanced Reporting Features

#### Date Range Filtering
All analytics endpoints support flexible date filtering:
```bash
# Specific date range
?startDate=2025-01-01&endDate=2025-01-31

# Common presets available in web dashboard:
# - Last 7 days
# - Last 30 days  
# - Last 90 days
# - Custom date range
```

#### Data Export Options
Export data for external analysis:
```bash
# CSV format (default)
curl "...&format=csv" > report.csv

# JSON format for programmatic use
curl "...&format=json" > report.json
```

#### API Parameters
Common parameters across all analytics endpoints:
- `startDate` - Filter results from this date (YYYY-MM-DD)
- `endDate` - Filter results to this date (YYYY-MM-DD)  
- `limit` - Maximum number of results (default: 50)
- `retailer` - Filter by specific retailer name
- `product` - Filter by specific product ID

### 🔐 Privacy & Compliance

GoatCounter is designed with privacy first:
- **No cookies or personal data tracking**
- **GDPR compliant by design**
- **No cross-site tracking**
- **Respects Do Not Track headers**
- **Open source and transparent**

All analytics focus on aggregate behavior patterns rather than individual user tracking.

### 📊 Business Intelligence Integration

The analytics API can be integrated with business intelligence tools:

**Power BI / Tableau:**
- Use the JSON API endpoints as data sources
- Set up automated data refreshes
- Create custom dashboards and visualizations

**Google Sheets:**
- Import CSV exports for analysis
- Use Google Apps Script to automate data fetching
- Create charts and pivot tables

**Custom Reporting:**
- Build custom reports using the REST API
- Integrate with existing business systems
- Create automated email reports

### 🛠️ Analytics Maintenance

#### Regular Tasks
```bash
# Check analytics service health
curl http://localhost:8080/api/v0/health

# View analytics service logs
make analytics-logs

# Restart analytics if needed
make analytics-stop && make analytics-start
```

#### Database Maintenance
```bash
# Check GoatCounter database size
docker exec seek-goatcounter-db-dev psql -U goatcounter -d goatcounter -c "SELECT pg_size_pretty(pg_database_size('goatcounter'));"

# Reset analytics database (WARNING: deletes all data)
make analytics-reset
```

### 📈 Scaling Analytics

For high-traffic sites:
- GoatCounter can handle millions of page views
- PostgreSQL database scales well with proper indexing
- Consider read replicas for heavy reporting workloads
- Use connection pooling for high-volume API access

## Troubleshooting

### 🆘 First Steps
```bash
# Check Docker is running
make check-docker

# View all service logs
make dev-logs

# Check service status
docker ps
```

### Common Issues

**🐳 Docker Installation Issues**
```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop (correct command)
open -a "Docker Desktop"

# NOT: open -a Docker (this won't work)
```

**📦 Container Issues**
```bash
# Clean restart
make dev-down
make clean-docker
make dev

# Or use automated setup
make setup
```

**🗄️ MongoDB Connection Issues**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check MongoDB logs
docker logs seek-mongodb-dev

# MongoDB health check
curl http://localhost:3001/api/health
```

**🕷️ Scraping Issues**
```bash
# Check Playwright in container (no local install needed)
make scrape-stats

# Test individual scrapers
make scrape-smokingpipes
make scrape-countrysquire
```

**🌐 CORS/API Errors**
- Frontend can't reach backend
- Check that all services are running: `docker ps`
- Verify API health: `curl http://localhost:3001/api/health`

### 🔧 Quick Fixes

**Port Conflicts (3001, 5173, 27017 in use)**
```bash
# Find what's using the ports
sudo lsof -i :3001
sudo lsof -i :5173  
sudo lsof -i :27017

# Kill conflicting processes or stop other Docker containers
docker stop $(docker ps -q)
```

**Environment File Issues**
```bash
# Recreate all environment files
make setup
```

### 🆘 Getting Help

1. **First**: Run automated setup: `make setup`
2. **Check logs**: `make dev-logs`
3. **Verify Docker**: `make check-docker`
4. **Service status**: `docker ps`
5. **API health**: `curl http://localhost:3001/api/health`
6. **Clean restart**: `make dev-down && make dev`

### 📚 Additional Resources
- [QUICKSTART.md](QUICKSTART.md) - Step-by-step setup guide
- [DATA-PARSING-GUIDE.md](DATA-PARSING-GUIDE.md) - Complete data parsing and scraping guide
- [deployment-guide.md](deployment-guide.md) - Production deployment
- `make help` - All available commands

## 🚀 Production Deployment

### Quick Production Setup

**⚠️ SECURITY WARNING: The current development configuration has hardcoded passwords and is NOT production-ready. Follow these steps for secure deployment.**

1. **Run the automated production setup:**
   ```bash
   ./scripts/deploy-production.sh
   ```

2. **Manual production setup (if preferred):**
   ```bash
   # 1. Configure environment
   cp .env.production .env.production.local
   # Edit .env.production.local with your secure credentials
   
   # 2. Update domain in configurations
   sed -i 's/your-domain.com/yourdomain.com/g' docker/nginx.conf
   sed -i 's/your-domain.com/yourdomain.com/g' docker-compose.prod.yml
   
   # 3. Setup SSL certificates (Let's Encrypt)
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   
   # 4. Deploy with security
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 🛡️ Security Features Implemented

- **HTTPS/SSL**: Automatic Let's Encrypt SSL certificates
- **Reverse Proxy**: Nginx with security headers and rate limiting  
- **Database Security**: MongoDB authentication, no external port exposure
- **CORS Protection**: Domain-specific CORS configuration
- **Security Headers**: CSP, HSTS, XSS protection
- **Input Validation**: Request size limits and sanitization
- **Secrets Management**: Environment-based credential management

### 📋 Production Checklist

- [ ] Domain DNS configured to point to your server
- [ ] SSL certificates installed and verified
- [ ] Database credentials changed from defaults
- [ ] CORS origins configured for your domain
- [ ] Rate limiting tested and configured
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured
- [ ] Firewall rules configured (ports 80, 443 only)

### 🔧 Production Commands

| Command | Description |
|---------|-------------|
| `./scripts/deploy-production.sh` | **🚀 Complete secure production setup** |
| `docker-compose -f docker-compose.prod.yml up -d` | Start production services |
| `docker-compose -f docker-compose.prod.yml down` | Stop production services |
| `docker-compose -f docker-compose.prod.yml logs -f` | View production logs |
| `./scripts/backup-production.sh` | Create database backup |

### 📊 Monitoring

- **Application**: https://yourdomain.com
- **API Health**: https://yourdomain.com/api/health
- **SSL Status**: Check certificate expiration
- **Logs**: `docker-compose -f docker-compose.prod.yml logs -f`

For detailed deployment instructions, see [deployment-guide.md](deployment-guide.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

ISC License