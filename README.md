# Seek - Pipe Tobacco Price Comparison

A real-time price comparison website for pipe tobacco from multiple retailers. Compare prices, track historical data, and find the best deals across top tobacco retailers.

## Features

✨ **Real-time Price Comparison** - Compare prices across multiple retailers instantly
📊 **Price History Tracking** - Track price trends over time  
🔍 **Advanced Search** - Full-text search with filtering by brand, category, price, and availability
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
🤖 **Automated Scraping** - Keeps prices updated automatically
🏪 **Multi-Retailer Support** - Easy to add new retailers

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript  
- **Database**: MongoDB with full-text search
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