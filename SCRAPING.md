# 🕷️ Enhanced Scraping System Documentation

## Overview

The Seek scraping system has been enhanced with advanced limited release tracking, intelligent scheduling, and real-time alert capabilities. This system is specifically designed to monitor pipe tobacco retailers for rare and limited releases while maintaining respectful scraping practices.

## 🎯 Core Features

### Product Classification System
Products are automatically classified into priority levels and release types:

**Priority Levels:**
- `standard` - Regular catalog items (scraped daily)
- `popular` - High-demand items (scraped every 2 hours)
- `limited_release` - Limited availability items (scraped every 15 minutes)
- `seasonal` - Seasonal/holiday items (scraped every 30 minutes)
- `discontinued` - No longer available (scraped weekly for confirmation)

**Release Types:**
- `regular` - Standard production items
- `limited` - Limited production runs
- `seasonal` - Holiday/seasonal releases
- `anniversary` - Anniversary or commemorative releases
- `exclusive` - Retailer exclusive items
- `small_batch` - Artisan/small batch productions

### Smart Detection Algorithms
The system automatically identifies limited releases using:

- **Keyword Detection**: "limited", "exclusive", "small batch", "anniversary", etc.
- **Brand Intelligence**: Special handling for premium brands (Esoterica, McClelland, GL Pease)
- **Price Analysis**: Higher prices often indicate premium/limited items
- **Stock Patterns**: Frequent availability changes suggest high demand
- **Historical Data**: Previous classification and popularity metrics

## 🚀 Usage

### Starting the Enhanced Scheduler
```bash
npm run scrape scheduler
```
This starts the dynamic scheduler that automatically adjusts scraping frequency based on product priority.

### Manual Commands
```bash
# Scan specifically for limited releases
npm run scrape limited

# View recent alerts
npm run scrape alerts

# Get detailed statistics including scheduler status
npm run scrape stats

# Traditional scraping (all products from all retailers)
npm run scrape all

# Retailer-specific scraping
npm run scrape smokingpipes
npm run scrape countrysquire
```

## 🔔 Alert System

The alert system provides real-time notifications for important events:

### Alert Types
1. **Stock Change Alerts** - When items go in/out of stock
2. **Price Drop Alerts** - Significant price reductions
3. **New Product Alerts** - Newly discovered products
4. **Restock Alerts** - Previously sold-out items back in stock
5. **Limited Release Alerts** - New limited releases detected

### Alert Priorities
- `urgent` - Limited releases becoming available
- `high` - Popular items going out of stock or significant price drops
- `medium` - Moderate changes on tracked items
- `low` - Minor changes on standard items

### Default Alert Rules
The system includes pre-configured rules for:
- **Esoterica Restocks** - Any Esoterica product coming back in stock
- **McClelland Seasonal** - Christmas Cheer and other seasonal releases
- **Significant Price Drops** - 15%+ price reductions on popular items
- **Limited Release Detection** - New products with high popularity scores

## 📊 Scraping Frequencies

| Priority Level | Scraping Frequency | Business Hours Only |
|---------------|-------------------|-------------------|
| Limited Release | Every 15 minutes | ✅ |
| Seasonal | Every 30 minutes | ✅ |
| Popular | Every 2 hours | ❌ |
| Standard | Daily at 3 AM | ❌ |
| Discontinued | Weekly | ❌ |

**Quick Availability Checks**: Limited releases get additional lightweight checks every 5 minutes for stock status only.

## 🤖 Intelligent Rate Limiting

The system implements respectful scraping practices:

### Adaptive Delays
- **Base delay**: 2-5 seconds between requests
- **Peak hour multiplier**: 1.5x during 9 AM - 5 PM EST
- **Random variation**: +0.5-1 seconds to appear human-like
- **Exponential backoff**: Automatic retry with increasing delays

### Request Management
- **Concurrent limits**: Maximum 1 request per retailer at a time
- **Error handling**: Automatic retry with backoff on failures
- **User agent rotation**: Multiple browser identities for variety
- **Request headers**: Full browser-like headers for authenticity

### Change Detection
- **Content checksums**: Only processes pages with actual changes
- **Selective updates**: Focus on price and availability changes
- **Historical comparison**: Tracks when products were last modified

