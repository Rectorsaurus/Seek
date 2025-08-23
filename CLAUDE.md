# Seek - Pipe Tobacco Price Comparison

This project was created with Claude Code to build a comprehensive pipe tobacco price comparison platform with advanced limited release tracking capabilities.

## Development Commands

- **Start development environment**: `make dev` or `npm run dev`
- **Stop development environment**: `make dev-down`
- **View logs**: `make dev-logs`
- **Build all services**: `make build`
- **Run tests**: `make test`
- **Run linting**: `make lint`
- **Install dependencies**: `make install`

## Scraping Commands

### Basic Scraping
- **Run all scrapers**: `make scrape-all`
- **Run Smokingpipes scraper**: `make scrape-smokingpipes`  
- **Run Country Squire scraper**: `make scrape-countrysquire`
- **View scraping statistics**: `make scrape-stats`

### Enhanced Limited Release Tracking
- **Start dynamic scheduler**: `make scrape-scheduler`
- **Scan for limited releases**: `make scrape-limited`
- **View recent alerts**: `make scrape-alerts`
- **Monitor priority products**: `make scrape-monitor`

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
- **Scraping**: Advanced background service with intelligent scheduling and limited release detection

## URLs

- Frontend: http://localhost:5173 (dev) / http://localhost:3000 (prod)
- Backend API: http://localhost:3001/api
- API Health: http://localhost:3001/api/health

## Architecture

- **Backend**: TypeScript + Express + Mongoose
- **Frontend**: React + TypeScript + Vite + React Query
- **Database**: MongoDB with full-text search
- **Scraping**: Playwright + Cheerio with intelligent rate limiting, change detection, and priority-based scheduling
- **Deployment**: Docker Compose

## Target Retailers

- **Smokingpipes.com**: Premium pipe tobacco retailer with extensive limited releases
- **TheCountrySquireOnline.com**: Specialist retailer featuring exclusive and hard-to-find blends

### Retailer-Specific Features
- **Smart Brand Detection**: Automatic brand extraction and classification
- **Product Normalization**: Intelligent name cleaning and duplicate detection
- **Category Intelligence**: Automatic classification into tobacco types (English, Virginia, Aromatic, etc.)
- **Image and Description Extraction**: Comprehensive product data collection

## Enhanced Features

### 🎯 Limited Release Tracking System
- **Smart Detection**: Automatically identifies limited releases, seasonal items, and exclusive products
- **Priority Classification**: Products categorized as `standard`, `popular`, `limited_release`, `seasonal`, `discontinued`
- **Dynamic Scheduling**: Limited releases monitored every 15 minutes, popular items every 2 hours
- **Real-time Alerts**: Instant notifications for stock changes, price drops, and new releases

### 📊 Advanced Analytics
- **Popularity Scoring**: Dynamic scoring based on search frequency, price volatility, and stock turnover
- **Price Volatility Tracking**: Monitors price fluctuation patterns to identify high-demand items
- **Stock Change Detection**: Tracks availability changes with historical data
- **Brand Intelligence**: Special handling for premium brands like Esoterica, McClelland, GL Pease

### 🚨 Alert System
- **Stock Alerts**: Notifications when limited items go in/out of stock
- **Price Drop Alerts**: Alerts for significant price reductions on tracked items
- **New Release Alerts**: Immediate detection of newly added limited releases
- **Restock Notifications**: Special alerts when sold-out items become available

### ⚡ Intelligent Scraping
- **Respectful Rate Limiting**: 2-5 second delays with exponential backoff
- **Change Detection**: Only processes pages with actual content changes
- **Business Hours Awareness**: Increased delays during retailer peak times
- **Human-like Behavior**: Randomized user agents and request patterns

## Core Features

- Uses Playwright for robust web scraping with headless Chrome
- Implements comprehensive price history tracking and trend analysis  
- Real-time price comparison across multiple retailers
- Responsive design optimized for mobile and desktop
- Full-text search with filtering by brand, category, price, availability
- Docker-based development and deployment
- All page elements that are interactable or contain information should have an Accessibility id.