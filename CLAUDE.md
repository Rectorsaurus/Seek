# Seek - Pipe Tobacco Price Comparison

This project was created with Claude Code to build a comprehensive pipe tobacco price comparison platform.

## Development Commands

- **Start development environment**: `make dev` or `npm run dev`
- **Stop development environment**: `make dev-down`
- **View logs**: `make dev-logs`
- **Build all services**: `make build`
- **Run tests**: `make test`
- **Run linting**: `make lint`
- **Install dependencies**: `make install`

## Scraping Commands

- **Run all scrapers**: `make scrape-all`
- **Run Smokingpipes scraper**: `make scrape-smokingpipes`  
- **Run Country Squire scraper**: `make scrape-countrysquire`
- **View scraping statistics**: `make scrape-stats`

## Project Structure

```
├── backend/          # Node.js + Express API server
├── frontend/         # React + Vite web application  
├── scraping/         # Playwright-based web scrapers
├── docker/          # Docker configurations
├── Makefile         # Development commands
└── deployment-guide.md
```

## Services

- **Backend**: REST API (Port 3001)
- **Frontend**: React SPA (Port 5173 in dev, 3000 in prod)
- **Database**: MongoDB (Port 27017)
- **Scraping**: Background service for data collection

## URLs

- Frontend: http://localhost:5173 (dev) / http://localhost:3000 (prod)
- Backend API: http://localhost:3001/api
- API Health: http://localhost:3001/api/health

## Architecture

- **Backend**: TypeScript + Express + Mongoose
- **Frontend**: React + TypeScript + Vite + React Query
- **Database**: MongoDB with full-text search
- **Scraping**: Playwright + Cheerio for web scraping
- **Deployment**: Docker Compose

## Target Retailers

- Smokingpipes.com
- TheCountrySquireOnline.com

## Notes

- Uses Playwright for robust web scraping with headless Chrome
- Implements price history tracking and trend analysis  
- Real-time price comparison across multiple retailers
- Responsive design optimized for mobile and desktop
- Full-text search with filtering by brand, category, price, availability
- Docker-based development and deployment
- All page elements that are interactable or contain information should have an Accessibility id.