# Backend Development Notes

## Scraper Architecture
- When improvements are made to any scraper, consider if they should be made to other scrapers and the base scraper.
- The scraping system now includes advanced product classification, priority-based scheduling, and intelligent rate limiting.
- All scrapers inherit enhanced functionality from BaseScraper including change detection and respectful crawling patterns.

## Product Data Model
- Products now include priority levels (`standard`, `popular`, `limited_release`, `seasonal`, `discontinued`)
- Release types track special product categories (`regular`, `limited`, `seasonal`, `anniversary`, `exclusive`, `small_batch`)
- Popularity scoring system automatically updates based on search patterns, price volatility, and stock changes
- Price history includes availability tracking for comprehensive trend analysis

## Alert System Integration
- The backend integrates with the scraping alert system for real-time notifications
- Stock changes, price drops, and new product alerts are automatically generated
- Alert rules can be configured for specific brands, categories, or price thresholds