## 📈 Popularity Scoring

Products receive dynamic popularity scores based on:

### Scoring Factors
- **Search count** (weight: 2x per search, max 30 points)
- **Price volatility** (weight: 10x volatility, max 20 points)
- **Recent stock changes** (15 points if changed in last 7 days)
- **Price history frequency** (2 points per price change, max 15 points)
- **Availability changes** (3 points per availability change, max 20 points)

### Score Ranges
- **0-20**: Standard items
- **21-40**: Popular items
- **41-60**: High-demand items
- **61-80**: Premium items
- **81-100**: Ultra-rare/exclusive items

## 🏪 Retailer-Specific Features

### Smokingpipes.com
- **Product name normalization** - Removes weight indicators and product codes
- **Brand extraction** - Comprehensive brand recognition for 40+ brands
- **Category inference** - Automatic tobacco type classification
- **Image extraction** - Product images with URL normalization

### TheCountrySquireOnline.com
- **Specialized selectors** - Optimized for their site structure
- **Bulk vs tinned detection** - Automatic packaging classification
- **Price parsing** - Handles various price formats

## 🔧 Technical Architecture

### Core Components
1. **ProductClassifier** - Handles product classification and scoring
2. **ScrapingScheduler** - Manages dynamic scheduling and task execution
3. **AlertSystem** - Processes and distributes alerts
4. **BaseScraper** - Enhanced base class with rate limiting and change detection
5. **DataProcessor** - Integrates all components for product processing

### Database Schema Extensions
```javascript
// New product fields
{
  priority: 'standard' | 'popular' | 'limited_release' | 'seasonal' | 'discontinued',
  releaseType: 'regular' | 'limited' | 'seasonal' | 'anniversary' | 'exclusive' | 'small_batch',
  popularityScore: Number, // 0-100
  searchCount: Number,
  lastStockChange: Date,
  priceVolatility: Number // Coefficient of variation
}
```

## 🚨 Monitoring & Maintenance

### Health Checks
The scheduler provides status information:
```bash
npm run scrape stats
```

### Log Monitoring
Watch for these log patterns:
- `🎯 Found X limited releases` - Limited release detection
- `🔄 Stock change: Product - old → new` - Stock changes
- `📈 Priority changed: Product - old → new` - Classification updates
- `🚨 New limited release detected!` - New high-priority items

### Performance Metrics
- **Total tasks by priority** - Distribution of scraping tasks
- **Alerts in last 24 hours** - Alert system activity
- **Next scheduled runs** - Upcoming scraping tasks
- **Product counts by retailer** - Coverage statistics

## 🔒 Ethical Scraping Practices

### Respect for Retailers
- **Conservative frequency** - No more than 1 request per 2 seconds minimum
- **Off-peak preference** - Reduced activity during business hours
- **Error respect** - Back off on errors to avoid overwhelming servers
- **Content-based scraping** - Only process changed content

### User Agent Rotation
Multiple realistic user agents prevent detection:
- macOS Chrome
- Windows Chrome  
- Linux Chrome

### Request Patterns
- **Randomized delays** - Vary request timing
- **Natural browsing** - Include realistic HTTP headers
- **Session management** - Proper cookie and session handling

## 🐛 Troubleshooting

### Common Issues

**Scheduler not starting:**
- Check database connection
- Verify MongoDB is running
- Review environment variables

**No alerts being generated:**
- Confirm alert rules are enabled
- Check product classification
- Verify alert system initialization

**Scraping errors:**
- Review rate limiting settings
- Check retailer site changes
- Verify selector configurations

**Memory usage:**
- Monitor task queue size
- Check price history limits (max 100 entries)
- Review alert retention (max 1000 alerts)

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=scraping:* npm run scrape scheduler
```

## 🔮 Future Enhancements

Potential improvements for the scraping system:

1. **Machine Learning Classification** - Improve limited release detection accuracy
2. **Webhook Integrations** - External notification systems (Discord, Slack, etc.)
3. **API Rate Limiting** - Respect retailer API limits if available
4. **Mobile App Integration** - Push notifications for mobile users
5. **Advanced Analytics** - Predictive modeling for stock-out patterns
6. **Multi-retailer Correlation** - Cross-retailer availability tracking